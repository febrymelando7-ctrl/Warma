import path from 'path';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { removeImage, URL_PREFIX } from '@/lib/uploads';

async function seller() { const u = await getUser(); return u && u.peran === 'penjual' ? u : null; }
const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Tambah foto ke galeri produk (maks. 10), boleh dengan keterangan motif
export async function POST(req) {
  const u = await seller();
  if (!u) return fail('Khusus akun penjual.', 403);
  try {
    const { id, url, caption } = await req.json();
    if (!(await query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [id, u.id]))[0]) return fail('Produk tidak ditemukan.', 404);
    const g = String(url || '');
    if (!g.startsWith(URL_PREFIX) || !path.basename(g).startsWith(u.id + '-') || /\.(mp4|webm)$/.test(g)) return fail('Foto tidak valid.');
    const n = Number((await query('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?', [id]))[0].n);
    if (n >= 10) return fail('Maksimal 10 foto di galeri.');
    const r = await query('INSERT INTO product_images (product_id, url, urutan, caption) VALUES (?,?,?,?)', [id, g, n, String(caption || '').trim().slice(0, 80) || null]);
    return NextResponse.json({ ok: true, id: r.insertId });
  } catch { return fail('Gagal menyimpan foto. Pastikan warma.sql terbaru sudah diimpor.', 500); }
}

// Ubah keterangan (nama motif) sebuah foto
export async function PATCH(req) {
  const u = await seller();
  if (!u) return fail('Khusus akun penjual.', 403);
  try {
    const { id, caption } = await req.json();
    await query('UPDATE product_images pi JOIN products p ON p.id = pi.product_id SET pi.caption = ? WHERE pi.id = ? AND p.seller_id = ?', [String(caption || '').trim().slice(0, 80) || null, id, u.id]);
    return NextResponse.json({ ok: true });
  } catch { return fail('Gagal menyimpan keterangan.', 500); }
}

export async function DELETE(req) {
  const u = await seller();
  if (!u) return fail('Khusus akun penjual.', 403);
  const { id } = await req.json();
  const row = (await query('SELECT pi.url FROM product_images pi JOIN products p ON p.id = pi.product_id WHERE pi.id = ? AND p.seller_id = ?', [id, u.id]))[0];
  if (!row) return fail('Foto tidak ditemukan.', 404);
  await query('DELETE FROM product_images WHERE id = ?', [id]);
  await removeImage(row.url);
  return NextResponse.json({ ok: true });
}
