import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { notify } from '@/lib/notify';

const fail = (error, status) => NextResponse.json({ error }, { status });

// Klaim voucher ke akun (satu kali per akun)
export async function POST(req) {
  const u = await getUser();
  if (!u) return fail('Silakan masuk dulu.', 401);
  try {
    const { id } = await req.json();
    const v = (await query('SELECT *, (berlaku_sampai IS NOT NULL AND berlaku_sampai < CURDATE()) AS kedaluwarsa FROM vouchers WHERE id = ?', [id]))[0];
    if (!v || !v.kode) return fail('Voucher tidak ditemukan.', 404);
    if (Number(v.kedaluwarsa)) return fail('Voucher ini sudah berakhir.', 410);
    if (v.hanya_baru && Number((await query("SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND status <> 'batal'", [u.id]))[0].n) > 0)
      return fail('Voucher ini khusus akun baru yang belum pernah bertransaksi.', 403);
    if (v.kuota_total && Number((await query('SELECT COUNT(*) AS n FROM user_vouchers WHERE voucher_id = ?', [v.id]))[0].n) >= v.kuota_total)
      return fail('Kuota voucher ini sudah habis.', 409);
    try {
      await query('INSERT INTO user_vouchers (user_id, voucher_id) VALUES (?,?)', [u.id, v.id]);
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') return fail('Kamu sudah mengklaim voucher ini.', 409);
      throw e;
    }
    await notify(u.id, 'Voucher berhasil diklaim', `${v.judul} (kode ${v.kode}) sudah masuk ke akunmu. Pakai saat checkout.`, '/voucher', 'promo_voucher');
    return NextResponse.json({ ok: true });
  } catch { return fail('Gagal mengklaim voucher. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.', 500); }
}
