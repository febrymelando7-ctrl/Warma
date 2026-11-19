import fs from 'fs/promises';
import path from 'path';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { UPLOAD_DIR, mimeOf } from '@/lib/uploads';

const notFound = () => new Response('Not found', { status: 404 });

// Foto chat bersifat privat: hanya pengunggah dan peserta percakapan yang boleh melihat
export async function GET(_req, { params }) {
  const { name } = await params;
  const m = /^c(\d+)-[\w-]+\.(jpg|png|webp)$/.exec(name);
  if (!m) return notFound();
  const u = await getUser();
  if (!u) return new Response('Unauthorized', { status: 401 });
  try {
    let ok = Number(m[1]) === u.id;
    if (!ok) {
      const r = (await query('SELECT t.buyer_id, t.seller_id FROM chat_messages cm JOIN chat_threads t ON t.id = cm.thread_id WHERE cm.gambar = ? LIMIT 1', ['/api/chat/img/' + name]))[0];
      ok = !!r && (r.buyer_id === u.id || r.seller_id === u.id);
    }
    if (!ok) return notFound();
    return new Response(await fs.readFile(path.join(UPLOAD_DIR, name)), { headers: { 'Content-Type': mimeOf(name), 'Cache-Control': 'private, max-age=86400' } });
  } catch { return notFound(); }
}
