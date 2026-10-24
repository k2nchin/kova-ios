// File uploads for Kova. With Supabase configured the browser uploads straight
// to Supabase Storage through a signed URL (no Vercel body-size limit); without
// it, files go to the API's own disk (only for long-lived hosts and local dev).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MB = 1024 * 1024;
// Never accept types a browser could execute when the file URL is opened directly.
const BLOCKED_TYPES = /^(text\/html|application\/xhtml\+xml|image\/svg\+xml|application\/(x-)?javascript|text\/javascript)$/i;
export const UPLOAD_KINDS = {
  avatar: { maxBytes: 8 * MB, accept: /^image\// },
  banner: { maxBytes: 8 * MB, accept: /^image\// },
  story: { maxBytes: 25 * MB, accept: /^(image|video)\// },
  sound: { maxBytes: 2 * MB, accept: /^audio\// },
  attachment: { maxBytes: 25 * MB, accept: /.*/ },
};
const LOCAL_TICKET_TTL_MS = 15 * 60 * 1000;

export class UploadError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const supabase = () => {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'kova-uploads';
  return url && key ? { url, key, bucket } : null;
};

export const storageDriver = () => (supabase() ? 'supabase' : process.env.VERCEL ? 'none' : 'local');

const safeName = (name) => String(name || 'archivo').normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/\.{2,}/g, '.').replace(/^[._]+/, '').slice(-80) || 'archivo';

export const uploadsSchema = `CREATE TABLE IF NOT EXISTS upload_tickets (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, kind TEXT NOT NULL, object_path TEXT NOT NULL, content_type TEXT NOT NULL, max_bytes INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, expires_at TEXT NOT NULL);`;

/** Validates the request and returns where/how the client should upload the file. */
export async function createUploadTicket(db, userId, { kind, fileName, contentType, size }, publicBaseUrl) {
  const rule = UPLOAD_KINDS[kind];
  if (!rule) throw new UploadError(400, 'INVALID_KIND', 'Tipo de subida no válido.');
  const type = String(contentType || 'application/octet-stream').toLowerCase().slice(0, 100);
  if (BLOCKED_TYPES.test(type) || !rule.accept.test(type)) throw new UploadError(415, 'UNSUPPORTED_TYPE', 'Ese tipo de archivo no está permitido aquí.');
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) throw new UploadError(400, 'INVALID_SIZE', 'El archivo está vacío.');
  if (bytes > rule.maxBytes) throw new UploadError(413, 'FILE_TOO_LARGE', `El archivo supera el límite de ${Math.round(rule.maxBytes / MB)} MB.`);

  const objectPath = `${kind}/${userId}/${crypto.randomUUID()}-${safeName(fileName)}`;
  const config = supabase();
  if (config) {
    const response = await fetch(`${config.url}/storage/v1/object/upload/sign/${config.bucket}/${objectPath}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.key}`, apikey: config.key, 'content-type': 'application/json' },
      body: '{}',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      console.error('[Kova storage] Supabase sign failed', response.status, data?.message || data?.error);
      throw new UploadError(502, 'STORAGE_ERROR', 'No se pudo preparar la subida del archivo.');
    }
    return {
      uploadUrl: `${config.url}/storage/v1${data.url}`,
      method: 'PUT',
      headers: { 'content-type': type, 'x-upsert': 'false' },
      publicUrl: `${config.url}/storage/v1/object/public/${config.bucket}/${objectPath}`,
    };
  }
  if (storageDriver() === 'none') throw new UploadError(503, 'STORAGE_NOT_CONFIGURED', 'La subida de archivos no está configurada en este servidor.');

  const ticket = crypto.randomBytes(24).toString('hex');
  await db.prepare('INSERT INTO upload_tickets (id, owner_id, kind, object_path, content_type, max_bytes, used, expires_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
    .run(ticket, userId, kind, objectPath, type, Math.min(rule.maxBytes, bytes), new Date(Date.now() + LOCAL_TICKET_TTL_MS).toISOString());
  return {
    uploadUrl: `${publicBaseUrl}/api/uploads/local/${ticket}`,
    method: 'PUT',
    headers: { 'content-type': type },
    publicUrl: `${publicBaseUrl}/api/files/${objectPath}`,
  };
}

const localRoot = () => path.resolve(process.env.KOVA_UPLOADS_DIR || path.join(process.env.KOVA_DATA_DIR || './server/data', 'uploads'));

/** Local driver: stores the body of PUT /api/uploads/local/:ticket. */
export async function receiveLocalUpload(db, ticketId, req) {
  const ticket = await db.prepare('SELECT * FROM upload_tickets WHERE id = ?').get(ticketId);
  if (!ticket || Number(ticket.used) || Date.parse(ticket.expires_at) < Date.now()) throw new UploadError(404, 'TICKET_EXPIRED', 'La subida expiró. Inténtalo de nuevo.');
  await db.prepare('UPDATE upload_tickets SET used = 1 WHERE id = ?').run(ticketId);
  const chunks = []; let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > Number(ticket.max_bytes)) throw new UploadError(413, 'FILE_TOO_LARGE', 'El archivo es más grande de lo indicado.');
    chunks.push(chunk);
  }
  const target = path.join(localRoot(), ticket.object_path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.concat(chunks));
  fs.writeFileSync(`${target}.type`, ticket.content_type);
}

/** Local driver: serves GET /api/files/<path>. Returns false when not found. */
export function serveLocalFile(res, relativePath) {
  const root = localRoot();
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(root + path.sep) || target.endsWith('.type') || !fs.existsSync(target)) return false;
  const type = fs.existsSync(`${target}.type`) ? fs.readFileSync(`${target}.type`, 'utf8') : 'application/octet-stream';
  const inline = /^(image|video|audio)\//.test(type);
  res.writeHead(200, {
    'content-type': type,
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox",
    'cache-control': 'public, max-age=31536000, immutable',
    'access-control-allow-origin': '*',
    ...(inline ? {} : { 'content-disposition': 'attachment' }),
  });
  fs.createReadStream(target).pipe(res);
  return true;
}
