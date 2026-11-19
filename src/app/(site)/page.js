import Link from 'next/link';
import { ShoppingBag, Zap, Store, Recycle, Coins, Truck, Smartphone, MapPin, Star, User, ShieldCheck, RotateCcw, Headphones, Image as Img, Check, ChevronDown, ChevronRight, ArrowRight, Users, Trophy, Clock } from 'lucide-react';
import { getCategories, getFlashSale, getProducts, getVouchers, rp } from '@/lib/data';
import { Wish, Countdown, AddToCart, ClaimBtn } from '@/components/Client';
import HeroSlider from '@/components/HeroSlider';
import { getUser } from '@/lib/auth';
import { getWishIds } from '@/lib/wishlist';
import { getClaimedMap } from '@/lib/vouchers';

const QUICK = [[Store, 'Warma Mall', '#cdeeb0'], [Recycle, 'Preloved Komunitas', '#e4f4d6'], [Coins, 'Check-in & Koin', '#d6e9f8'], [Truck, 'Voucher Ongkir', '#d4f1f0'], [Zap, 'Flash Sale', '#e4f4d6'], [Smartphone, 'Top-Up & Tagihan', '#d6e9f8']];
const QL = { 'Warma Mall': '/cari?tipe=resmi', 'Preloved Komunitas': '/cari?kategori=Preloved%20%26%20Bekas', 'Voucher Ongkir': '#voucher', 'Flash Sale': '#flash' };
const VI = { hijau: Check, biru: Truck, tosca: User };

