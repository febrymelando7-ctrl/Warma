import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getUser } from '@/lib/auth';
import path from 'path';
import { storeName } from '@/lib/seller';
import { notifyFollowers } from '@/lib/notify';
import { removeImage, URL_PREFIX } from '@/lib/uploads';

async function seller() { const u = await getUser(); return u && u.peran === 'penjual' ? u : null; }

// Tambah produk
export async function POST(req) {
  const u = await seller();
  if (!u) return NextResponse.json({ error: 'Khusus akun penjual.' }, { status: 403 });
  const b = await req.json();
  const nama = String(b.nama || '').trim().slice(0, 160);
  const harga = Math.floor(Number(b.harga) || 0);
  const stok = Math.max(0, Math.floor(Number(b.stok) || 0));
  if (nama.length < 3 || harga < 1) return NextResponse.json({ error: 'Nama produk dan harga wajib diisi.' }, { status: 400 });
  const slug = 'p-' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  await query(
    `INSERT INTO products (slug, nama, harga, harga_asli, diskon, kategori, toko, tipe_toko, lokasi, gambar, stok, seller_id, deskripsi)
     VALUES (?,?,?,?,0,?,?,?,?,?,?,?,?)`,
    [slug, nama, harga, harga, String(b.varian || 'Lainnya').slice(0, 80), storeName(u), 'pengguna', 'Indonesia', '/images/placeholder.svg', stok, u.id, String(b.deskripsi || '').trim().slice(0, 2000)]);
  await notifyFollowers(storeName(u), `Produk baru dari ${storeName(u)}`, nama, `/produk/${slug}`, 'toko_produk_baru');
  return NextResponse.json({ ok: true });
}

// Jeda / aktifkan produk
export async function PATCH(req) {
  const u = await seller();
  if (!u) return NextResponse.json({ error: 'Khusus akun penjual.' }, { status: 403 });
  const { id, status } = await req.json();
  if (!['aktif', 'jeda'].includes(status)) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
  await query('UPDATE products SET status = ? WHERE id = ? AND seller_id = ?', [status, id, u.id]);
  return NextResponse.json({ ok: true });
}

// Ubah data produk milik sendiri (termasuk varian)
export async function PUT(req) {
  const u = await seller();
  if (!u) return NextResponse.json({ error: 'Khusus akun penjual.' }, { status: 403 });
  const b = await req.json();
  const cur = (await query('SELECT id, gambar FROM products WHERE id = ? AND seller_id = ?', [b.id, u.id]))[0];
  if (!cur) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });

  const variants = (Array.isArray(b.variants) ? b.variants : []).slice(0, 20).map((v, i) => ({
    id: Number(v.id) || null, nama: String(v.nama || '').trim().slice(0, 60), harga: Math.floor(Number(v.harga) || 0), stok: Math.max(0, Math.floor(Number(v.stok) || 0)), urutan: i,
  }));
  if (variants.some((v) => !v.nama || v.harga < 1)) return NextResponse.json({ error: 'Setiap varian wajib punya nama dan harga.' }, { status: 400 });
  if (new Set(variants.map((v) => v.nama.toLowerCase())).size !== variants.length) return NextResponse.json({ error: 'Nama varian tidak boleh sama.' }, { status: 400 });

  const nama = String(b.nama || '').trim().slice(0, 160);
  // Dengan varian: harga produk = harga terendah, stok produk = jumlah stok semua varian
  const harga = variants.length ? Math.min(...variants.map((v) => v.harga)) : Math.floor(Number(b.harga) || 0);
  const stok = variants.length ? variants.reduce((a, v) => a + v.stok, 0) : Math.max(0, Math.floor(Number(b.stok) || 0));
  if (nama.length < 3 || harga < 1) return NextResponse.json({ error: 'Nama produk dan harga wajib diisi.' }, { status: 400 });
  let asli = Math.floor(Number(b.harga_asli) || 0);
  if (asli < harga) asli = harga;
  const diskon = asli > harga ? Math.round(((asli - harga) / asli) * 100) : 0;
  // Foto baru hanya diterima bila berasal dari unggahan akun ini
  const g = String(b.gambar || '');
  const gambar = g.startsWith(URL_PREFIX) && path.basename(g).startsWith(u.id + '-') && !/\.(mp4|webm)$/.test(g) ? g : cur.gambar;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query('UPDATE products SET nama = ?, kategori = ?, deskripsi = ?, harga = ?, harga_asli = ?, diskon = ?, stok = ?, gambar = ?, berat = ?, kondisi = ?, varian_label = ? WHERE id = ? AND seller_id = ?',
      [nama, String(b.kategori || 'Lainnya').slice(0, 80), String(b.deskripsi || '').trim().slice(0, 2000), harga, asli, diskon, stok, gambar,
       Math.max(1, Math.floor(Number(b.berat) || 500)), b.kondisi === 'Bekas' ? 'Bekas' : 'Baru', variants.length ? String(b.varian_label || '').trim().slice(0, 40) || 'Varian' : null, cur.id, u.id]);
    const [old] = await conn.query('SELECT id FROM product_variants WHERE product_id = ?', [cur.id]);
    const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
    for (const o of old) if (!keep.has(o.id)) {
      await conn.query('DELETE FROM cart_items WHERE variant_id = ?', [o.id]);
      await conn.query('DELETE FROM product_variants WHERE id = ?', [o.id]);
    }
    for (const v of variants) {
      if (v.id && old.some((o) => o.id === v.id)) await conn.query('UPDATE product_variants SET nama = ?, harga = ?, stok = ?, urutan = ? WHERE id = ? AND product_id = ?', [v.nama, v.harga, v.stok, v.urutan, v.id, cur.id]);
      else await conn.query('INSERT INTO product_variants (product_id, nama, harga, stok, urutan) VALUES (?,?,?,?,?)', [cur.id, v.nama, v.harga, v.stok, v.urutan]);
    }
    // Keranjang lama tanpa pilihan varian tidak berlaku lagi
    if (variants.length) await conn.query('DELETE FROM cart_items WHERE product_id = ? AND variant_id IS NULL', [cur.id]);
    await conn.commit();
  } catch {
    if (conn) await conn.rollback().catch(() => {});
    return NextResponse.json({ error: 'Gagal menyimpan. Pastikan warma.sql terbaru sudah diimpor.' }, { status: 500 });
  } finally { conn?.release(); }
  if (gambar !== cur.gambar) await removeImage(cur.gambar);
  return NextResponse.json({ ok: true });
}

// Hapus produk milik sendiri
export async function DELETE(req) {
  const u = await seller();
  if (!u) return NextResponse.json({ error: 'Khusus akun penjual.' }, { status: 403 });
  const { id } = await req.json();
  const cur = (await query('SELECT gambar, video FROM products WHERE id = ? AND seller_id = ?', [id, u.id]))[0];
  if (!cur) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
  const extra = await query('SELECT url FROM product_images WHERE product_id = ?', [id]).catch(() => []);
  await query('DELETE FROM products WHERE id = ? AND seller_id = ?', [id, u.id]);
  for (const e of extra) await removeImage(e.url);
  await removeImage(cur.gambar);
  await removeImage(cur.video);
  return NextResponse.json({ ok: true });
}
