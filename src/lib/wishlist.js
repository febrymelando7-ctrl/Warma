import { query } from './db';

// Himpunan ID produk yang sudah di-wishlist oleh akun ini
export async function getWishIds(userId) {
  try {
    return new Set((await query('SELECT product_id FROM wishlist WHERE user_id = ?', [userId])).map((r) => r.product_id));
  } catch { return new Set(); }
}
