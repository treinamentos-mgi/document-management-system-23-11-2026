import { useRef, useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ disabled, onUpload, uploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || uploading || disabled) return;

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-drop" htmlFor="document-file">
        <span className="upload-symbol" aria-hidden="true">+</span>
        <span className="file-prompt">{selectedFile ? 'Arquivo selecionado' : 'Escolha um arquivo'}</span>
        <span className="file-hint">ou solte aqui</span>
        <input
          ref={inputRef}
          id="document-file"
          type="file"
          disabled={disabled || uploading}
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />
      </label>

      {selectedFile && (
        <div className="selected-file" aria-live="polite">
          <span className="selected-file-name">{selectedFile.name}</span>
          <span>{formatFileSize(selectedFile.size)}</span>
        </div>
      )}

      <button className="primary-button upload-submit" type="submit" disabled={!selectedFile || disabled || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}