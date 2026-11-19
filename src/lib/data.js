import { query } from './db';
import seed from './seed.json';

export const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

const parseSold = (s) => { const m = String(s).replace(',', '.').match(/[\d.]+/); const n = m ? parseFloat(m[0]) : 0; return /rb/i.test(String(s)) ? Math.round(n * 1000) : Math.round(n); };
const fmtSold = (n) => (n < 1000 ? String(n) : (n / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' rb');

const norm = (p) => ({ ...p, terjual: Number(p.terjual_n) > 0 ? fmtSold(Number(p.terjual_n)) : p.terjual, rating: Number(p.rating), gambar: p.gambar || `/images/p-${p.slug}.jpg`, stok: p.stok ?? 50, berat: p.berat ?? 500, kondisi: p.kondisi ?? (p.kategori === 'Preloved & Bekas' ? 'Bekas' : 'Baru') });

// Ambil dari MySQL (XAMPP). Bila MySQL belum menyala / database belum diimpor,
// halaman tetap tampil memakai data contoh di seed.json.
async function dbOr(sql, params, fallback) {
  try {
    const rows = await query(sql, params);
    return rows.length ? rows : fallback;
  } catch {
    return fallback;
  }
}

export const getCategories = () =>
  dbOr('SELECT slug, nama, jumlah_produk AS produk FROM categories ORDER BY id', [], seed.categories);

export const getVouchers = () => dbOr('SELECT * FROM vouchers ORDER BY id', [], seed.vouchers);

export async function getFlashSale() {
  const rows = await dbOr("SELECT * FROM products WHERE flash_sale = 1 AND status = 'aktif' ORDER BY id", [], seed.products.filter((p) => p.flash_sale));
  return rows.map(norm);
}

export async function getProducts(q = '') {
  const like = `%${q}%`;
  const fb = seed.products.filter((p) => !p.flash_sale && (p.nama + p.kategori).toLowerCase().includes(q.toLowerCase()));
  const rows = q
    ? await dbOr("SELECT * FROM products WHERE flash_sale = 0 AND status = 'aktif' AND (nama LIKE ? OR kategori LIKE ?) ORDER BY id", [like, like], fb)
    : await dbOr("SELECT * FROM products WHERE flash_sale = 0 AND status = 'aktif' ORDER BY id", [], fb);
  return rows.map(norm);
}

export async function getProduct(slug) {
  const rows = await dbOr("SELECT * FROM products WHERE slug = ? AND status = 'aktif'", [slug], []);
  const row = rows[0] || seed.products.find((p) => p.slug === slug);
  return row ? norm(row) : null;
}

export async function getRelated(p) {
  const fb = seed.products.filter((x) => x.kategori === p.kategori && x.slug !== p.slug).slice(0, 5);
  const rows = await dbOr("SELECT * FROM products WHERE kategori = ? AND slug <> ? AND status = 'aktif' ORDER BY id LIMIT 5", [p.kategori, p.slug], fb);
  return rows.map(norm);
}

export async function getImages(id) {
  if (!id) return [];
  const rows = await dbOr('SELECT url, caption FROM product_images WHERE product_id = ? ORDER BY urutan, id', [id], []);
  return rows.map((r) => ({ url: r.url, caption: r.caption || '' }));
}

export async function getStore(toko) {
  const mine = seed.products.filter((x) => x.toko === toko);
  const r = (await dbOr("SELECT COUNT(*) AS n, ROUND(AVG(rating), 1) AS r FROM products WHERE toko = ? AND status = 'aktif'", [toko], []))[0];
  if (r && Number(r.n)) return { n: Number(r.n), r: Number(r.r) };
  return { n: mine.length || 1, r: mine.length ? Number((mine.reduce((a, x) => a + Number(x.rating), 0) / mine.length).toFixed(1)) : 5 };
}

export async function getStoreProducts(p) {
  const fb = seed.products.filter((x) => x.toko === p.toko && x.slug !== p.slug).slice(0, 5);
  const rows = await dbOr("SELECT * FROM products WHERE toko = ? AND slug <> ? AND status = 'aktif' ORDER BY id LIMIT 10", [p.toko, p.slug], fb);
  return rows.map(norm);
}

export const SORT_LABEL = { relevan: 'Paling Sesuai', terlaris: 'Terlaris', rating: 'Rating Tertinggi', termurah: 'Harga Terendah', termahal: 'Harga Tertinggi', terbaru: 'Terbaru' };
const SORTS = { relevan: 'id ASC', terlaris: 'terjual_n DESC, id ASC', termurah: 'harga ASC, id ASC', termahal: 'harga DESC, id ASC', rating: 'rating DESC, terjual_n DESC, id ASC', terbaru: 'id DESC' };

// Pencarian + filter + urutan + halaman. Bila MySQL belum siap, dicari di data contoh.
export async function searchProducts(f) {
  const { q = '', kategori = '', tipe = [], min = 0, max = 0, rating = 0, diskon = false, urut = 'relevan', page = 1, per = 12 } = f;
  const where = ["status = 'aktif'"]; const params = [];
  if (q) { const l = `%${q}%`; where.push('(nama LIKE ? OR kategori LIKE ? OR toko LIKE ?)'); params.push(l, l, l); }
  if (kategori) { where.push('kategori = ?'); params.push(kategori); }
  if (tipe.length) { where.push(`tipe_toko IN (${tipe.map(() => '?').join(',')})`); params.push(...tipe); }
  if (min) { where.push('harga >= ?'); params.push(min); }
  if (max) { where.push('harga <= ?'); params.push(max); }
  if (rating) { where.push('rating >= ?'); params.push(rating); }
  if (diskon) where.push('diskon > 0');
  const w = where.join(' AND ');
  try {
    const total = Number((await query(`SELECT COUNT(*) AS n FROM products WHERE ${w}`, params))[0].n);
    const rows = await query(`SELECT * FROM products WHERE ${w} ORDER BY ${SORTS[urut] || SORTS.relevan} LIMIT ? OFFSET ?`, [...params, per, (page - 1) * per]);
    return { rows: rows.map(norm), total };
  } catch {
    let r = seed.products.map((p) => ({ ...p, terjual_n: parseSold(p.terjual) })).filter((p) =>
      (!q || (p.nama + p.kategori + p.toko).toLowerCase().includes(q.toLowerCase())) && (!kategori || p.kategori === kategori) &&
      (!tipe.length || tipe.includes(p.tipe_toko)) && (!min || p.harga >= min) && (!max || p.harga <= max) && (!rating || p.rating >= rating) && (!diskon || p.diskon > 0));
    const by = { termurah: (a, b) => a.harga - b.harga, termahal: (a, b) => b.harga - a.harga, terlaris: (a, b) => b.terjual_n - a.terjual_n, rating: (a, b) => b.rating - a.rating, terbaru: () => 0 }[urut];
    if (by) r = [...r].sort(by);
    return { rows: r.slice((page - 1) * per, page * per).map(norm), total: r.length };
  }
}

export async function getFacets(q = '') {
  const l = `%${q}%`;
  const count = {};
  seed.products.filter((p) => !q || (p.nama + p.kategori + p.toko).toLowerCase().includes(q.toLowerCase())).forEach((p) => { count[p.kategori] = (count[p.kategori] || 0) + 1; });
  const fb = Object.entries(count).map(([kategori, n]) => ({ kategori, n }));
  const rows = await dbOr(q ? "SELECT kategori, COUNT(*) AS n FROM products WHERE status = 'aktif' AND (nama LIKE ? OR kategori LIKE ? OR toko LIKE ?) GROUP BY kategori ORDER BY n DESC" : "SELECT kategori, COUNT(*) AS n FROM products WHERE status = 'aktif' GROUP BY kategori ORDER BY n DESC", q ? [l, l, l] : [], fb);
  return rows.map((r) => ({ kategori: r.kategori, n: Number(r.n) }));
}

export async function getVariants(id) {
  if (!id) return [];
  const rows = await dbOr('SELECT id, nama, harga, stok FROM product_variants WHERE product_id = ? ORDER BY urutan, id', [id], []);
  return rows.map((v) => ({ id: v.id, nama: v.nama, harga: Number(v.harga), stok: Number(v.stok) }));
}

export async function getWishlistProducts(userId) {
  const rows = await dbOr("SELECT p.* FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id = ? AND p.status = 'aktif' ORDER BY w.id DESC", [userId], []);
  return rows.map(norm);
}
