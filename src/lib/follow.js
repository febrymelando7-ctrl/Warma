import { query } from './db';

export async function isFollowing(userId, toko) {
  try { return (await query('SELECT 1 FROM toko_favorit WHERE user_id = ? AND toko = ? LIMIT 1', [userId, toko])).length > 0; } catch { return false; }
}
export async function followerCount(toko) {
  try { return Number((await query('SELECT COUNT(*) AS n FROM toko_favorit WHERE toko = ?', [toko]))[0].n); } catch { return 0; }
}