export default async function Home({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = (sp.q || '').toString();
  const tab = ['trending', 'resmi', 'sekitar'].includes(sp.tab) ? sp.tab : 'untukmu';
  const user = await getUser();
  const wished = user ? await getWishIds(user.id) : new Set();
  const claimed = user ? await getClaimedMap(user.id) : {};
  const [cats, flash, vouchers, all] = await Promise.all([getCategories(), getFlashSale(), getVouchers(), getProducts(q)]);
  const soldN = (p) => Number(p.terjual_n) || (/rb/i.test(p.terjual) ? Math.round(parseFloat(String(p.terjual).replace(',', '.')) * 1000) : parseInt(p.terjual, 10) || 0);
  const products = tab === 'trending' ? [...all].sort((a, b) => soldN(b) - soldN(a)) : tab === 'resmi' ? all.filter((p) => p.tipe_toko === 'resmi') : tab === 'sekitar' ? all.filter((p) => p.tipe_toko !== 'resmi') : all;
  return (
    <div className="wrap">
      <div className="quick">{QUICK.map(([I, t, c]) => <a key={t} href={QL[t] || '#'}><i style={{ background: c }}><I size={14} /></i>{t}</a>)}</div>

      <section className="hero">
        <HeroSlider />
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="ht t1"><span className="chip">BRAND DAY · HARI INI</span><h3>Diskon 40% Brand Resmi</h3><p>Skincare, sneakers & audio pilihan</p><Link href="/cari?tipe=resmi&diskon=1">Lihat Brand Day →</Link></div>
          <div className="ht t2"><span className="chip">KOMUNITAS PRELOVED</span><h3>Barang bekas berkualitas</h3><p>Kurasi penjual terverifikasi Warma</p><Link href="/cari?kategori=Preloved%20%26%20Bekas">Jelajahi Preloved →</Link></div>
        </div>
      </section>

      <div className="sec"><div><h2>Kategori Serba Ada</h2><p>Apa pun yang kamu cari, semua ada di satu tempat — dari fashion sampai barang preloved.</p></div><Link href="/cari" className="out">Lihat semua kategori ›</Link></div>
      <div className="cats">{cats.map((c) => (
        <a key={c.slug} href={`/cari?kategori=${encodeURIComponent(c.nama)}`} className="cat" style={{ backgroundImage: `url(/images/cat-${c.slug}.jpg)` }}>
          <b>{c.nama}</b><small>{Number(c.produk).toLocaleString('id-ID')} produk</small>
        </a>))}
      </div>

      <section className="flash" id="flash">
        <div className="fh"><span className="fi"><Zap size={16} /></span><div><h2>Flash Sale Hari Ini</h2><p>Harga terbaik, stok terbatas per jam</p></div><Countdown /><Link href="/cari?diskon=1" className="out">Lihat Semua ›</Link></div>
        <div className="g5">{flash.map((p, i) => (
          <div className="card" key={p.slug}>
            <div className="im" style={{ backgroundImage: `url(${p.gambar})` }}><Link href={`/produk/${p.slug}`} className="cover" aria-label={p.nama} /><span className="off">-{p.diskon}%</span><Wish id={p.id} on={wished.has(p.id)} /></div>
            <div className="cb"><div className="nm"><Link href={`/produk/${p.slug}`} className="nl">{p.nama}</Link></div><div className="pr">{rp(p.harga)}<s>{rp(p.harga_asli)}</s></div>
              <div className="pg"><i style={{ width: p.persen_terjual + '%' }} /></div>
              <div className="pgl"><span>Terjual {p.persen_terjual}%</span><span>Sisa {100 - p.persen_terjual}%</span></div>
              <AddToCart id={p.id} slug={p.slug} className="add">▣ Tambah</AddToCart></div>
          </div>))}
        </div>
      </section>

      <div className="sec" id="voucher"><div><h2>Voucher & Cashback</h2><p>Klaim sekarang, otomatis masuk ke dompet voucher akunmu.</p></div><span className="meta"><Clock size={10} /> Diperbarui setiap hari</span></div>
      <div className="vs">{vouchers.map((v) => { const I = VI[v.warna] || Check; return (
        <div className={'v ' + v.warna} key={v.judul}>
          <div className="vl"><I size={14} style={{ margin: '0 auto 4px' }} /><b>{v.badge}</b><small>OFF</small></div>
          <div className="vb"><h4>{v.judul}</h4><strong style={{ fontWeight: 500 }}>{v.deskripsi}</strong><b style={{ color: '#14507f' }}>{v.minimal}</b>
            <div className="row"><span>{v.berlaku}<br />{v.kuota}</span><ClaimBtn id={v.id} state={claimed[v.id]} /></div></div>
        </div>); })}
      </div>

      <div className="sec" id="rekomendasi"><div><h2>Rekomendasi Untukmu<span className="dp">DIPERSONALISASI</span></h2><p>Dipilih dari toko resmi dan penjual pengguna terverifikasi di sekitarmu.</p></div>
        <div className="tabs">{[['untukmu', 'Untukmu'], ['trending', 'Trending Hari Ini'], ['resmi', 'Hanya Toko Resmi'], ['sekitar', 'Penjual Sekitar']].map(([k, l]) => <Link key={k} href={`/?tab=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}#rekomendasi`} scroll={false} className={tab === k ? 'on' : ''}>{l}</Link>)}</div></div>
      {q && <p className="meta" style={{ marginBottom: 10 }}>Hasil untuk “{q}” — {products.length} produk</p>}
      <div className="g5">{products.map((p, i) => (
        <div className="card" key={p.slug}>
          <div className="im" style={{ backgroundImage: `url(${p.gambar})` }}><Link href={`/produk/${p.slug}`} className="cover" aria-label={p.nama} /><span className="off">-{p.diskon}%</span><Wish id={p.id} on={wished.has(p.id)} /><AddToCart id={p.id} slug={p.slug} className="cart" done="✓"><ShoppingBag size={13} /></AddToCart></div>
          <div className="cb"><div className="nm"><Link href={`/produk/${p.slug}`} className="nl">{p.nama}</Link></div><div className="pr">{rp(p.harga)}<s>{rp(p.harga_asli)}</s></div>
            <div className="meta"><Star size={10} fill="#8fd25f" stroke="none" /> <b>{p.rating.toFixed(1)}</b> | {p.terjual} terjual</div>
            <div className="meta"><MapPin size={10} /> {p.lokasi}</div>
            <div className="sf"><span className={'tag' + (p.tipe_toko === 'pengguna' ? ' p' : '')}>{p.tipe_toko === 'pengguna' ? 'Penjual Pengguna' : 'Toko Resmi'}</span><span>{p.toko}</span></div></div>
        </div>))}
      </div>
      {!products.length && <p className="meta">Belum ada produk yang cocok. Coba kata kunci lain.</p>}
      <Link href="/cari" className="out more">Muat lebih banyak produk ⌄</Link>

      <section className="cta">
        <div className="c1"><span className="chip" style={{ background: '#fff', color: '#14507f', borderColor: '#d8ddd0' }}>UNTUK PENJUAL PERORANGAN</span>
          <h2>Barang nganggur di rumah?<br />Ubah jadi uang dalam 3 menit.</h2><p>Kamu tidak perlu punya toko. Unggah foto, tulis kondisi barang, dan biarkan pembeli di seluruh Indonesia menemukannya.</p>
          <ul><li>▣ Foto barang, harga otomatis disarankan</li><li>▣ Kurir jemput paket dari rumahmu</li><li>▣ Pembayaran aman lewat rekening bersama</li></ul>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10 }}><button className="btn-g">⊕ Mulai Jual Barang Bekas</button>Gratis biaya listing selamanya</div></div>
        <div className="c2"><span className="chip">UNTUK BRAND & TOKO RESMI</span>
          <h2>Skala bisnis kamu makin besar bersama Warma Mall.</h2><p>Lebih dari 1.200 brand sudah memakai etalase resmi Warma untuk menjangkau pembeli 24 jam sehari.</p>
          <ul><li>▣ Etalase toko resmi + badge terverifikasi</li><li>▣ Dasbor penjualan & insight pembeli</li><li>▣ Pencairan dana H+1, tanpa biaya tersembunyi</li></ul>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10 }}><button className="btn-g" style={{ color: '#0b1b2b' }}>Ajukan Toko Resmi</button>4,8 jt unduhan · Top brand 2026</div></div>
      </section>

      <div className="trust">{[[ShieldCheck, 'Pembayaran Rekening Bersama', 'Dana ditahan Warma sampai paket kamu diterima dengan baik.'], [Check, '100% Produk Original', 'Toko resmi terverifikasi dengan garansi uang kembali.'], [RotateCcw, 'Retur Mudah 7 Hari', 'Ajukan pengembalian langsung dari halaman pesanan.'], [Headphones, 'Bantuan 24/7', 'Tim Warma siap di live chat kapan pun kamu butuh.']].map(([I, t, d]) => <div key={t}><b><I size={11} /> {t}</b>{d}</div>)}</div>
    </div>
  );
}
