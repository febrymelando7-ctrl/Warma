import { query } from './db';

const BADGE = { resmi: 'OFFICIAL STORE', lokal: 'LOCAL STORE', pengguna: 'INDIVIDUAL SELLER' };
const NOTE = { resmi: 'Dikemas oleh toko resmi, tersedia setiap saat.', lokal: 'Dikemas rapi oleh toko lokal.', pengguna: 'Penjual membalas chat dalam 1 jam.' };

// Harga = harga varian bila ada, kalau tidak harga produk
export async function getCart(userId) {
  try {
    return await query(
      `SELECT c.id, c.qty, v.nama AS varian, p.varian_label, p.nama, COALESCE(v.harga, p.harga) AS harga, p.harga_asli, p.kategori, p.toko, p.tipe_toko, p.lokasi, p.rating, p.gambar
       FROM cart_items c JOIN products p ON p.id = c.product_id LEFT JOIN product_variants v ON v.id = c.variant_id
       WHERE c.user_id = ? AND (c.variant_id IS NULL OR v.id IS NOT NULL) ORDER BY c.id`, [userId]);
  } catch { return []; }
}

// Kelompokkan isi keranjang per penjual (satu penjual = satu paket)
export function groupCart(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.toko)) m.set(r.toko, { id: m.size + 1, nama: r.toko, tipe: r.tipe_toko, badge: BADGE[r.tipe_toko], kota: r.lokasi, rating: Number(r.rating), note: NOTE[r.tipe_toko], items: [] });
    const tag = BADGE[r.tipe_toko].split(' ')[0];
    m.get(r.toko).items.push({
      id: r.id, nama: r.nama,
      info: `${r.varian ? `${r.varian_label || 'Varian'}: ${r.varian} · ` : ''}${r.kategori} · ${r.lokasi}`,
      tags: [tag[0] + tag.slice(1).toLowerCase()],
      harga: Number(r.harga), asli: Math.max(Number(r.harga_asli), Number(r.harga)), qty: r.qty, img: r.gambar,
    });
  }
  return [...m.values()];
}
