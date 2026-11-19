import Link from 'next/link';
import { ShoppingBag, Star, MapPin } from 'lucide-react';
import { Wish, AddToCart } from '@/components/Client';
import { rp } from '@/lib/format';

export default function ProductCard({ p, wished = false }) {
  return (
    <div className="card">
      <div className="im" style={{ backgroundImage: `url(${p.gambar})` }}>
        <Link href={`/produk/${p.slug}`} className="cover" aria-label={p.nama} />
        {p.diskon > 0 && <span className="off">-{p.diskon}%</span>}
        {p.video && <span className="vbadge">▶ Video</span>}
        <Wish id={p.id} on={wished} />
        <AddToCart id={p.id} slug={p.slug} className="cart" done="✓"><ShoppingBag size={13} /></AddToCart>
      </div>
      <div className="cb">
        <div className="nm"><Link href={`/produk/${p.slug}`} className="nl">{p.nama}</Link></div>
        <div className="pr">{rp(p.harga)}{p.harga_asli > p.harga && <s>{rp(p.harga_asli)}</s>}</div>
        <div className="meta"><Star size={10} fill="#8fd25f" stroke="none" /> <b>{p.rating.toFixed(1)}</b> | {p.terjual} terjual</div>
        <div className="meta"><MapPin size={10} /> {p.lokasi}</div>
        <div className="sf"><span className={'tag' + (p.tipe_toko === 'pengguna' ? ' p' : '')}>{p.tipe_toko === 'pengguna' ? 'Penjual Pengguna' : p.tipe_toko === 'lokal' ? 'Toko Lokal' : 'Toko Resmi'}</span><span>{p.toko}</span></div>
      </div>
    </div>
  );
}
