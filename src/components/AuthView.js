'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, LogIn, UserPlus, ListChecks, MessageCircle, Store, Info } from 'lucide-react';

const FEAT = [
  [ListChecks, 'Pantau semua pesanan', 'Status pengiriman, riwayat belanja, dan pengembalian dana terlihat rapi di satu tempat.'],
  [MessageCircle, 'Chat penjual langsung', 'Tanya stok, tawar harga, atau minta foto tambahan sebelum kamu memutuskan membeli.'],
  [Store, 'Kelola toko pribadi', 'Unggah barang bekas atau bangun Official Store, lalu cairkan penghasilan H+1.'],
];

export default function AuthView({ next = '/', tab: t0 = 'masuk' }) {
  const router = useRouter();
  const [tab, setTab] = useState(t0);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ nama: '', email: '', password: '', peran: 'pembeli', agree: true });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (tab === 'daftar' && !f.agree) return setErr('Setujui Syarat & Ketentuan untuk melanjutkan.');
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${tab === 'masuk' ? 'login' : 'register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const d = await res.json();
      if (!res.ok) setErr(d.error || 'Terjadi kesalahan.');
      else { router.push(next); router.refresh(); }
    } catch { setErr('Tidak bisa menghubungi server.'); }
    setBusy(false);
  }

  const pw = (
    <div className="inp"><Lock size={13} /><input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} placeholder={tab === 'daftar' ? 'Minimal 8 karakter' : 'Kata sandi'} autoComplete={tab === 'daftar' ? 'new-password' : 'current-password'} required />
      <button type="button" onClick={() => setShow(!show)} aria-label="Tampilkan kata sandi">{show ? <EyeOff size={13} /> : <Eye size={13} />}</button></div>
  );

  return (
    <div className="wrap ag">
      <section className="al">
        <div className="alogo"><img src="/images/logo.png" alt="Warma" height="54" /></div>
        <h1>Satu Akun untuk <span>Belanja</span> & <span>Berjualan</span> Tanpa Batas</h1>
        <p>Masuk ke Warma untuk memantau setiap pesanan, mengobrol langsung dengan penjual, dan mengelola toko pribadimu — semuanya dari satu dasbor yang buka 24 jam sehari.</p>
        {FEAT.map(([I, t, d]) => <div className="af" key={t}><span><I size={14} /></span><div><b>{t}</b><small>{d}</small></div></div>)}
        <div className="as">{[['12,4 jt', 'pembeli aktif'], ['1.200+', 'toko resmi'], ['4,9/5', 'rating pembeli']].map(([a, b]) => <div key={b}><small>{b}</small><b>{a}</b></div>)}</div>
      </section>

      <section className="ar">
        <div className="atabs"><button className={tab === 'masuk' ? 'on' : ''} onClick={() => { setTab('masuk'); setErr(''); }}><LogIn size={12} /> Masuk</button><button className={tab === 'daftar' ? 'on' : ''} onClick={() => { setTab('daftar'); setErr(''); }}><UserPlus size={12} /> Daftar Akun Baru</button></div>
        <h2>{tab === 'masuk' ? 'Selamat datang kembali' : 'Buat akun Warma gratis'}</h2>
        <p className="meta">{tab === 'masuk' ? 'Masuk untuk melanjutkan belanja, memantau pesanan, dan mengelola tokomu dalam satu akun.' : 'Cukup 30 detik. Satu akun bisa dipakai untuk belanja sekaligus berjualan sebagai perorangan maupun Official Store.'}</p>
        <div className="info"><Info size={12} /> {tab === 'masuk' ? 'Belum punya akun? Buka tab “Daftar Akun Baru” — akunmu tersimpan di database MySQL.' : 'Akunmu akan tersimpan di database MySQL (tabel users) dengan kata sandi terenkripsi.'}</div>
        <form onSubmit={submit}>
          {tab === 'daftar' && (<><label>NAMA LENGKAP</label><div className="inp"><User size={13} /><input value={f.nama} onChange={set('nama')} placeholder="Contoh: Nadia Ayu Pratiwi" required /></div></>)}
          <label>EMAIL</label><div className="inp"><Mail size={13} /><input type="email" value={f.email} onChange={set('email')} placeholder="nama@email.com" autoComplete="email" required /></div>
          <label>KATA SANDI</label>{pw}
          {tab === 'daftar' && (<>
            <small className="meta">Gunakan kombinasi huruf dan angka agar akunmu lebih aman.</small>
            <label>SAYA INGIN:</label>
            <div className="g3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[['pembeli', 'Belanja Saja', 'Cari, tawar, dan beli produk dulu.'], ['penjual', 'Belanja & Sekaligus Jualan', 'Sekalian buka toko kapan pun kamu siap.']].map(([v, t, d]) => (
                <button type="button" key={v} className={'opt' + (f.peran === v ? ' on' : '')} onClick={() => setF({ ...f, peran: v })}><b>{t}</b><small>{d}</small></button>))}
            </div>
            <label className="meta agree"><input type="checkbox" checked={f.agree} onChange={set('agree')} /> Saya menyetujui <b>Syarat & Ketentuan</b> serta <b>Kebijakan Privasi</b> Warma.</label></>)}
          {tab === 'masuk' && <div className="rem"><label><input type="checkbox" defaultChecked /> Ingat Saya</label><a href="#">Lupa Kata Sandi?</a></div>}
          {err && <div className="aerr">{err}</div>}
          <button className="asub" disabled={busy}>{tab === 'masuk' ? <><LogIn size={13} /> {busy ? 'Memproses…' : 'Masuk ke Warma'}</> : <><UserPlus size={13} /> {busy ? 'Memproses…' : 'Buat Akun Warma'}</>}</button>
        </form>
        {tab === 'masuk' && (<><div className="or"><span>Atau masuk lebih cepat dengan</span></div><div className="g3" style={{ gridTemplateColumns: '1fr 1fr' }}><button className="out soc2">G Google</button><button className="out soc2"> Apple</button></div></>)}
        <p className="meta" style={{ textAlign: 'center', marginTop: 12, fontSize: 9 }}>Dengan melanjutkan, kamu menyetujui <b>Syarat & Ketentuan</b> dan <b>Kebijakan Privasi</b> Warma.</p>
      </section>
    </div>
  );
}
