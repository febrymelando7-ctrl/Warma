import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getWishlistProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

export const metadata = { title: 'Wishlist — Warma' };

export default async function Page() {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/wishlist');
  const items = await getWishlistProducts(user.id);
  return (
    <div className="wrap" style={{ padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 16px' }}>
        <div><h2 style={{ fontSize: 22 }}>Wishlist saya</h2><p>{items.length} produk tersimpan · klik ikon hati untuk menghapus</p></div>
        <Link href="/cari" className="out">Cari produk lain →</Link>
      </div>
      {items.length ? <div className="g5">{items.map((p) => <ProductCard key={p.slug} p={p} wished />)}</div> : (
        <div className="panel" style={{ textAlign: 'center', padding: 44 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><Heart size={16} /></span>
          <b>Wishlist kamu masih kosong</b>
          <p className="meta" style={{ margin: '6px 0 14px' }}>Klik ikon hati di produk mana pun untuk menyimpannya di sini.</p>
          <Link href="/" className="btn-g" style={{ display: 'inline-flex' }}>Mulai belanja</Link>
        </div>)}
    </div>
  );
}
