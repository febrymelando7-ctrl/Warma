import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { notifySellers } from '@/lib/notify';

export async function POST(req) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  try {
    const b = await req.json();
    const p = (await query('SELECT id, slug, nama, toko FROM products WHERE id = ?', [b.product_id]))[0];
    if (!p) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    const bought = await query("SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = ? AND o.status = 'selesai' AND oi.nama = ? AND oi.toko = ? LIMIT 1", [u.id, p.nama, p.toko]);
    if (!bought.length) return NextResponse.json({ error: 'Ulasan hanya bisa ditulis setelah pesananmu berstatus Selesai.' }, { status: 403 });
    const rating = Math.min(5, Math.max(1, Math.floor(Number(b.rating) || 5)));
    try {
      await query('INSERT INTO reviews (product_id, user_id, rating, komentar) VALUES (?,?,?,?)', [p.id, u.id, rating, String(b.komentar || '').trim().slice(0, 1000)]);
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Kamu sudah memberi ulasan untuk produk ini.' }, { status: 409 });
      throw e;
    }
    await query('UPDATE products SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ?) WHERE id = ?', [p.id, p.id]);
    await notifySellers([p.toko], 'Ulasan baru', `${p.nama} mendapat ulasan ${rating} bintang.`, `/produk/${p.slug}#ulasan`, 'jual_ulasan');
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Gagal mengirim ulasan.' }, { status: 500 }); }
}

const clamp5 = (v) => Math.min(5, Math.max(1, Math.floor(Number(v) || 5)));
const refreshRating = (pid) => query('UPDATE products SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ?), rating) WHERE id = ?', [pid, pid]);

// Ubah ulasan milik sendiri
export async function PATCH(req) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  try {
    const b = await req.json();
    const r = (await query('SELECT id, product_id FROM reviews WHERE id = ? AND user_id = ?', [b.id, u.id]))[0];
    if (!r) return NextResponse.json({ error: 'Ulasan tidak ditemukan.' }, { status: 404 });
    await query('UPDATE reviews SET rating = ?, komentar = ? WHERE id = ?', [clamp5(b.rating), String(b.komentar || '').trim().slice(0, 1000), r.id]);
    await refreshRating(r.product_id);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Gagal menyimpan ulasan.' }, { status: 500 }); }
}

// Hapus ulasan milik sendiri
export async function DELETE(req) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  try {
    const { id } = await req.json();
    const r = (await query('SELECT id, product_id FROM reviews WHERE id = ? AND user_id = ?', [id, u.id]))[0];
    if (!r) return NextResponse.json({ error: 'Ulasan tidak ditemukan.' }, { status: 404 });
    await query('DELETE FROM reviews WHERE id = ?', [r.id]);
    await refreshRating(r.product_id);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Gagal menghapus ulasan.' }, { status: 500 }); }
}
