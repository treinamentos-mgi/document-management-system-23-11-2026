# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local da aplicação e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de documentos por usuário.
- Listagem dos documentos associados ao usuário da requisição.
- Download de um documento pelo identificador, respeitando o proprietário.
- Armazenamento local de arquivos com `multer` e `diskStorage`.
- Armazenamento dos metadados em memória.
- Interface React para envio, listagem e download, integrada à API via `/api`.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento, edição ou exclusão de documentos.
- Cadastro e autenticação de usuários.
- Persistência dos metadados após reinício do processo.
- Busca, filtros avançados e paginação.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando `multipart/form-data` no campo `file`. |
| RF-02 | O sistema gera um identificador único e armazena o arquivo em diretório local configurado. |
| RF-03 | O sistema registra os metadados do documento em memória após o armazenamento do arquivo. |
| RF-04 | O usuário pode listar somente os documentos associados à sua identificação. |
| RF-05 | O usuário pode baixar um documento pelo identificador quando ele lhe pertencer. |
| RF-06 | O sistema retorna erro apropriado quando o arquivo não existe, não pertence ao usuário ou não pode ser lido. |
| RF-07 | O sistema não usa o nome original como caminho físico de armazenamento. |
| RF-08 | A interface permite enviar um documento, exibir a lista recebida e solicitar o download de um documento. |
| RF-09 | A interface apresenta estados de carregamento e mensagens de erro para operações da API. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados no filesystem local via `multer` com `diskStorage`. |
| RNF-02 | O diretório de armazenamento, a porta do servidor e o limite de upload são configuráveis por variáveis de ambiente. |
| RNF-03 | O diretório padrão de armazenamento é `backend/storage`. |
| RNF-04 | Os metadados são mantidos em memória nesta fase e podem ser perdidos ao reiniciar o processo. |
| RNF-05 | O nome físico do arquivo é gerado pelo sistema para evitar colisões e traversal de diretório. |
| RNF-06 | Erros da API são retornados em JSON, exceto respostas de download. |
| RNF-07 | O backend respeita o fluxo `routes -> controllers -> services -> repositories`; camadas internas não dependem de Express. |
| RNF-08 | O frontend usa `fetch` e o prefixo `/api`, encaminhado pelo proxy do Vite ao backend. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, preferencialmente UUID. |
| `originalName` | string | Nome original fornecido no upload. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador do usuário associado ao documento. |

O repositório mantém também um `storageName` interno para localizar o arquivo no disco. Esse campo não é exposto pela API. `storageName` é gerado pelo sistema e não deriva diretamente de `originalName`.

## 6. Contratos de API

A API é consumida pelo frontend com prefixo `/api`. O proxy de desenvolvimento do Vite remove esse prefixo antes de encaminhar as chamadas ao Express.

### Identificação do usuário

As requisições de negócio recebem o cabeçalho `X-User-Id`. Na fase inicial, esse valor serve para associar e filtrar documentos; não representa autenticação nem uma fronteira de segurança. A ausência do cabeçalho resulta em `400 Bad Request`.

### `POST /api/upload`

- Cabeçalho: `X-User-Id: <identificador>`.
- Entrada: `multipart/form-data` com um arquivo no campo `file`.
- Sucesso: `201 Created`, corpo com os metadados públicos do documento criado.
- Erros: `400` para arquivo ausente ou entrada inválida; `413` para arquivo acima do limite configurado; `500` para falha inesperada de armazenamento.

### `GET /api/documents`

- Cabeçalho: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, corpo `{ "documents": [...] }`.
- A lista contém apenas documentos associados ao identificador recebido e é ordenada do mais recente para o mais antigo.

### `GET /api/documents/:id/download`

- Cabeçalho: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, conteúdo binário e `Content-Disposition` com o nome original do arquivo.
- Erros: `404 Not Found` quando o documento não existe ou não pertence ao usuário; `500` para falha de leitura.

### Formato de erro

Erros da API usam JSON no formato `{ "error": { "code": "CODIGO", "message": "Descrição" } }`.

## 7. Decisões arquiteturais

### Backend

- `routes/`: registra endpoints e conecta cada rota ao controller correspondente.
- `controllers/`: interpreta parâmetros, cabeçalhos e arquivos da requisição; valida a entrada HTTP e produz respostas HTTP. Não contém regras de negócio nem acesso direto ao filesystem.
- `services/`: concentra as regras de negócio, como associar o proprietário, aplicar validações de domínio e coordenar as operações do repositório.
- `repositories/`: encapsula os metadados em memória e o acesso aos arquivos no filesystem local. O nome físico do arquivo permanece um detalhe interno.
- Fluxo de dependência: `routes -> controllers -> services -> repositories`. Services e repositories não dependem de Express.
- O upload usa `multer` configurado com `diskStorage`; não são utilizados provedores externos.

### Frontend

- Componentes funcionais React ficam em `components/`; a composição da tela fica em `pages/` ou no componente raiz conforme a organização adotada no projeto.
- Um serviço em `services/` encapsula as chamadas `fetch` à API.
- A interface contempla envio, listagem, download, carregamento e apresentação de erros sem duplicar a lógica de comunicação HTTP nos componentes.

### Riscos e limites conhecidos

- `X-User-Id` não autentica o chamador. Como autenticação está fora do escopo, a propriedade do documento é uma regra funcional, não uma garantia de segurança contra falsificação de identidade.
- Metadados em memória se perdem no reinício. Arquivos podem permanecer no disco sem registro correspondente; persistência, reconciliação e limpeza ficam para uma fase posterior.
- O valor padrão do limite de upload deve ser definido durante a implementação, considerando o ambiente de execução, e pode ser sobrescrito por variável de ambiente.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura em nível funcional. Esta especificação não executa mudanças nos arquivos de backend ou frontend.

1. Preparar configuração e armazenamento local: definir variáveis de ambiente, criar o diretório configurado quando necessário, configurar `multer` com `diskStorage` e estabelecer o limite de upload. **Aceite:** arquivos ficam em armazenamento local, com nome físico gerado pelo sistema; falhas não criam metadados válidos.
2. Implementar repositórios para metadados em memória e leitura/escrita de arquivos locais. **Aceite:** a persistência fica encapsulada nos repositórios e os metadados públicos não revelam o nome físico.
3. Implementar services com regras de upload, listagem por proprietário e obtenção de arquivo para download. **Aceite:** regras de negócio não dependem de Express e documentos de outro proprietário não são retornados.
4. Implementar controllers e routes para os três endpoints, com validação da entrada HTTP e formato consistente de erro. **Aceite:** status, corpo e erros seguem os contratos desta especificação.
5. Implementar o serviço de API e a interface React para envio, listagem e download. **Aceite:** a interface usa `/api`, apresenta estados de carregamento e erros e permite concluir os três fluxos.
6. Validar o fluxo integrado e os limites definidos. **Aceite:** testes cobrem upload válido e inválido, listagem por usuário, download autorizado e não autorizado, limite de tamanho e falhas de leitura ou escrita.