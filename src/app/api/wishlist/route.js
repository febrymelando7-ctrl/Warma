import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

const need = () => NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
const fail = () => NextResponse.json({ error: 'Gagal memperbarui wishlist. Pastikan warma.sql terbaru sudah diimpor.' }, { status: 500 });

// Tambah ke wishlist (aman dipanggil berulang)
export async function POST(req) {
  const u = await getUser(); if (!u) return need();
  try {
    const { id } = await req.json();
    if (!(await query('SELECT id FROM products WHERE id = ?', [id])).length) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    await query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?,?)', [u.id, id]);
    return NextResponse.json({ ok: true });
  } catch { return fail(); }
}

// Hapus dari wishlist
export async function DELETE(req) {
  const u = await getUser(); if (!u) return need();
  try {
    const { id } = await req.json();
    await query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [u.id, id]);
    return NextResponse.json({ ok: true });
  } catch { return fail(); }
}
