import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { SHIP, DEFAULT_SHIP, BUYER_FEE, voucherCut } from '@/lib/shipping';
import { resolveVoucher } from '@/lib/vouchers';
import { fullAddress } from '@/lib/addresses';
import { notify, notifySellers } from '@/lib/notify';
import { query } from '@/lib/db';

// Pesanan dibuat dari isi keranjang di database; harga & ongkir dihitung ulang di server.
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  let addr;
  try { addr = (await query('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [b.addressId, user.id]))[0]; } catch {}
  if (!addr) return NextResponse.json({ error: 'Pilih atau tambahkan alamat pengiriman dulu.' }, { status: 400 });
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT c.qty, c.variant_id AS vid, v.nama AS varian, p.id AS pid, p.nama, COALESCE(v.harga, p.harga) AS harga, p.toko, p.tipe_toko, COALESCE(v.stok, p.stok) AS stok
       FROM cart_items c JOIN products p ON p.id = c.product_id LEFT JOIN product_variants v ON v.id = c.variant_id
       WHERE c.user_id = ? AND p.status = 'aktif' AND (c.variant_id IS NULL OR v.id IS NOT NULL) FOR UPDATE`, [user.id]);
    if (!rows.length) { await conn.rollback(); return NextResponse.json({ error: 'Keranjang kosong.' }, { status: 400 }); }
    const low = rows.find((r) => r.qty > r.stok);
    if (low) { await conn.rollback(); return NextResponse.json({ error: `Stok “${low.nama}${low.varian ? ` (${low.varian})` : ''}” tinggal ${low.stok}. Kurangi jumlahnya di keranjang.` }, { status: 409 }); }

    let ongkir = 0;
    for (const toko of new Set(rows.map((r) => r.toko))) {
      const tipe = rows.find((r) => r.toko === toko).tipe_toko;
      const pick = b.shipping?.[toko];
      ongkir += SHIP[tipe][Number.isInteger(pick) && SHIP[tipe][pick] ? pick : DEFAULT_SHIP[tipe]][2];
    }
    const sub = rows.reduce((a, r) => a + r.harga * r.qty, 0);
    let cut = 0, uvId = null;
    const kodeV = String(b.voucher || '').trim().toUpperCase();
    if (kodeV) {
      const rv = await resolveVoucher(conn, user.id, kodeV);
      const hit = rv.err ? null : voucherCut(rv.v, sub, ongkir);
      const err = rv.err || hit.err;
      if (err) { await conn.rollback(); return NextResponse.json({ error: err }, { status: 400 }); }
      cut = hit.cut; uvId = rv.uvId;
    }
    const total = Math.max(0, sub + ongkir + BUYER_FEE - cut);

    const d = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const kode = `WA-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${1000 + Math.floor(Math.random() * 9000)}`;
    const [o] = await conn.query('INSERT INTO orders (kode, user_id, total, metode_bayar, alamat) VALUES (?,?,?,?,?)', [kode, user.id, total, String(b.metode || '').slice(0, 40), fullAddress(addr)]);
    if (uvId) await conn.query('UPDATE user_vouchers SET dipakai = 1, order_id = ?, used_at = NOW() WHERE id = ? AND dipakai = 0', [o.insertId, uvId]);
    for (const r of rows) {
      await conn.query('INSERT INTO order_items (order_id, toko, nama, harga, qty, varian) VALUES (?,?,?,?,?,?)', [o.insertId, r.toko, r.nama, r.harga, r.qty, r.varian]);
      await conn.query('UPDATE products SET stok = GREATEST(stok - ?, 0), terjual_n = terjual_n + ? WHERE id = ?', [r.qty, r.qty, r.pid]);
      if (r.vid) await conn.query('UPDATE product_variants SET stok = GREATEST(stok - ?, 0) WHERE id = ?', [r.qty, r.vid]);
    }
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [user.id]);
    await conn.commit();
    await notify(user.id, 'Pesanan berhasil dibuat', `Pesanan ${kode} sebesar Rp${total.toLocaleString('id-ID')} menunggu diproses penjual.`, '/pesanan', 'beli_dibuat');
    await notifySellers(rows.map((r) => r.toko), 'Pesanan baru masuk', `Ada pesanan ${kode} untuk tokomu. Segera proses.`, '/penjual?tab=orders', 'jual_pesanan');
    return NextResponse.json({ ok: true, kode, total });
  } catch {
    if (conn) await conn.rollback().catch(() => {});
    return NextResponse.json({ error: 'Gagal menyimpan pesanan. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.' }, { status: 500 });
  } finally { conn?.release(); }
}

// Pembeli membatalkan pesanan yang masih berstatus "baru"; stok dikembalikan.
export async function PATCH(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [r] = await conn.query("UPDATE orders SET status = 'batal' WHERE id = ? AND user_id = ? AND status = 'baru'", [id, user.id]);
    if (!r.affectedRows) { await conn.rollback(); return NextResponse.json({ error: 'Pesanan ini tidak bisa dibatalkan lagi.' }, { status: 409 }); }
    await conn.query('UPDATE products p JOIN order_items oi ON oi.nama = p.nama AND oi.toko = p.toko SET p.stok = p.stok + oi.qty, p.terjual_n = GREATEST(p.terjual_n - oi.qty, 0) WHERE oi.order_id = ?', [id]);
    await conn.query('UPDATE product_variants v JOIN products p ON p.id = v.product_id JOIN order_items oi ON oi.nama = p.nama AND oi.toko = p.toko AND oi.varian = v.nama SET v.stok = v.stok + oi.qty WHERE oi.order_id = ?', [id]);
    await conn.query('UPDATE user_vouchers SET dipakai = 0, order_id = NULL, used_at = NULL WHERE order_id = ?', [id]);
    await conn.commit();
    const info = (await query('SELECT kode FROM orders WHERE id = ?', [id]))[0];
    const tokos = (await query('SELECT DISTINCT toko FROM order_items WHERE order_id = ?', [id])).map((r) => r.toko);
    await notifySellers(tokos, 'Pesanan dibatalkan pembeli', `Pesanan ${info?.kode || ''} dibatalkan oleh pembeli.`, '/penjual?tab=orders', 'jual_pesanan');
    return NextResponse.json({ ok: true });
  } catch {
    if (conn) await conn.rollback().catch(() => {});
    return NextResponse.json({ error: 'Gagal membatalkan pesanan.' }, { status: 500 });
  } finally { conn?.release(); }
}
