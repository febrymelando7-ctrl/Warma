import { query } from './db';

// Nama toko penjual = "Toko <nama depan>". Item pesanan dicocokkan lewat kolom order_items.toko.
export const storeName = (u) => 'Toko ' + String(u.nama).split(' ')[0];

export async function sellerData(u) {
  const toko = storeName(u);
  const [products, orders, daily] = await Promise.all([
    query(`SELECT p.*, COALESCE((SELECT SUM(oi.qty) FROM order_items oi WHERE oi.toko = ? AND oi.nama = p.nama), 0) AS laku
           FROM products p WHERE p.seller_id = ? ORDER BY p.id DESC`, [toko, u.id]),
    query(`SELECT o.id, o.kode, o.status, o.created_at, b.nama AS pembeli, MAX(o.alamat) AS alamat, SUM(oi.harga * oi.qty) AS total, SUM(oi.qty) AS qty, GROUP_CONCAT(CONCAT(oi.nama, IF(oi.varian IS NULL, '', CONCAT(' (', oi.varian, ')'))) SEPARATOR ', ') AS items
           FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN users b ON b.id = o.user_id
           WHERE oi.toko = ? GROUP BY o.id, o.kode, o.status, o.created_at, b.nama ORDER BY o.id DESC LIMIT 100`, [toko]),
    query(`SELECT DATE(o.created_at) AS d, SUM(oi.harga * oi.qty) AS t FROM orders o JOIN order_items oi ON oi.order_id = o.id
           WHERE oi.toko = ? AND o.status <> 'batal' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(o.created_at)`, [toko]),
  ]);
  return { toko, products, orders, daily };
}
