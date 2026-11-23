const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function getStorageDirectory() {
  return process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage');
}

function ensureStorageDirectory() {
  const directory = getStorageDirectory();
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function getMaxFileSize() {
  const configuredSize = Number(process.env.MAX_FILE_SIZE);
  return Number.isSafeInteger(configuredSize) && configuredSize > 0
    ? configuredSize
    : DEFAULT_MAX_FILE_SIZE;
}

module.exports = {
  ensureStorageDirectory,
  getMaxFileSize,
  getStorageDirectory,
};