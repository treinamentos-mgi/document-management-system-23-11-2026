import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('usuario-demo');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const owner = userId.trim();
    const controller = new AbortController();

    setError('');
    if (!owner) {
      setDocuments([]);
      setIsLoading(false);
      return () => controller.abort();
    }

    setIsLoading(true);
    listDocuments(owner, { signal: controller.signal })
      .then(setDocuments)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setDocuments([]);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [userId, refreshVersion]);

  async function handleUpload(file) {
    setError('');
    setNotice('');
    setIsUploading(true);

    try {
      await uploadDocument(file, userId.trim());
      setNotice('Documento enviado.');
      setRefreshVersion((version) => version + 1);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setError('');
    setNotice('');
    setDownloadingId(document.id);

    try {
      await downloadDocument(document, userId.trim());
      setNotice(`Download iniciado: ${document.originalName}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS</span>
        </a>
        <label className="user-field" htmlFor="user-id">
          <span>Identificação</span>
          <input
            id="user-id"
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value);
              setError('');
              setNotice('');
            }}
            autoComplete="off"
            placeholder="Informe seu usuário"
          />
        </label>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO</p>
            <h1>Documentos</h1>
          </div>
          <span className="document-total" aria-live="polite">
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
          </span>
        </div>

        {error && <p className="feedback feedback-error" role="alert">{error}</p>}
        {notice && <p className="feedback feedback-success" role="status">{notice}</p>}

        <div className="content-grid">
          <section className="upload-panel" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar arquivo</h2>
            </div>
            <UploadComponent
              disabled={!userId.trim()}
              uploading={isUploading}
              onUpload={handleUpload}
            />
          </section>

          <section className="documents-panel" aria-labelledby="documents-heading">
            <DocumentList
              documents={documents}
              downloadingId={downloadingId}
              loading={isLoading}
              onDownload={handleDownload}
              onRefresh={refreshDocuments}
              refreshing={isLoading}
              userId={userId.trim()}
              titleId="documents-heading"
            />
          </section>
        </div>
      </main>
    </div>
  );
}
