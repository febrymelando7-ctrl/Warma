import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Foto & video produk disimpan di folder "uploads" di akar proyek (di luar public),
// lalu disajikan lewat /api/uploads/<nama-file> supaya langsung tampil tanpa build ulang.
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const URL_PREFIX = '/api/uploads/';
const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm' };
export const mimeOf = (name) => TYPES[name.split('.').pop()];
export const isVideo = (ext) => ext === 'mp4' || ext === 'webm';

// Cek jenis file dari isinya (bukan dari nama file)
export function sniff(buf) {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
    if (buf.subarray(4, 8).toString('ascii') === 'ftyp') return 'mp4';
    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm';
  }
  return null;
}

export async function saveBuffer(buf, ext, userId, prefix = '') {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${prefix}${userId}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return URL_PREFIX + name;
}

export async function saveImage(buf, userId) {
  const ext = sniff(buf);
  return ext && !isVideo(ext) ? saveBuffer(buf, ext, userId) : null;
}

export async function removeImage(url) {
  if (!url || !String(url).startsWith(URL_PREFIX)) return;
  await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
}
