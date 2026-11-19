import { query } from './db';

// Membuat notifikasi; kegagalan tidak boleh menggagalkan proses utama (pesanan, dll.)
export async function notify(userId, judul, isi, link = null, kategori = null) {
  try {
    if (kategori) {
      const p = (await query('SELECT aktif FROM notif_prefs WHERE user_id = ? AND kode = ?', [userId, kategori]))[0];
      if (p && !p.aktif) return; // pengguna mematikan jenis notifikasi ini
    }
    await query('INSERT INTO notifications (user_id, judul, isi, link) VALUES (?,?,?,?)', [userId, String(judul).slice(0, 120), String(isi).slice(0, 300), link]);
  } catch {}
}

// Penjual dicocokkan lewat nama toko: "Toko <nama depan akun>"
export async function notifySellers(tokoNames, judul, isi, link, kategori = null) {
  try {
    for (const t of new Set(tokoNames)) {
      const rows = await query("SELECT id FROM users WHERE peran = 'penjual' AND CONCAT('Toko ', SUBSTRING_INDEX(nama, ' ', 1)) = ?", [t]);
      for (const r of rows) await notify(r.id, judul, isi, link, kategori);
    }
  } catch {}
}

// Kabari semua pengikut sebuah toko (maks. 500 orang sekali kirim)
export async function notifyFollowers(toko, judul, isi, link, kategori = null) {
  try {
    const rows = await query('SELECT user_id FROM toko_favorit WHERE toko = ? LIMIT 500', [toko]);
    for (const r of rows) await notify(r.user_id, judul, isi, link, kategori);
  } catch {}
}
