import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import AccountMenu from '@/components/AccountMenu';
import BellMenu from '@/components/BellMenu';
import { chatUnread } from '@/lib/chat';
import {
  Search, ChevronDown, Camera, Heart, Bell, MessageCircle, ShoppingBag, Store, User, Clock,
  Smartphone, ShieldCheck, Headphones, Zap, Instagram, Youtube, Phone, Play, Apple,
} from 'lucide-react';

const NAV = ['Makanan & Minuman', 'Camilan', 'Rumah Tangga', 'Elektronik & Gadget', 'Preloved'];

export async function Header({ seller = false } = {}) {
  const user = await getUser();
  let orders = 0, cart = 0, wish = 0, unread = 0, chat = 0;
  if (user) { try { orders = Number((await query('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?', [user.id]))[0].n); } catch {}
    try { cart = Number((await query('SELECT COALESCE(SUM(qty), 0) AS n FROM cart_items WHERE user_id = ?', [user.id]))[0].n); } catch {}
    try { wish = Number((await query('SELECT COUNT(*) AS n FROM wishlist WHERE user_id = ?', [user.id]))[0].n); } catch {}
    try { unread = Number((await query('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND dibaca = 0', [user.id]))[0].n); } catch {}
    chat = await chatUnread(user.id); }
  return (
    <header>
      <div className="top">
        <span><Clock size={11} className="g" /> Buka 24/7 · pengiriman instan tersedia di 42 kota</span>
        <nav>
          <span><Smartphone size={10} /> Unduh Aplikasi</span>
          <Link href="/penjual" className="y"><Store size={10} /> Mulai Jualan / Buka Toko</Link>
          <span><ShieldCheck size={10} /> Perlindungan Pembeli</span>
          <span><Headphones size={10} /> Bantuan 24/7</span>
        </nav>
      </div>
      <div className="bar" />
      <div className="hd">
        <Link href="/" className="logo"><img src="/images/logo.png" alt="Warma Buka 24/7" /></Link>
        {seller && <span className="chip2">MODE PENJUAL</span>}
        <form className="search" action="/cari" method="get">
          <span className="sel">Semua kategori <ChevronDown size={12} /></span>
          <input name="q" placeholder="Cari produk, toko, atau kategori" />
          <Camera size={14} className="cam" />
          <button className="btn-g"><Search size={13} /> Cari</button>
        </form>
        <div className="acts">
          {[[Heart, 6], [Bell, 4], [MessageCircle, 2], [ShoppingBag, 6]].map(([I, n], i) => i === 3 ? (<Link key={i} href="/keranjang" className="ic"><I size={15} />{cart > 0 && <em className="gr">{cart}</em>}</Link>) : i === 2 ? (<Link key={i} href={user ? '/chat' : '/masuk?next=/chat'} className="ic" aria-label="Chat"><I size={15} />{chat > 0 && <em>{chat}</em>}</Link>) : i === 1 ? (<BellMenu key={i} unread={unread} loggedIn={!!user} />) : i === 0 ? (<Link key={i} href="/wishlist" className="ic" aria-label="Wishlist"><I size={15} />{wish > 0 && <em>{wish}</em>}</Link>) : (
            <button key={i} className="ic"><I size={15} /><em className={i === 3 ? 'gr' : ''}>{n}</em></button>
          ))}
          <Link href="/penjual" className="pill blue"><Store size={13} /> Mulai Jualan</Link>
          {user ? (
            <AccountMenu nama={user.nama} email={user.email} peran={user.peran} orders={orders} wish={wish} seller={seller} foto={user.foto || ''} chat={chat} />
          ) : (
            <Link href="/masuk" className="pill"><User size={13} /> Masuk / Daftar</Link>
          )}
        </div>
      </div>
      <div className="nav">
        <Link href="/" className="all">Semua kategori</Link>
        {NAV.map((n) => <Link key={n} href={`/cari?q=${encodeURIComponent(n)}`}>{n}</Link>)}
        <span className="open"><Clock size={11} /> Buka 24/7 · pesan kapan saja</span>
      </div>
    </header>
  );
}

const COLS = [
  ['Tentang Warma', ['Profil perusahaan', 'Karier di Warma', 'Blog & inspirasi', 'Warma Peduli', 'Hubungan investor']],
  ['Belanja', ['Warma Mall', 'Preloved komunitas', 'Flash sale hari ini', 'Voucher & cashback', 'Lacak pesanan']],
  ['Jualan', ['Buka toko gratis', 'Panduan penjual pemula', 'Biaya & pencairan dana', 'Warma Ads', 'Akademi penjual']],
  ['Bantuan', ['Pusat bantuan 24/7', 'Perlindungan pembeli', 'Pengembalian & refund', 'Metode pembayaran', 'Hubungi kami']],
];

export function Footer() {
  return (
    <footer>
      <div className="bar" />
      <div className="wrap ft">
        <div>
          <img src="/images/logo.png" alt="Warma" height="52" />
          <p>Warma adalah marketplace serba ada yang buka 24/7 — tempat brand resmi dan penjual perorangan bertemu pembeli di seluruh Indonesia.</p>
          <div className="stores"><span><Play size={11} /> Google Play</span><span><Apple size={11} /> App Store</span></div>
          <div className="soc"><Instagram size={13} /><Zap size={13} /><Youtube size={13} /><Phone size={13} /></div>
        </div>
        {COLS.map(([t, ls]) => (
          <div key={t}><h5>{t}</h5>{ls.map((l) => <a key={l} href="#">{l}</a>)}</div>
        ))}
      </div>
      <div className="wrap">
        <div className="pay">
          <div><h6>PEMBAYARAN</h6>{['BCA', 'Mandiri', 'BNI', 'BRI', 'QRIS', 'GoPay', 'OVO', 'Warma Pay', 'COD'].map((x) => <i key={x}>{x}</i>)}</div>
          <div><h6>PENGIRIMAN</h6>{['JNE', 'SiCepat', 'AnterAja', 'GoSend', 'GrabExpress', 'Instant 30 menit'].map((x) => <i key={x}>{x}</i>)}</div>
        </div>
        <div className="copy">
          <span>© 2026 PT Warma Nusantara. Seluruh hak cipta dilindungi. Halaman demo — transaksi tidak diproses sungguhan.</span>
          <span>Halaman Mulai · Masuk / Daftar · Syarat & Ketentuan · Kebijakan Privasi · Indonesia · IDR</span>
        </div>
      </div>
    </footer>
  );
}
