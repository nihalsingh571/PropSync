// server/middleware/upload.js — PropSync v2
// Multer config for local disk storage (serves from /uploads/)
// Max 5 MB per file, accepts images only, max 5 files per request

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Convenience wrappers
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 5);

// Helper: convert multer file(s) to public URL paths
export const filesToUrls = (files, baseUrl = '') =>
  (files || []).map(f => `${baseUrl}/uploads/${f.filename}`);

export const fileToUrl = (file, baseUrl = '') =>
  file ? `${baseUrl}/uploads/${file.filename}` : null;
