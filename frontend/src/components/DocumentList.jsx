import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Data indisponível'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

export default function DocumentList({
  documents,
  downloadingId,
  loading,
  onDownload,
  onRefresh,
  refreshing,
  userId,
  titleId,
}) {
  return (
    <>
      <div className="section-heading list-heading">
        <div className="list-title">
          <span className="section-index">02</span>
          <h2 id={titleId}>Arquivos enviados</h2>
        </div>
        <button className="refresh-button" type="button" onClick={onRefresh} disabled={refreshing || !userId}>
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {loading ? (
        <p className="list-message" role="status">Carregando documentos...</p>
      ) : documents.length === 0 ? (
        <p className="list-message">Nenhum documento encontrado.</p>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="file-badge" aria-hidden="true">DOC</span>
              <div className="document-details">
                <span className="document-name" title={document.originalName}>{document.originalName}</span>
                <span className="document-meta">
                  {formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatUploadDate(document.uploadedAt)}
                </span>
              </div>
              <DownloadButton
                disabled={!userId}
                loading={downloadingId === document.id}
                onClick={() => onDownload(document)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}