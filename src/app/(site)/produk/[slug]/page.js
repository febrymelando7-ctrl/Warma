import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ShieldCheck, Check, RotateCcw, Headphones } from 'lucide-react';
import { getProduct, getRelated, getStoreProducts, getStore, getImages, getVariants, rp } from '@/lib/data';
import { getReviews, reviewState, mask, ago } from '@/lib/reviews';
import { getUser } from '@/lib/auth';
import { getWishIds } from '@/lib/wishlist';
import { isFollowing, followerCount } from '@/lib/follow';
import { SHIP } from '@/lib/shipping';
import Gallery from '@/components/Gallery';
import Collage from '@/components/Collage';
import TabsNav from '@/components/TabsNav';
import DetailTabs from '@/components/DetailTabs';
import { ShipBox, FollowBtn } from '@/components/ShipBox';
import ProductBuy from '@/components/ProductBuy';
import { VariantProvider, PriceBlock, VariantPicker } from '@/components/VariantCtx';
import ReviewForm from '@/components/ReviewForm';

const BADGE = { resmi: 'Toko Resmi', lokal: 'Toko Lokal', pengguna: 'Penjual Pengguna' };
const TABS = [['detail', 'Detail Produk'], ['ulasan', 'Ulasan'], ['rekomendasi', 'Rekomendasi']];
const Stars = ({ n, size = 13 }) => [1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} fill={i <= n ? '#f4b400' : 'none'} stroke="#f4b400" />);

