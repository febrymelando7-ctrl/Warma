import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR, mimeOf } from '@/lib/uploads';

const notFound = () => new Response('Not found', { status: 404 });

// Menyajikan foto & video. Video mendukung permintaan Range supaya bisa di-seek dan mulai diputar cepat.
export async function GET(req, { params }) {
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp|mp4|webm)$/.test(name) || /^c\d/.test(name)) return notFound(); // foto chat bersifat privat
  const file = path.join(UPLOAD_DIR, name);
  const type = mimeOf(name);
  const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable' };
  try {
    const size = (await fs.stat(file)).size;
    const range = req.headers.get('range');
    if (!range || !type.startsWith('video/')) {
      return new Response(await fs.readFile(file), { headers: { ...base, 'Content-Length': String(size) } });
    }
    const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    let start, end;
    if (m[1] === '' && m[2] !== '') { start = Math.max(0, size - parseInt(m[2], 10)); end = size - 1; }
    else { start = m[1] ? parseInt(m[1], 10) : 0; end = m[2] ? parseInt(m[2], 10) : Math.min(start + 2 * 1024 * 1024 - 1, size - 1); }
    end = Math.min(end, size - 1);
    if (!(start <= end) || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    const fh = await fs.open(file, 'r');
    try {
      const buf = Buffer.alloc(end - start + 1);
      await fh.read(buf, 0, buf.length, start);
      return new Response(buf, { status: 206, headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(buf.length) } });
    } finally { await fh.close(); }
  } catch { return notFound(); }
}
