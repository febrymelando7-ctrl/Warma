import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser, verifyPassword, endSession } from '@/lib/auth';
import { saveBuffer, sniff, isVideo, removeImage } from '@/lib/uploads';

const j = (o, s = 200) => NextResponse.json(o, { status: s });
const bad = (e, s = 400) => j({ error: e }, s);
const DB = 'Gagal menyimpan. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.';
const digits = (s) => String(s || '').replace(/\D/g, '');
const BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon', 'Lainnya'];
const PREFS = ['beli_dibuat', 'beli_diproses', 'beli_dikirim', 'beli_selesai', 'beli_batal', 'jual_pesanan', 'jual_ulasan', 'promo_voucher', 'chat_baru', 'toko_produk_baru'];

async function profil(u, req) {
  const b = await req.json().catch(() => ({}));
  const sets = [], vals = [];
  if ('tgl_lahir' in b) {
    const d = String(b.tgl_lahir || '');
    if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d)) || new Date(d) > new Date() || new Date(d).getFullYear() < 1900)) return bad('Tanggal lahir tidak valid.');
    sets.push('tgl_lahir = ?'); vals.push(d || null);
  }
  if ('jenis_kelamin' in b) {
    const g = String(b.jenis_kelamin || '');
    if (g && !['Pria', 'Wanita'].includes(g)) return bad('Jenis kelamin tidak valid.');
    sets.push('jenis_kelamin = ?'); vals.push(g || null);
  }
  if ('telepon' in b) {
    const t = String(b.telepon || '').trim(), dg = digits(t);
    if (t && (!/^\+?[\d\s-]+$/.test(t) || dg.length < 8 || dg.length > 15)) return bad('Nomor HP belum benar (8–15 angka).');
    sets.push('telepon = ?'); vals.push(t || null);
  }
  if ('email' in b) {
    const e = String(b.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return bad('Format email belum benar.');
    const row = (await query('SELECT password_hash FROM users WHERE id = ?', [u.id]))[0];
    if (!row || !verifyPassword(String(b.password || ''), row.password_hash)) return bad('Kata sandi salah.', 403);
    if ((await query('SELECT id FROM users WHERE email = ? AND id <> ?', [e, u.id])).length) return bad('Email ini sudah dipakai akun lain.', 409);
    sets.push('email = ?'); vals.push(e);
  }
  if (sets.length) await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, u.id]);
  return j({ ok: true });
}

async function fotoUp(u, req) {
  const file = (await req.formData()).get('file');
  if (!file || typeof file === 'string') return bad('Pilih foto terlebih dahulu.');
  if (file.size > 5 * 1024 * 1024) return bad('Ukuran foto maksimal 5 MB.', 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext || isVideo(ext)) return bad('Format foto harus JPG, PNG, atau WebP.', 415);
  const url = await saveBuffer(buf, ext, u.id);
  await query('UPDATE users SET foto = ? WHERE id = ?', [url, u.id]);
  await removeImage(u.foto);
  return j({ ok: true });
}
async function fotoDel(u) {
  await query('UPDATE users SET foto = NULL WHERE id = ?', [u.id]);
  await removeImage(u.foto);
  return j({ ok: true });
}

async function notif(u, req) {
  const { kode, aktif } = await req.json().catch(() => ({}));
  if (!PREFS.includes(kode)) return bad('Jenis notifikasi tidak dikenal.');
  await query('INSERT INTO notif_prefs (user_id, kode, aktif) VALUES (?,?,?) ON DUPLICATE KEY UPDATE aktif = VALUES(aktif)', [u.id, kode, aktif ? 1 : 0]);
  return j({ ok: true });
}

async function tampilan(u, req) {
  const b = await req.json().catch(() => ({}));
  const ok = { tema: ['sistem', 'terang', 'gelap'], filter_warna: ['standar', 'merah-hijau', 'biru-kuning'], aksen: ['hijau', 'tosca', 'biru', 'ungu', 'merah', 'kuning', 'abu'] };
  const sets = [], vals = [];
  for (const k of Object.keys(ok)) if (k in b) { if (!ok[k].includes(b[k])) return bad('Pilihan tampilan tidak valid.'); sets.push(`${k} = ?`); vals.push(b[k]); }
  if (sets.length) await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, u.id]);
  return j({ ok: true });
}

