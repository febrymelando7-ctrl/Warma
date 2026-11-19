import { NextResponse } from 'next/server';
import { pool, query } from '@/lib/db';
import { getUser } from '@/lib/auth';

const need = () => NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

function clean(b) {
  const o = {
    label: String(b.label || '').trim().slice(0, 30) || 'Home',
    nama: String(b.nama || '').trim().slice(0, 100),
    telepon: String(b.telepon || '').trim().slice(0, 20),
    alamat: String(b.alamat || '').trim().slice(0, 300),
    kota: String(b.kota || '').trim().slice(0, 80),
    provinsi: String(b.provinsi || '').trim().slice(0, 80),
    kode_pos: String(b.kode_pos || '').replace(/\D/g, '').slice(0, 5),
    utama: !!b.utama,
  };
  const digits = o.telepon.replace(/\D/g, '');
  if (o.nama.length < 2) o.err = 'Nama penerima wajib diisi.';
  else if (!/^\+?[\d\s-]+$/.test(o.telepon) || digits.length < 8 || digits.length > 15) o.err = 'Nomor HP belum benar (8–15 angka).';
  else if (o.alamat.length < 10) o.err = 'Alamat lengkap minimal 10 karakter (jalan, nomor, kelurahan).';
  else if (!o.kota || !o.provinsi) o.err = 'Kota dan provinsi wajib diisi.';
  else if (o.kode_pos && o.kode_pos.length !== 5) o.err = 'Kode pos harus 5 angka.';
  return o;
}

const DB_ERR = 'Gagal menyimpan alamat. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.';

// Tambah alamat (maks. 10; alamat pertama otomatis jadi utama)
export async function POST(req) {
  const u = await getUser(); if (!u) return need();
  const a = clean(await req.json().catch(() => ({})));
  if (a.err) return bad(a.err);
  let conn;
  try {
    conn = await pool.getConnection(); await conn.beginTransaction();
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ? FOR UPDATE', [u.id]);
    if (n >= 10) { await conn.rollback(); return bad('Maksimal 10 alamat tersimpan.'); }
    const utama = a.utama || n === 0;
    if (utama) await conn.query('UPDATE addresses SET utama = 0 WHERE user_id = ?', [u.id]);
    await conn.query('INSERT INTO addresses (user_id, label, nama, telepon, alamat, kota, provinsi, kode_pos, utama) VALUES (?,?,?,?,?,?,?,?,?)',
      [u.id, a.label, a.nama, a.telepon, a.alamat, a.kota, a.provinsi, a.kode_pos || null, utama ? 1 : 0]);
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch { if (conn) await conn.rollback().catch(() => {}); return bad(DB_ERR, 500); } finally { conn?.release(); }
}

// Ubah alamat
export async function PUT(req) {
  const u = await getUser(); if (!u) return need();
  const b = await req.json().catch(() => ({}));
  const a = clean(b);
  if (a.err) return bad(a.err);
  let conn;
  try {
    conn = await pool.getConnection(); await conn.beginTransaction();
    const [r] = await conn.query('UPDATE addresses SET label = ?, nama = ?, telepon = ?, alamat = ?, kota = ?, provinsi = ?, kode_pos = ? WHERE id = ? AND user_id = ?',
      [a.label, a.nama, a.telepon, a.alamat, a.kota, a.provinsi, a.kode_pos || null, b.id, u.id]);
    if (!r.affectedRows) { await conn.rollback(); return bad('Alamat tidak ditemukan.', 404); }
    if (a.utama) {
      await conn.query('UPDATE addresses SET utama = 0 WHERE user_id = ?', [u.id]);
      await conn.query('UPDATE addresses SET utama = 1 WHERE id = ? AND user_id = ?', [b.id, u.id]);
    }
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch { if (conn) await conn.rollback().catch(() => {}); return bad(DB_ERR, 500); } finally { conn?.release(); }
}

// Jadikan alamat utama
export async function PATCH(req) {
  const u = await getUser(); if (!u) return need();
  const { id } = await req.json().catch(() => ({}));
  try {
    if (!(await query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, u.id])).length) return bad('Alamat tidak ditemukan.', 404);
    await query('UPDATE addresses SET utama = (id = ?) WHERE user_id = ?', [id, u.id]);
    return NextResponse.json({ ok: true });
  } catch { return bad(DB_ERR, 500); }
}

// Hapus alamat (bila yang utama dihapus, alamat terbaru lainnya jadi utama)
export async function DELETE(req) {
  const u = await getUser(); if (!u) return need();
  const { id } = await req.json().catch(() => ({}));
  try {
    const row = (await query('SELECT utama FROM addresses WHERE id = ? AND user_id = ?', [id, u.id]))[0];
    if (!row) return bad('Alamat tidak ditemukan.', 404);
    await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, u.id]);
    if (row.utama) await query('UPDATE addresses SET utama = 1 WHERE user_id = ? ORDER BY id DESC LIMIT 1', [u.id]);
    return NextResponse.json({ ok: true });
  } catch { return bad(DB_ERR, 500); }
}
