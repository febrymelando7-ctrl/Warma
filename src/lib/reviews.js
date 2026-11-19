import { query } from './db';

export async function getReviews(productId) {
  if (!productId) return { rows: [], dist: [] };
  try {
    const rows = await query('SELECT r.id, r.rating, r.komentar, r.created_at, u.nama FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.id DESC LIMIT 50', [productId]);
    const dist = await query('SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating', [productId]);
    return { rows, dist };
  } catch { return { rows: [], dist: [] }; }
}

// 'guest' | 'ok' (boleh menulis) | 'done' (sudah menulis) | 'no' (belum ada pesanan selesai)
export async function reviewState(user, p) {
  if (!user) return 'guest';
  if (!p.id) return 'no';
  try {
    if ((await query('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [p.id, user.id])).length) return 'done';
    const ok = await query("SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = ? AND o.status = 'selesai' AND oi.nama = ? AND oi.toko = ? LIMIT 1", [user.id, p.nama, p.toko]);
    return ok.length ? 'ok' : 'no';
  } catch { return 'no'; }
}

export const mask = (n) => { const w = String(n).trim(); return w.length < 3 ? w : w[0] + '***' + w[w.length - 1]; };

export function ago(d) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return 'Hari ini';
  if (days < 30) return `${days} hari lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}
