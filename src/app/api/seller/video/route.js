import path from 'path';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { removeImage, URL_PREFIX } from '@/lib/uploads';

async function seller() { const u = await getUser(); return u && u.peran === 'penjual' ? u : null; }
const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const DB = 'Gagal menyimpan video. Pastikan warma.sql terbaru sudah diimpor.';

// Pasang video produk (satu video per produk; video lama diganti)
export async function POST(req) {
  const u = await seller();
  if (!u) return fail('Khusus akun penjual.', 403);
  try {
    const { id, url } = await req.json();
    const own = (await query('SELECT video FROM products WHERE id = ? AND seller_id = ?', [id, u.id]))[0];
    if (!own) return fail('Produk tidak ditemukan.', 404);
    const g = String(url || '');
    if (!g.startsWith(URL_PREFIX) || !path.basename(g).startsWith(u.id + '-') || !/\.(mp4|webm)$/.test(g)) return fail('Video tidak valid.');
    await query('UPDATE products SET video = ? WHERE id = ? AND seller_id = ?', [g, id, u.id]);
    if (own.video && own.video !== g) await removeImage(own.video);
    return NextResponse.json({ ok: true });
  } catch { return fail(DB, 500); }
}

export async function DELETE(req) {
  const u = await seller();
  if (!u) return fail('Khusus akun penjual.', 403);
  try {
    const { id } = await req.json();
    const own = (await query('SELECT video FROM products WHERE id = ? AND seller_id = ?', [id, u.id]))[0];
    if (!own) return fail('Produk tidak ditemukan.', 404);
    await query('UPDATE products SET video = NULL WHERE id = ? AND seller_id = ?', [id, u.id]);
    await removeImage(own.video);
    return NextResponse.json({ ok: true });
  } catch { return fail(DB, 500); }
}
