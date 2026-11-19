import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Bell, Star, MessageCircle, ClipboardList, Ticket, Heart, Settings, Store, User, Wallet } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { storeName } from '@/lib/seller';
import { getAddresses } from '@/lib/addresses';
import { getUserVouchers } from '@/lib/vouchers';
import AddressManager from '@/components/AddressManager';
import { BiodataTab, PaymentTab, BankTab, NotifTab, DisplayTab, SecurityTab } from '@/components/SettingsTabs';

export const metadata = { title: 'Pengaturan — Warma' };

const TABS = [['biodata', 'Biodata Diri'], ['alamat', 'Daftar Alamat'], ['pembayaran', 'Pembayaran'], ['rekening', 'Rekening Bank'], ['notifikasi', 'Notifikasi'], ['tampilan', 'Mode Tampilan'], ['keamanan', 'Keamanan']];

const safe = async (sql, p) => { try { return await query(sql, p); } catch { return []; } };
const ymd = (d) => { d = new Date(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function deviceOf(ua) {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const o = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'perangkat ini';
  return `${b} di ${o}`;
}

export default async function Page({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/pengaturan');
  const sp = (await searchParams) || {};
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab : 'biodata';
  const seller = user.peran === 'penjual';

  const wallets = (await safe('SELECT jenis, nomor FROM ewallet WHERE user_id = ?', [user.id])).map((w) => ({ jenis: w.jenis, masked: '•••• ' + String(w.nomor).slice(-4) }));
  const voucherN = (await getUserVouchers(user.id)).length;

  let body = null;
  if (tab === 'biodata') {
    const ex = (await safe('SELECT tgl_lahir, jenis_kelamin FROM users WHERE id = ?', [user.id]))[0] || {};
    body = <BiodataTab u={{ nama: user.nama, email: user.email, telepon: user.telepon, foto: user.foto, tgl: ex.tgl_lahir ? ymd(ex.tgl_lahir) : '', jk: ex.jenis_kelamin || '', toko: seller ? storeName(user) : '' }} />;
  } else if (tab === 'alamat') {
    body = <AddressManager addresses={await getAddresses(user.id)} next="" defaultName={user.nama} />;
  } else if (tab === 'pembayaran') {
    body = <PaymentTab wallets={wallets} />;
  } else if (tab === 'rekening') {
    const rows = (await safe('SELECT id, bank, no_rek, atas_nama, utama FROM rekening_bank WHERE user_id = ? ORDER BY utama DESC, id DESC', [user.id]))
      .map((r) => ({ id: r.id, bank: r.bank, masked: '•••• ' + String(r.no_rek).slice(-4), atas_nama: r.atas_nama, utama: !!r.utama }));
    body = <BankTab rows={rows} defaultName={user.nama} />;
  } else if (tab === 'notifikasi') {
    const prefs = Object.fromEntries((await safe('SELECT kode, aktif FROM notif_prefs WHERE user_id = ?', [user.id])).map((r) => [r.kode, !!r.aktif]));
    body = <NotifTab prefs={prefs} isSeller={seller} />;
  } else if (tab === 'tampilan') {
    body = <DisplayTab tema={user.tema} filter={user.filter_warna} aksen={user.aksen} />;
  } else {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'Alamat IP tidak terdeteksi';
    body = <SecurityTab nama={user.nama} device={deviceOf(h.get('user-agent') || '')} ip={ip} />;
  }

  const wal = (k, l) => { const on = wallets.some((w) => w.jenis === k); return <Link href="/pengaturan?tab=pembayaran" className="swr"><span><Wallet size={14} /> {l}</span><b className={on ? 'on' : ''}>{on ? 'Terhubung' : 'Aktifkan'}</b></Link>; };

  return (
    <div className="wrap setl">
      <aside className="sset">
        <div className="spro">
          <span className="av" style={user.foto ? { backgroundImage: `url(${user.foto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{user.foto ? '' : user.nama[0]?.toUpperCase()}</span>
          <div><b>{user.nama}</b>{user.telepon ? <small>{user.telepon}</small> : <Link href="/pengaturan?tab=biodata" className="sbadge">+ Tambah Nomor HP</Link>}</div>
        </div>
        <Link href="/#voucher" className="spromo"><b>Nikmati gratis ongkir</b><small>Klaim voucher gratis ongkir di beranda. Min. belanja Rp0.</small></Link>
        <div className="swal">{wal('gopay', 'GoPay')}{wal('dana', 'DANA')}<Link href="/voucher" className="swr"><span><Ticket size={14} /> Voucher</span><b className={voucherN ? 'on' : ''}>{voucherN} tersedia</b></Link></div>
        <div className="sgrp"><h4>Kotak Masuk</h4><Link href="/chat"><MessageCircle size={13} /> Chat</Link><Link href="/ulasan"><Star size={13} /> Ulasan</Link><Link href="/notifikasi"><Bell size={13} /> Notifikasi</Link></div>
        <div className="sgrp"><h4>Pembelian</h4><Link href="/pesanan"><ClipboardList size={13} /> Pesanan Saya</Link><Link href="/voucher"><Ticket size={13} /> Voucher Saya</Link></div>
        <div className="sgrp"><h4>Profil Saya</h4><Link href="/wishlist"><Heart size={13} /> Wishlist</Link><Link href="/toko-favorit"><Store size={13} /> Toko Favorit</Link><Link href="/pengaturan" className="on"><Settings size={13} /> Pengaturan</Link></div>
        {seller && <div className="sgrp"><h4>Penjualan</h4><Link href="/penjual"><Store size={13} /> Dasbor Penjual</Link></div>}
      </aside>

      <div>
        <h2 className="sph"><User size={14} /> {user.nama}</h2>
        <div className="sbox">
          <nav className="stb">{TABS.map(([k, l]) => <Link key={k} href={`/pengaturan?tab=${k}`} className={tab === k ? 'on' : ''}>{l}</Link>)}</nav>
          <div className="sbody">{body}</div>
        </div>
      </div>
    </div>
  );
}
