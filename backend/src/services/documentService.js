const documentRepository = require('../repositories/documentRepository');
const localFileRepository = require('../repositories/localFileRepository');

async function createDocument({ id, originalName, size, owner, storageName }) {
  const document = {
    id,
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName,
  };

  try {
    return documentRepository.add(document);
  } catch (error) {
    await localFileRepository.remove(storageName);
    throw error;
  }
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner);
}

function getDocumentForDownload(id, owner) {
  const document = documentRepository.findByIdAndOwner(id, owner);
  if (!document) {
    return null;
  }

  return {
    originalName: document.originalName,
    filePath: localFileRepository.getFilePath(document.storageName),
  };
}

module.exports = {
  createDocument,
  getDocumentForDownload,
  listDocuments,
};