import crypto from 'crypto';
import { cookies } from 'next/headers';
import { query } from './db';

const secret = () => process.env.AUTH_SECRET || 'warma-dev-secret-ganti-saat-produksi';
const sign = (v) => crypto.createHmac('sha256', secret()).update(String(v)).digest('hex');

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
export function verifyPassword(pw, stored) {
  const [salt, h] = String(stored).split(':');
  if (!salt || !h) return false;
  const a = Buffer.from(h, 'hex');
  const b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Cookie sesi: <id>.<versi>.<tanda tangan>. Menaikkan users.sesi_versi mengeluarkan semua perangkat.
export async function startSession(id) {
  let ver = 0;
  try { ver = Number((await query('SELECT sesi_versi FROM users WHERE id = ?', [id]))[0].sesi_versi) || 0; } catch {}
  (await cookies()).set('warma_session', `${id}.${ver}.${sign(`${id}.${ver}`)}`, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
}
export async function endSession() { (await cookies()).delete('warma_session'); }

export async function getUser() {
  const c = (await cookies()).get('warma_session')?.value;
  if (!c) return null;
  const [id, ver, sig] = c.split('.');
  if (!id || ver === undefined || !sig || sig !== sign(`${id}.${ver}`)) return null;
  try {
    const r = (await query('SELECT id, nama, email, peran, foto, telepon, tema, filter_warna, aksen, sesi_versi FROM users WHERE id = ?', [id]))[0];
    if (!r || Number(r.sesi_versi) !== Number(ver)) return null;
    return { id: r.id, nama: r.nama, email: r.email, peran: r.peran, foto: r.foto || '', telepon: r.telepon || '', tema: r.tema, filter_warna: r.filter_warna, aksen: r.aksen };
  } catch {
    // Kolom baru belum ada (warma.sql belum diimpor ulang): pakai data dasar
    try {
      const r = (await query('SELECT id, nama, email, peran FROM users WHERE id = ?', [id]))[0];
      return r ? { id: r.id, nama: r.nama, email: r.email, peran: r.peran, foto: '', telepon: '', tema: 'terang', filter_warna: 'standar', aksen: 'hijau' } : null;
    } catch { return null; }
  }
}
