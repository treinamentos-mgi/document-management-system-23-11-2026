const documentService = require('../services/documentService');

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id');
  if (!owner || !owner.trim()) {
    return res.status(400).json({
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'O cabeçalho X-User-Id é obrigatório.',
      },
    });
  }

  req.owner = owner.trim();
  return next();
}

async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie um arquivo no campo file.',
      },
    });
  }

  const document = await documentService.createDocument({
    id: req.uploadId,
    originalName: req.file.originalname,
    size: req.file.size,
    owner: req.owner,
    storageName: req.file.filename,
  });

  return res.status(201).json(document);
}

function listDocuments(req, res) {
  return res.json({ documents: documentService.listDocuments(req.owner) });
}

function downloadDocument(req, res, next) {
  const document = documentService.getDocumentForDownload(req.params.id, req.owner);
  if (!document) {
    return res.status(404).json({
      error: {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      },
    });
  }

  return res.download(document.filePath, document.originalName, (error) => {
    if (error && !res.headersSent) {
      res.status(500).json({
        error: {
          code: 'FILE_READ_ERROR',
          message: 'Não foi possível ler o arquivo.',
        },
      });
    } else if (error) {
      next(error);
    }
  });
}

module.exports = {
  downloadDocument,
  listDocuments,
  requireOwner,
  uploadDocument,
};