import { query } from './db';

// Jumlah percakapan yang punya pesan belum dibaca oleh pengguna ini
export async function chatUnread(uid) {
  try {
    return Number((await query(
      `SELECT COUNT(*) AS n FROM chat_threads t
       WHERE t.last_sender IS NOT NULL AND t.last_sender <> ?
         AND ((t.buyer_id = ? AND t.last_msg_id > t.buyer_read_id) OR (t.seller_id = ? AND t.last_msg_id > t.seller_read_id))`, [uid, uid, uid]))[0].n);
  } catch { return 0; }
}

// Tandai semua pesan di percakapan ini sebagai sudah dibaca oleh pengguna
export async function markRead(thread, uid) {
  await query('UPDATE chat_threads SET buyer_read_id = last_msg_id WHERE id = ? AND buyer_id = ?', [thread, uid]);
  await query('UPDATE chat_threads SET seller_read_id = last_msg_id WHERE id = ? AND seller_id = ?', [thread, uid]);
}

export const MSG_SQL = `SELECT m.id, m.sender_id, m.isi, m.gambar, m.created_at, p.slug AS pslug, p.nama AS pnama, p.harga AS pharga, p.gambar AS pgambar
  FROM chat_messages m LEFT JOIN products p ON p.id = m.product_id`;

export const mapMsg = (r, me) => ({
  id: r.id, mine: r.sender_id === me, isi: r.isi, gambar: r.gambar || null, at: new Date(r.created_at).toISOString(),
  produk: r.pslug ? { slug: r.pslug, nama: r.pnama, harga: Number(r.pharga), gambar: r.pgambar } : null,
});