async function rekAdd(u, req) {
  const b = await req.json().catch(() => ({}));
  const no = digits(b.no_rek), nama = String(b.atas_nama || '').trim().slice(0, 100);
  if (!BANKS.includes(b.bank)) return bad('Pilih bank terlebih dahulu.');
  if (no.length < 6 || no.length > 20) return bad('Nomor rekening harus 6–20 angka.');
  if (nama.length < 2) return bad('Nama pemilik rekening wajib diisi.');
  const n = Number((await query('SELECT COUNT(*) AS n FROM rekening_bank WHERE user_id = ?', [u.id]))[0].n);
  if (n >= 5) return bad('Maksimal 5 rekening tersimpan.');
  const utama = !!b.utama || n === 0;
  if (utama) await query('UPDATE rekening_bank SET utama = 0 WHERE user_id = ?', [u.id]);
  await query('INSERT INTO rekening_bank (user_id, bank, no_rek, atas_nama, utama) VALUES (?,?,?,?,?)', [u.id, b.bank, no, nama, utama ? 1 : 0]);
  return j({ ok: true });
}
async function rekMain(u, req) {
  const { id } = await req.json().catch(() => ({}));
  if (!(await query('SELECT id FROM rekening_bank WHERE id = ? AND user_id = ?', [id, u.id])).length) return bad('Rekening tidak ditemukan.', 404);
  await query('UPDATE rekening_bank SET utama = (id = ?) WHERE user_id = ?', [id, u.id]);
  return j({ ok: true });
}
async function rekDel(u, req) {
  const { id } = await req.json().catch(() => ({}));
  const r = (await query('SELECT utama FROM rekening_bank WHERE id = ? AND user_id = ?', [id, u.id]))[0];
  if (!r) return bad('Rekening tidak ditemukan.', 404);
  await query('DELETE FROM rekening_bank WHERE id = ? AND user_id = ?', [id, u.id]);
  if (r.utama) await query('UPDATE rekening_bank SET utama = 1 WHERE user_id = ? ORDER BY id DESC LIMIT 1', [u.id]);
  return j({ ok: true });
}

// Catatan: ini hanya menyimpan nomor e-wallet, belum terhubung ke layanan GoPay/DANA sungguhan
async function ewSet(u, req) {
  const { jenis, nomor } = await req.json().catch(() => ({}));
  const dg = digits(nomor);
  if (!['gopay', 'dana'].includes(jenis)) return bad('Jenis e-wallet tidak dikenal.');
  if (dg.length < 9 || dg.length > 15) return bad('Nomor HP e-wallet belum benar (9–15 angka).');
  await query('INSERT INTO ewallet (user_id, jenis, nomor) VALUES (?,?,?) ON DUPLICATE KEY UPDATE nomor = VALUES(nomor)', [u.id, jenis, dg]);
  return j({ ok: true });
}
async function ewDel(u, req) {
  const { jenis } = await req.json().catch(() => ({}));
  await query('DELETE FROM ewallet WHERE user_id = ? AND jenis = ?', [u.id, jenis]);
  return j({ ok: true });
}

async function keluarSemua(u) {
  await query('UPDATE users SET sesi_versi = sesi_versi + 1 WHERE id = ?', [u.id]);
  await endSession();
  return j({ ok: true });
}

const H = {
  profil: { PATCH: profil }, foto: { POST: fotoUp, DELETE: fotoDel }, notifikasi: { PUT: notif }, tampilan: { PATCH: tampilan },
  rekening: { POST: rekAdd, PATCH: rekMain, DELETE: rekDel }, ewallet: { POST: ewSet, DELETE: ewDel }, 'keluar-semua': { POST: keluarSemua },
};

async function run(method, req, { params }) {
  const { aksi } = await params;
  const fn = H[aksi]?.[method];
  if (!fn) return bad('Tidak ditemukan.', 404);
  const u = await getUser();
  if (!u) return bad('Silakan masuk dulu.', 401);
  try { return await fn(u, req); } catch (e) { return e?.code === 'ER_DUP_ENTRY' ? bad('Data sudah ada.', 409) : bad(DB, 500); }
}
export const POST = (r, c) => run('POST', r, c);
export const PATCH = (r, c) => run('PATCH', r, c);
export const PUT = (r, c) => run('PUT', r, c);
export const DELETE = (r, c) => run('DELETE', r, c);
