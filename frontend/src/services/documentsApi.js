const API_PREFIX = '/api';

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function ensureSuccess(response) {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response;
}

export async function listDocuments(userId, { signal } = {}) {
  const response = await fetch(`${API_PREFIX}/documents`, {
    headers: userHeaders(userId),
    signal,
  });
  const body = await (await ensureSuccess(response)).json();
  return body.documents;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData,
  });
  return (await ensureSuccess(response)).json();
}

export async function downloadDocument(document, userId) {
  const response = await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(document.id)}/download`,
    { headers: userHeaders(userId) },
  );
  const file = await (await ensureSuccess(response)).blob();
  const downloadUrl = URL.createObjectURL(file);
  const link = window.document.createElement('a');
  link.href = downloadUrl;
  link.download = document.originalName;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}