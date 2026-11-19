import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import EditProductForm from '@/components/EditProductForm';

export const metadata = { title: 'Edit Produk — Warma' };

export default async function Page({ params }) {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/penjual');
  if (user.peran !== 'penjual') redirect('/penjual');
  const { id } = await params;
  let p, extras = [], variants = [];
  try {
    p = (await query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [id, user.id]))[0];
    if (p) {
      extras = (await query('SELECT id, url, caption FROM product_images WHERE product_id = ? ORDER BY urutan, id', [p.id]).catch(() => [])).map((x) => ({ id: x.id, url: x.url, caption: x.caption || '' }));
      variants = (await query('SELECT id, nama, harga, stok FROM product_variants WHERE product_id = ? ORDER BY urutan, id', [p.id]).catch(() => [])).map((v) => ({ id: v.id, nama: v.nama, harga: Number(v.harga), stok: Number(v.stok) }));
    }
  } catch {}
  if (!p) notFound();
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}>
        <div><h2 style={{ fontSize: 22 }}>Edit produk</h2><p>Perubahan langsung tampil di toko dan halaman produk.</p></div>
        <div style={{ display: 'flex', gap: 8 }}><Link href={`/produk/${p.slug}`} className="out">Lihat halaman produk</Link><Link href="/penjual?tab=products" className="out">← Kembali</Link></div>
      </div>
      <EditProductForm p={{ id: p.id, nama: p.nama, kategori: p.kategori, deskripsi: p.deskripsi || '', harga: p.harga, harga_asli: p.harga_asli, stok: p.stok, gambar: p.gambar, berat: p.berat ?? 500, kondisi: p.kondisi ?? 'Baru', varian_label: p.varian_label || '', video: p.video || '' }} extras={extras} variants={variants} />
    </div>
  );
}
