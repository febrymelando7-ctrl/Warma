'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, User, Store, ClipboardList, Heart, MessageCircle, MapPin, Settings, LogOut, Ticket, Star } from 'lucide-react';

export default function AccountMenu({ nama, email, peran, orders = 0, wish = 0, seller = false, foto = '', chat = 0 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);
  const ini = nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const items = [
    [ClipboardList, 'Pesanan saya', orders || null],
    [Heart, 'Wishlist', wish || null],
    [Store, 'Toko favorit', null],
    [Ticket, 'Voucher saya', null],
    [Star, 'Ulasan saya', null],
    [MessageCircle, 'Chat dengan penjual', chat || null],
    [MapPin, 'Alamat tersimpan', null],
    [Settings, 'Pengaturan akun', null],
  ];
  return (
    <div className="amw" ref={ref}>
      <button className={'me' + (open ? ' open' : '')} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="av" style={foto ? { backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{foto ? '' : ini}</span>
        <div><b>{nama}</b><small>{peran === 'penjual' ? 'Akun penjual' : 'Akun pribadi'}</small></div>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.15s' }} />
      </button>
      {open && (
        <div className="amenu">
          <div className="amh"><span className="av" style={foto ? { backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{foto ? '' : ini}</span><div><b>{nama}</b><small>{email}</small></div></div>
          <div className="amlab">GANTI TAMPILAN</div>
          <div className="seg">
            <Link href="/" className={seller ? '' : 'on'}><User size={12} /> Profil Pengguna</Link>
            <Link href="/penjual" className={seller ? 'on' : ''}><Store size={12} /> Toko</Link>
          </div>
          {items.map(([I, t, n]) => <Link key={t} href={t === 'Pesanan saya' ? '/pesanan' : t === 'Alamat tersimpan' ? '/pengaturan?tab=alamat' : t === 'Wishlist' ? '/wishlist' : t === 'Chat dengan penjual' ? '/chat' : t === 'Toko favorit' ? '/toko-favorit' : t === 'Ulasan saya' ? '/ulasan' : t === 'Voucher saya' ? '/voucher' : t === 'Pengaturan akun' ? '/pengaturan' : '#'} className="ami" onClick={() => setOpen(false)}><I size={14} />{t}{n != null && <em>{n}</em>}</Link>)}
          <Link href="/penjual" className="amcta"><Store size={13} /> {peran === 'penjual' ? 'Buka dasbor toko' : 'Mulai jualan di Warma'}</Link>
          <form action="/api/auth/logout" method="post"><button className="amout"><LogOut size={11} style={{ verticalAlign: -1 }} /> Keluar</button></form>
        </div>
      )}
    </div>
  );
}
