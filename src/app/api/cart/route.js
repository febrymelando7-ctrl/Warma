import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

const need = () => NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
const clamp = (q) => Math.min(99, Math.max(1, Math.floor(Number(q) || 1)));

// Tambah produk (dan varian bila ada) ke keranjang
export async function POST(req) {
  const u = await getUser(); if (!u) return need();
  try {
    const { id, qty, variant_id } = await req.json();
    const p = (await query("SELECT id FROM products WHERE id = ? AND status = 'aktif'", [id]))[0];
    if (!p) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    const vs = await query('SELECT id FROM product_variants WHERE product_id = ?', [p.id]);
    let vid = null;
    if (vs.length) {
      vid = Number(variant_id);
      if (!vs.some((v) => v.id === vid)) return NextResponse.json({ error: 'Pilih varian produk dulu.', needVariant: true }, { status: 400 });
    }
    const ex = (await query('SELECT id FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_id <=> ?', [u.id, p.id, vid]))[0];
    if (ex) await query('UPDATE cart_items SET qty = LEAST(qty + ?, 99) WHERE id = ?', [clamp(qty), ex.id]);
    else await query('INSERT INTO cart_items (user_id, product_id, qty, variant_id) VALUES (?,?,?,?)', [u.id, p.id, clamp(qty), vid]);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Gagal menambah ke keranjang. Pastikan warma.sql terbaru sudah diimpor.' }, { status: 500 }); }
}

// Ubah jumlah
export async function PATCH(req) {
  const u = await getUser(); if (!u) return need();
  const { id, qty } = await req.json();
  await query('UPDATE cart_items SET qty = ? WHERE id = ? AND user_id = ?', [clamp(qty), id, u.id]);
  return NextResponse.json({ ok: true });
}

// Hapus item
export async function DELETE(req) {
  const u = await getUser(); if (!u) return need();
  const { id } = await req.json();
  await query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, u.id]);
  return NextResponse.json({ ok: true });
}