export async function generateMetadata({ params }) {
  const p = await getProduct((await params).slug);
  return { title: p ? `${p.nama} — Warma` : 'Produk tidak ditemukan — Warma' };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const user = await getUser();
  const wished = user ? await getWishIds(user.id) : new Set();
  const followed = user ? await isFollowing(user.id, p.toko) : false;
  const followers = await followerCount(p.toko);
  const [store, storeItems, extra, rv, state, variants] = await Promise.all([getStore(p.toko), getStoreProducts(p), getImages(p.id), getReviews(p.id), reviewState(user, p), getVariants(p.id)]);
  const reco = storeItems.length ? storeItems : await getRelated(p);

  const media = [
    { type: 'image', url: p.gambar, caption: '' },
    ...(p.video ? [{ type: 'video', url: p.video, caption: '' }] : []),
    ...extra.map((e) => ({ type: 'image', url: e.url, caption: e.caption })),
  ];
  const photos = media.filter((m) => m.type === 'image');
  const showGaleri = photos.length >= 3;
  const tabs = [['detail', 'Detail Produk'], ...(showGaleri ? [['galeri', 'Galeri']] : []), ['ulasan', 'Ulasan'], ['rekomendasi', 'Rekomendasi']];
  const dist = [5, 4, 3, 2, 1].map((s) => [s, Number(rv.dist.find((d) => Number(d.rating) === s)?.n || 0)]);
  const total = dist.reduce((a, [, n]) => a + n, 0);
  const avg = total ? dist.reduce((a, [s, n]) => a + s * n, 0) / total : 0;
  const puas = total ? Math.round((dist.filter(([s]) => s >= 4).reduce((a, [, n]) => a + n, 0) / total) * 100) : 0;
  const desc = p.deskripsi || `${p.nama} dari ${p.toko}. Penjual belum menambahkan deskripsi lengkap untuk produk ini.`;
  const info = [
    'Pembayaran diproses lewat rekening bersama Warma: dana baru diteruskan ke penjual setelah paketmu diterima.',
    'Pengembalian barang dapat diajukan dalam 7 hari melalui halaman Pesanan saya.',
    p.tipe_toko === 'resmi' ? 'Barang dijual oleh toko resmi yang sudah terverifikasi.' : p.tipe_toko === 'pengguna' ? 'Barang dijual oleh penjual perorangan. Periksa foto dan kondisi dengan teliti sebelum memesan.' : 'Barang dijual oleh toko lokal.',
    'Pembelian minimal 1 buah dan maksimal 99 buah per pesanan.',
  ];
  const rows = [['Kondisi', p.kondisi], ['Berat Satuan', `${p.berat} g`], ['Min. Beli', '1 Buah'], ['Kategori', p.kategori, `/cari?kategori=${encodeURIComponent(p.kategori)}`], ['Etalase', 'Semua Etalase']];
  const spec = [['Kondisi', p.kondisi], ['Berat satuan', `${p.berat} g`], ['Kategori', p.kategori], ['Toko', p.toko], ['Tipe penjual', BADGE[p.tipe_toko]], ['Dikirim dari', p.lokasi], ['Stok', p.stok], ['Terjual', p.terjual]];

  return (
    <div className="wrap" style={{ paddingTop: 16, paddingBottom: 56 }}>
      <TabsNav nama={p.nama} tabs={tabs} />
      <div className="meta" style={{ marginBottom: 14 }}><Link href="/">Beranda</Link> › <Link href={`/cari?kategori=${encodeURIComponent(p.kategori)}`}>{p.kategori}</Link> › <b style={{ color: '#0b1b2b' }}>{p.nama}</b></div>

      <VariantProvider base={{ harga: p.harga, asli: p.harga_asli, stok: p.stok }} label={p.varian_label} variants={variants}>
      <div className="pd3">
        <Gallery media={media} alt={p.nama} diskon={p.diskon} />

        <div>
          <h1 className="pdt">{p.nama}</h1>
          <div className="meta" style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0 14px', flexWrap: 'wrap' }}>
            <span>Terjual <b style={{ color: '#0b1b2b' }}>{p.terjual}</b></span><span>•</span>
            <span><Star size={12} fill="#f4b400" stroke="none" /> <b style={{ color: '#0b1b2b' }}>{p.rating.toFixed(1)}</b> ({total ? `${total} ulasan` : 'belum ada ulasan'})</span>
            {p.stok > 0 && p.stok < 5 && <span className="tag">Stok terbatas</span>}
          </div>
          <PriceBlock />
          <VariantPicker />

          <div id="detail" className="sec2" style={{ marginTop: 0 }}>
            <DetailTabs rows={rows} deskripsi={desc} spec={spec} info={info} />
          </div>

          <div className="storec">
            <span className="av">{p.toko.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{p.toko}</b> <span className={'tag' + (p.tipe_toko === 'pengguna' ? ' p' : '')}>{BADGE[p.tipe_toko]}</span>
              <div className="meta" style={{ marginTop: 4 }}>★ {store.r.toFixed(1)} rata-rata rating · {store.n} total barang · {followers} pengikut</div></div>
            <FollowBtn toko={p.toko} on={followed} />
          </div>
          <ShipBox lokasi={p.lokasi} options={SHIP[p.tipe_toko]} />
        </div>

        <ProductBuy id={p.id} info={`${p.kondisi} · ${p.kategori}`} next={`/produk/${p.slug}`} wished={wished.has(p.id)} sellerId={p.seller_id || null} isOwner={!!user && user.id === p.seller_id} />
      </div>
      </VariantProvider>

      {showGaleri && (
        <section id="galeri" className="sec2">
          <h2>GALERI FOTO &amp; MOTIF</h2>
          <Collage photos={photos} />
        </section>)}

      <section id="ulasan" className="sec2">
        <h2>ULASAN PEMBELI</h2>
        {total ? (
          <div className="rvbox">
            <div><div><Star size={26} fill="#f4b400" stroke="none" style={{ verticalAlign: -4 }} /> <span className="rvbig">{avg.toFixed(1)}</span> <span className="meta">/ 5.0</span></div>
              <div style={{ margin: '8px 0 2px', fontWeight: 600 }}>{puas}% pembeli merasa puas</div><div className="meta">{total} ulasan</div></div>
            <div className="rvbars">{dist.map(([s, n]) => <div key={s}><Star size={11} fill="#f4b400" stroke="none" /> {s}<i><b style={{ width: `${(n / total) * 100}%` }} /></i> ({n})</div>)}</div>
          </div>
        ) : <div className="panel meta">Belum ada ulasan untuk produk ini.</div>}

        {state === 'ok' && <ReviewForm productId={p.id} />}
        {state === 'done' && <p className="meta" style={{ marginTop: 10 }}>Terima kasih, kamu sudah memberi ulasan untuk produk ini.</p>}
        {state === 'guest' && <p className="meta" style={{ marginTop: 10 }}><Link href={`/masuk?next=/produk/${p.slug}`} style={{ color: '#14507f', fontWeight: 700 }}>Masuk</Link> untuk menulis ulasan setelah pesananmu selesai.</p>}
        {state === 'no' && <p className="meta" style={{ marginTop: 10 }}>Ulasan bisa ditulis setelah pesananmu untuk produk ini berstatus Selesai.</p>}

        {rv.rows.map((r) => (
          <div className="rv" key={r.id}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Stars n={r.rating} /><span className="meta">{ago(r.created_at)}</span></div>
            <div className="who"><span className="av">{String(r.nama)[0]?.toUpperCase()}</span>{mask(r.nama)}</div>
            {r.komentar && <p>{r.komentar}</p>}
          </div>))}
      </section>

      <section id="rekomendasi" className="sec2">
        <div className="sec" style={{ margin: '0 0 12px' }}><h2 style={{ fontSize: 20, fontWeight: 800 }}>{storeItems.length ? 'Lainnya di toko ini' : 'Produk serupa'}</h2>{storeItems.length > 0 && <Link href={`/cari?q=${encodeURIComponent(p.toko)}`} style={{ color: '#14507f', fontWeight: 700 }}>Lihat Semua</Link>}</div>
        {reco.length ? <div className="g5">{reco.slice(0, 10).map((r) => (
          <div className="card" key={r.slug}>
            <div className="im" style={{ backgroundImage: `url(${r.gambar})` }}><Link href={`/produk/${r.slug}`} className="cover" aria-label={r.nama} /><span className="off">-{r.diskon}%</span></div>
            <div className="cb"><div className="nm"><Link href={`/produk/${r.slug}`} className="nl">{r.nama}</Link></div><div className="pr">{rp(r.harga)}<s>{rp(r.harga_asli)}</s></div>
              <div className="meta"><Star size={10} fill="#f4b400" stroke="none" /> <b>{r.rating.toFixed(1)}</b> • {r.terjual} terjual</div></div>
          </div>))}</div> : <p className="meta">Belum ada produk lain.</p>}
      </section>

      <div className="trust" style={{ marginTop: 30 }}>{[[ShieldCheck, 'Pembayaran Rekening Bersama', 'Dana ditahan Warma sampai paket kamu diterima dengan baik.'], [Check, '100% Produk Original', 'Toko resmi terverifikasi dengan garansi uang kembali.'], [RotateCcw, 'Retur Mudah 7 Hari', 'Ajukan pengembalian langsung dari halaman pesanan.'], [Headphones, 'Bantuan 24/7', 'Tim Warma siap di live chat kapan pun kamu butuh.']].map(([I, t, d]) => <div key={t}><b><I size={11} /> {t}</b>{d}</div>)}</div>
    </div>
  );
}
