import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import AuthView from '@/components/AuthView';

export const metadata = { title: 'Masuk / Daftar — Warma' };

export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const next = typeof sp.next === 'string' && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/';
  return (
    <div className="auth">
      <div className="bar" />
      <div className="atop wrap">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Link href="/"><img src="/images/logo.png" alt="Warma" height="46" /></Link><span className="tag p">🔒 AKUN AMAN</span></div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><span className="meta"><ShieldCheck size={11} /> Data terenkripsi</span><Link href="/" className="out"><ArrowLeft size={11} /> Kembali ke Halaman Utama</Link></div>
      </div>
      <AuthView next={next} tab={sp.tab === 'daftar' ? 'daftar' : 'masuk'} />
      <div className="wrap copy"><span>© 2026 PT Warma Nusantara. Halaman demo — akun tidak diproses sungguhan.</span><span>Halaman Mulai · Dasbor Belanja · Dasbor Toko</span></div>
    </div>
  );
}
