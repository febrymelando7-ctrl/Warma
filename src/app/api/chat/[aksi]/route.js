import path from 'path';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { MSG_SQL, mapMsg, markRead } from '@/lib/chat';
import { saveBuffer, sniff, isVideo, URL_PREFIX } from '@/lib/uploads';

const IMG = '/api/chat/img/';

const j = (o, s = 200) => NextResponse.json(o, { status: s });
const bad = (e, s = 400) => j({ error: e }, s);
const DB = 'Chat belum siap. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.';
const member = async (thread, uid) => (await query('SELECT * FROM chat_threads WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', [thread, uid, uid]))[0];

// Buka (atau buat) percakapan dengan seorang penjual
async function mulai(u, req) {
  const b = await req.json().catch(() => ({}));
  const sid = Number(b.seller_id);
  if (sid === u.id) return bad('Ini tokomu sendiri.');
  if (!(await query("SELECT id FROM users WHERE id = ? AND peran = 'penjual'", [sid])).length) return bad('Penjual tidak ditemukan.', 404);
  await query('INSERT IGNORE INTO chat_threads (buyer_id, seller_id) VALUES (?,?)', [u.id, sid]);
  const t = (await query('SELECT id FROM chat_threads WHERE buyer_id = ? AND seller_id = ?', [u.id, sid]))[0];
  return j({ ok: true, id: t.id });
}

// Kirim pesan (teks dan/atau kartu produk)
async function kirim(u, req) {
  const b = await req.json().catch(() => ({}));
  const t = await member(b.thread, u.id);
  if (!t) return bad('Percakapan tidak ditemukan.', 404);
  const isi = String(b.isi || '').trim().slice(0, 1000);
  let pid = null;
  if (b.product_id) pid = (await query('SELECT id FROM products WHERE id = ?', [b.product_id]))[0]?.id ?? null;
  let gambar = null;
  if (b.gambar) { const g = String(b.gambar); if (g.startsWith(IMG) && path.basename(g).startsWith(`c${u.id}-`)) gambar = g; }
  if (!isi && !pid && !gambar) return bad('Pesan tidak boleh kosong.');
  const recent = Number((await query('SELECT COUNT(*) AS n FROM chat_messages WHERE sender_id = ? AND created_at > (NOW() - INTERVAL 10 SECOND)', [u.id]))[0].n);
  if (recent >= 8) return bad('Terlalu cepat, tunggu sebentar.', 429);

  const buyerSends = t.buyer_id === u.id;
  const recipient = buyerSends ? t.seller_id : t.buyer_id;
  const wasRead = (buyerSends ? t.seller_read_id : t.buyer_read_id) >= t.last_msg_id; // pesan sebelumnya sudah dibaca penerima
  const r = await query('INSERT INTO chat_messages (thread_id, sender_id, isi, product_id, gambar) VALUES (?,?,?,?,?)', [t.id, u.id, isi, pid, gambar]);
  const preview = (isi || (gambar ? '[Foto]' : '[Produk]')).slice(0, 200);
  await query(`UPDATE chat_threads SET last_msg_id = ?, last_sender = ?, last_message = ?, last_at = NOW(), ${buyerSends ? 'buyer_read_id' : 'seller_read_id'} = ? WHERE id = ?`, [r.insertId, u.id, preview, r.insertId, t.id]);
  if (wasRead) await notify(recipient, 'Pesan baru', `${u.nama}: ${preview.slice(0, 80)}`, `/chat?c=${t.id}`, 'chat_baru');
  const m = (await query(`${MSG_SQL} WHERE m.id = ?`, [r.insertId]))[0];
  return j({ ok: true, message: mapMsg(m, u.id) });
}

// Unggah foto untuk dikirim di chat (JPG/PNG/WebP, maks. 3 MB). Hanya bisa dilihat peserta percakapan.
async function foto(u, req) {
  const file = (await req.formData()).get('file');
  if (!file || typeof file === 'string') return bad('Pilih foto terlebih dahulu.');
  if (file.size > 3 * 1024 * 1024) return bad('Ukuran foto maksimal 3 MB.', 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext || isVideo(ext)) return bad('Format foto harus JPG, PNG, atau WebP.', 415);
  const url = (await saveBuffer(buf, ext, u.id, 'c')).replace(URL_PREFIX, IMG);
  return j({ ok: true, url });
}

// Ambil pesan baru (dipanggil berkala oleh jendela chat) dan tandai dibaca
async function pesan(u, req) {
  const sp = new URL(req.url).searchParams;
  const thread = Number(sp.get('thread')), after = Number(sp.get('after')) || 0;
  if (!(await member(thread, u.id))) return bad('Percakapan tidak ditemukan.', 404);
  const rows = await query(`${MSG_SQL} WHERE m.thread_id = ? AND m.id > ? ORDER BY m.id LIMIT 200`, [thread, after]);
  await markRead(thread, u.id);
  return j({ messages: rows.map((r) => mapMsg(r, u.id)) });
}

const H = { mulai: { POST: mulai }, kirim: { POST: kirim }, foto: { POST: foto }, pesan: { GET: pesan } };
async function run(method, req, { params }) {
  const { aksi } = await params;
  const fn = H[aksi]?.[method];
  if (!fn) return bad('Tidak ditemukan.', 404);
  const u = await getUser();
  if (!u) return bad('Silakan masuk dulu.', 401);
  try { return await fn(u, req); } catch { return bad(DB, 500); }
}
export const GET = (r, c) => run('GET', r, c);
export const POST = (r, c) => run('POST', r, c);
