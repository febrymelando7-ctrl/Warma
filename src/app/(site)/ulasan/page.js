import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Star } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import MyReview from '@/components/MyReview';

export const metadata = { title: 'Ulasan Saya — Warma' };

export default async function Page({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/ulasan');
  const sp = (await searchParams) || {};
  const tab = sp.tab === 'menunggu' ? 'menunggu' : 'saya';

  let mine = [], todo = [], failed = false;
  try {
    mine = (await query(
      `SELECT r.id, r.rating, r.komentar, r.created_at, p.slug, p.nama, p.gambar
       FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.user_id = ? ORDER BY r.id DESC`, [user.id]))
      .map((r) => ({ id: r.id, rating: r.rating, komentar: r.komentar || '', at: new Date(r.created_at).toISOString(), slug: r.slug, nama: r.nama, gambar: r.gambar }));
    // Produk dari pesanan yang sudah selesai dan belum kamu ulas
    todo = (await query(
      `SELECT DISTINCT p.id, p.slug, p.nama, p.gambar
       FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.nama = oi.nama AND p.toko = oi.toko
       WHERE o.user_id = ? AND o.status = 'selesai' AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id AND r.user_id = ?) LIMIT 30`, [user.id, user.id]))
      .map((p) => ({ id: p.id, slug: p.slug, nama: p.nama, gambar: p.gambar }));
  } catch { failed = true; }

  return (
    <div className="wrap" style={{ maxWidth: 820, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}><div><h2 style={{ fontSize: 22 }}>Ulasan</h2><p>Ulasan yang pernah kamu tulis dan produk yang menunggu ulasanmu.</p></div></div>
      <div className="chips">
        <Link href="/ulasan" className={tab === 'saya' ? 'on' : ''}>Ulasan saya <em>{mine.length}</em></Link>
        <Link href="/ulasan?tab=menunggu" className={tab === 'menunggu' ? 'on' : ''}>Menunggu ulasan <em>{todo.length}</em></Link>
      </div>
      {failed && <div className="aerr">Tidak bisa membaca ulasan. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.</div>}

      {!failed && tab === 'saya' && (mine.length ? mine.map((r) => <MyReview key={r.id} r={r} />) : (
        <div className="panel" style={{ textAlign: 'center', padding: 44 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><Star size={16} /></span>
          <b>Belum ada ulasan</b>
          <p className="meta" style={{ margin: '6px 0 14px' }}>Ulasan bisa ditulis setelah pesananmu berstatus Selesai.</p>
          <Link href="/pesanan" className="btn-g" style={{ display: 'inline-flex' }}>Lihat pesanan saya</Link>
        </div>))}

      {!failed && tab === 'menunggu' && (todo.length ? todo.map((p) => (
        <div className="panel acard" key={p.id}>
          <span style={{ width: 52, height: 52, borderRadius: 10, flex: 'none', background: `#e8ecdf url(${p.gambar}) center/cover` }} />
          <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{p.nama}</b><div className="meta">Pesananmu sudah selesai. Bagaimana barangnya?</div></div>
          <Link href={`/produk/${p.slug}#ulasan`} className="btn-g">Tulis ulasan</Link>
        </div>)) : <div className="panel meta" style={{ textAlign: 'center', padding: 32 }}>Tidak ada produk yang menunggu ulasan.</div>)}
    </div>
  );
}
