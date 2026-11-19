'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap, Info } from 'lucide-react';

const SLIDES = [
  { chip: 'PESTA BELANJA 11.11 · 3 HARI LAGI', a: 'Diskon hingga ', b: '80% + Gratis Ongkir',
    p: 'Ratusan toko resmi dan penjual komunitas ikut pesta belanja terbesar Warma. Klaim vouchernya sekarang sebelum kuotanya habis.',
    b1: ['Belanja Sekarang →', '/cari?diskon=1'], b2: ['Jual Barangmu', '/penjual'], note: 'Berlaku sampai 11 November 2026 · seluruh Indonesia', img: '/images/hero-main.jpg' },
  { chip: 'VOUCHER GRATIS ONGKIR RP0', a: 'Ongkir Rp0 ', b: 'tanpa minimum belanja',
    p: 'Klaim 3 voucher gratis ongkir setiap hari dan pakai untuk kiriman instan Jakarta maupun reguler ke seluruh nusantara.',
    b1: ['Klaim Voucher →', '#voucher'], b2: ['Cara Pakainya', '#voucher'], note: 'Kuota 25.000 voucher per hari · buruan klaim', img: '/images/hero-ongkir.jpg' },
  { chip: 'OFFICIAL STORE BRAND DAY', a: 'Produk original, ', b: 'garansi resmi 1 tahun',
    p: 'Brand favorit pilihan Warma Mall hadir dengan harga khusus hari ini. Semua produk 100% original dan digaransi resmi.',
    b1: ['Masuk Warma Mall →', '/cari?tipe=resmi'], b2: ['Lihat Brand', '/cari?tipe=resmi&diskon=1'], note: 'Lebih dari 1.200 brand resmi terverifikasi', img: '/images/hero-brandday.jpg' },
];
const n = SLIDES.length;

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const x0 = useRef(null);
  const go = (k) => setI(((k % n) + n) % n);

  // Geser otomatis tiap 5,5 detik; berhenti saat kursor di atas banner
  useEffect(() => {
    if (hold) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), 5500);
    return () => clearTimeout(t);
  }, [hold, i]);

  return (
    <div className="hs" role="region" aria-roledescription="carousel" aria-label="Promo Warma" tabIndex={0}
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); }}
      onPointerDown={(e) => { x0.current = e.clientX; }}
      onPointerUp={(e) => { if (x0.current == null) return; const d = e.clientX - x0.current; x0.current = null; if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1)); }}
      onPointerCancel={() => { x0.current = null; }}>
      <div className="hs-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SLIDES.map((s, k) => (
          <div key={k} className="hm hs-slide" aria-hidden={k !== i} aria-label={`${k + 1} dari ${n}`}
            style={{ backgroundImage: `linear-gradient(90deg, #14181b 38%, #14181b8c 62%, transparent), url(${s.img})` }}>
            <span className="chip"><Zap size={9} style={{ verticalAlign: -1 }} /> {s.chip}</span>
            <h1>{s.a}<span>{s.b}</span></h1>
            <p>{s.p}</p>
            <div className="btns">
              <Link className="b1" href={s.b1[1]} tabIndex={k === i ? 0 : -1}>{s.b1[0]}</Link>
              <Link className="b2" href={s.b2[1]} tabIndex={k === i ? 0 : -1}>{s.b2[0]}</Link>
            </div>
            <small style={{ fontSize: 10, opacity: .8 }}><Info size={10} style={{ verticalAlign: -1 }} /> {s.note}</small>
          </div>))}
      </div>
      <div className="hs-dots">{SLIDES.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => go(k)} aria-label={`Slide ${k + 1}`} />)}</div>
      <div className="hs-arrows">
        <button onClick={() => go(i - 1)} aria-label="Sebelumnya"><ChevronLeft size={14} /></button>
        <button onClick={() => go(i + 1)} aria-label="Berikutnya"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}
