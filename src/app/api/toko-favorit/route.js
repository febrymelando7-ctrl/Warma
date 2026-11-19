import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { storeName } from '@/lib/seller';

const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const DB = 'Gagal memperbarui toko favorit. Pastikan warma.sql terbaru sudah diimpor.';

// Ikuti sebuah toko (maks. 100 toko)
export async function POST(req) {
  const u = await getUser();
  if (!u) return fail('Silakan masuk dulu.', 401);
  try {
    const toko = String((await req.json().catch(() => ({}))).toko || '').trim().slice(0, 100);
    if (!(await query('SELECT 1 FROM products WHERE toko = ? LIMIT 1', [toko])).length) return fail('Toko tidak ditemukan.', 404);
    if (u.peran === 'penjual' && toko === storeName(u)) return fail('Ini tokomu sendiri.');
    const n = Number((await query('SELECT COUNT(*) AS n FROM toko_favorit WHERE user_id = ?', [u.id]))[0].n);
    if (n >= 100) return fail('Maksimal 100 toko favorit.');
    await query('INSERT IGNORE INTO toko_favorit (user_id, toko) VALUES (?,?)', [u.id, toko]);
    return NextResponse.json({ ok: true });
  } catch { return fail(DB, 500); }
}

// Berhenti mengikuti
export async function DELETE(req) {
  const u = await getUser();
  if (!u) return fail('Silakan masuk dulu.', 401);
  try {
    const toko = String((await req.json().catch(() => ({}))).toko || '').trim();
    await query('DELETE FROM toko_favorit WHERE user_id = ? AND toko = ?', [u.id, toko]);
    return NextResponse.json({ ok: true });
  } catch { return fail(DB, 500); }
}
