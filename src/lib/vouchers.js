import { query } from './db';
import { DEMO_VOUCHERS } from './shipping';

const pernahBeli = async (run, userId) => Number((await run("SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND status <> 'batal'", [userId]))[0].n) > 0;

// { id_voucher: 0 (diklaim) | 1 (terpakai) } untuk akun ini
export async function getClaimedMap(userId) {
  try {
    const rows = await query('SELECT voucher_id, dipakai FROM user_vouchers WHERE user_id = ?', [userId]);
    return Object.fromEntries(rows.map((r) => [r.voucher_id, r.dipakai ? 1 : 0]));
  } catch { return {}; }
}

// Voucher yang sudah diklaim, belum dipakai, dan masih berlaku — untuk pilihan di checkout
export async function getUserVouchers(userId) {
  try {
    const rows = await query(
      `SELECT v.id, v.kode, v.judul, v.tipe, v.nilai, v.maks_potongan, v.min_belanja, v.hanya_baru
       FROM user_vouchers uv JOIN vouchers v ON v.id = uv.voucher_id
       WHERE uv.user_id = ? AND uv.dipakai = 0 AND v.kode IS NOT NULL AND (v.berlaku_sampai IS NULL OR v.berlaku_sampai >= CURDATE())
       ORDER BY uv.id DESC`, [userId]);
    const baru = !(await pernahBeli((s, p) => query(s, p), userId));
    return rows.filter((r) => !r.hanya_baru || baru).map((r) => ({ id: r.id, kode: r.kode, judul: r.judul, tipe: r.tipe, nilai: Number(r.nilai), maks_potongan: Number(r.maks_potongan) || 0, min_belanja: Number(r.min_belanja) }));
  } catch { return []; }
}

// Dipanggil di dalam transaksi pesanan: cek kode (demo atau voucher yang sudah diklaim)
export async function resolveVoucher(conn, userId, kode) {
  const demo = DEMO_VOUCHERS.find((v) => v.kode === kode);
  if (demo) return { v: demo, uvId: null };
  const [rows] = await conn.query(
    `SELECT uv.id AS uvId, v.*, (v.berlaku_sampai IS NOT NULL AND v.berlaku_sampai < CURDATE()) AS kedaluwarsa
     FROM user_vouchers uv JOIN vouchers v ON v.id = uv.voucher_id
     WHERE uv.user_id = ? AND v.kode = ? AND uv.dipakai = 0 FOR UPDATE`, [userId, kode]);
  const r = rows[0];
  if (!r) return { err: 'Kode voucher tidak valid, belum kamu klaim, atau sudah terpakai.' };
  if (Number(r.kedaluwarsa)) return { err: 'Voucher ini sudah berakhir.' };
  if (r.hanya_baru && (await pernahBeli((s, p) => conn.query(s, p).then(([x]) => x), userId))) return { err: 'Voucher ini hanya untuk transaksi pertama.' };
  return { v: { kode: r.kode, judul: r.judul, tipe: r.tipe, nilai: Number(r.nilai), maks_potongan: Number(r.maks_potongan) || 0, min_belanja: Number(r.min_belanja) }, uvId: r.uvId };
}
