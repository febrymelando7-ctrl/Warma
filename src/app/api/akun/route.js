import { NextResponse } from 'next/server';
import { pool, query } from '@/lib/db';
import { getUser, hashPassword, verifyPassword, startSession } from '@/lib/auth';
import { storeName } from '@/lib/seller';
import { notify } from '@/lib/notify';

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Ubah nama. Nama toko penjual = "Toko <nama depan>", jadi bila nama depan berubah,
// nama toko di produk dan riwayat pesanan toko itu ikut dipindahkan.
export async function PATCH(req) {
  const u = await getUser();
  if (!u) return fail('Silakan masuk dulu.', 401);
  const { nama } = await req.json().catch(() => ({}));
  const n = String(nama || '').trim().replace(/\s+/g, ' ').slice(0, 100);
  if (n.length < 2) return fail('Nama minimal 2 karakter.');
  if (n === u.nama) return NextResponse.json({ ok: true });
  const lama = storeName(u), baru = storeName({ nama: n });
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query('UPDATE users SET nama = ? WHERE id = ?', [n, u.id]);
    if (u.peran === 'penjual' && lama !== baru) {
      await conn.query('UPDATE order_items oi JOIN products p ON p.nama = oi.nama AND p.toko = ? AND p.seller_id = ? SET oi.toko = ? WHERE oi.toko = ?', [lama, u.id, baru, lama]);
      await conn.query('UPDATE products SET toko = ? WHERE seller_id = ?', [baru, u.id]);
      await conn.query('UPDATE IGNORE toko_favorit SET toko = ? WHERE toko = ?', [baru, lama]);
    }
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch {
    if (conn) await conn.rollback().catch(() => {});
    return fail('Gagal menyimpan nama. Pastikan MySQL di XAMPP menyala.', 500);
  } finally { conn?.release(); }
}

// Ubah kata sandi (wajib memasukkan kata sandi lama)
export async function PUT(req) {
  const u = await getUser();
  if (!u) return fail('Silakan masuk dulu.', 401);
  const { lama, baru } = await req.json().catch(() => ({}));
  try {
    const row = (await query('SELECT password_hash FROM users WHERE id = ?', [u.id]))[0];
    if (!row || !verifyPassword(String(lama || ''), row.password_hash)) return fail('Kata sandi lama salah.', 403);
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(baru || ''))) return fail('Kata sandi baru minimal 8 karakter dengan huruf dan angka.');
    if (baru === lama) return fail('Kata sandi baru harus berbeda dari yang lama.');
    await query('UPDATE users SET password_hash = ?, sesi_versi = sesi_versi + 1 WHERE id = ?', [hashPassword(String(baru)), u.id]);
    await startSession(u.id); // perangkat lain keluar, sesi ini tetap masuk
    await notify(u.id, 'Kata sandi diubah', 'Kata sandi akunmu baru saja diubah. Jika ini bukan kamu, segera hubungi Bantuan Warma.', '/pengaturan');
    return NextResponse.json({ ok: true });
  } catch { return fail('Gagal mengubah kata sandi. Pastikan MySQL di XAMPP menyala.', 500); }
}
