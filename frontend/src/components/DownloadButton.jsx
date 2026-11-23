export default function DownloadButton({ disabled, loading, onClick }) {
  return (
    <button className="download-button" type="button" disabled={disabled || loading} onClick={onClick}>
      {loading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}