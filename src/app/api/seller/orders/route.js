import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { storeName } from '@/lib/seller';
import { notify } from '@/lib/notify';

// Ubah status pesanan (hanya pesanan yang berisi barang tokomu)
export async function PATCH(req) {
  const u = await getUser();
  if (!u || u.peran !== 'penjual') return NextResponse.json({ error: 'Khusus akun penjual.' }, { status: 403 });
  const { id, status } = await req.json();
  if (!['diproses', 'dikirim', 'selesai', 'batal'].includes(status)) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
  const own = await query('SELECT 1 FROM order_items WHERE order_id = ? AND toko = ? LIMIT 1', [id, storeName(u)]);
  if (!own.length) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
  await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  const o = (await query('SELECT user_id, kode FROM orders WHERE id = ?', [id]))[0];
  const pesan = {
    diproses: ['Pesanan diproses', 'sedang diproses penjual.'],
    dikirim: ['Pesanan dikirim', 'sudah dikirim oleh penjual.'],
    selesai: ['Pesanan selesai', 'sudah selesai. Jangan lupa beri ulasan untuk produknya!'],
    batal: ['Pesanan dibatalkan', 'dibatalkan oleh penjual.'],
  }[status];
  if (o && pesan) await notify(o.user_id, pesan[0], `Pesanan ${o.kode} ${pesan[1]}`, '/pesanan', { diproses: 'beli_diproses', dikirim: 'beli_dikirim', selesai: 'beli_selesai', batal: 'beli_batal' }[status]);
  if (status === 'batal') await query('UPDATE user_vouchers SET dipakai = 0, order_id = NULL, used_at = NULL WHERE order_id = ?', [id]).catch(() => {});
  return NextResponse.json({ ok: true });
}
