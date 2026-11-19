import { query } from './db';

// Alamat milik satu akun (objek biasa, aman dikirim ke komponen client)
export async function getAddresses(userId) {
  try {
    const rows = await query('SELECT id, label, nama, telepon, alamat, kota, provinsi, kode_pos, utama FROM addresses WHERE user_id = ? ORDER BY utama DESC, id DESC', [userId]);
    return rows.map((r) => ({ id: r.id, label: r.label, nama: r.nama, telepon: r.telepon, alamat: r.alamat, kota: r.kota, provinsi: r.provinsi, kode_pos: r.kode_pos || '', utama: !!r.utama }));
  } catch { return []; }
}

// Teks alamat yang disimpan di pesanan, supaya tidak berubah walau alamat diedit kemudian
export const fullAddress = (a) => `${a.nama} (${a.telepon}) — ${a.alamat}, ${a.kota}, ${a.provinsi}${a.kode_pos ? ' ' + a.kode_pos : ''}`;
