const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const {
  ensureStorageDirectory,
  getMaxFileSize,
} = require('../config/storageConfig');

const router = express.Router();
const storage = multer.diskStorage({
  destination(req, file, callback) {
    try {
      callback(null, ensureStorageDirectory());
    } catch (error) {
      callback(error);
    }
  },
  filename(req, file, callback) {
    req.uploadId = crypto.randomUUID();
    callback(null, req.uploadId);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: getMaxFileSize() },
});

router.post(
  '/upload',
  documentController.requireOwner,
  upload.single('file'),
  documentController.uploadDocument,
);
router.get('/documents', documentController.requireOwner, documentController.listDocuments);
router.get(
  '/documents/:id/download',
  documentController.requireOwner,
  documentController.downloadDocument,
);

module.exports = router;