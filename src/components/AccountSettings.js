'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

async function send(method, body) {
  const r = await fetch('/api/akun', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Gagal memproses permintaan.');
}
const Msg = ({ m }) => (m ? <div className={m.ok ? 'okmsg' : 'aerr'}>{m.text}</div> : null);
const first = (n) => String(n).trim().split(/\s+/)[0] || '';

export default function AccountSettings({ nama, email, peran, toko }) {
  const router = useRouter();
  const [n, setN] = useState(nama);
  const [nm, setNm] = useState(null);
  const [nb, setNb] = useState(false);
  const [pw, setPw] = useState({ lama: '', baru: '', ulang: '' });
  const [show, setShow] = useState(false);
  const [pm, setPm] = useState(null);
  const [pb, setPb] = useState(false);
  const rename = peran === 'penjual' && first(n) !== first(nama);

  async function saveName(e) {
    e.preventDefault(); setNm(null); setNb(true);
    try { await send('PATCH', { nama: n }); setNm({ ok: true, text: 'Nama berhasil disimpan.' }); router.refresh(); }
    catch (x) { setNm({ ok: false, text: x.message }); }
    setNb(false);
  }
  async function savePw(e) {
    e.preventDefault(); setPm(null);
    if (pw.baru !== pw.ulang) return setPm({ ok: false, text: 'Konfirmasi kata sandi baru tidak sama.' });
    setPb(true);
    try { await send('PUT', { lama: pw.lama, baru: pw.baru }); setPw({ lama: '', baru: '', ulang: '' }); setPm({ ok: true, text: 'Kata sandi berhasil diubah.' }); }
    catch (x) { setPm({ ok: false, text: x.message }); }
    setPb(false);
  }
  const setP = (k) => (e) => setPw({ ...pw, [k]: e.target.value });
  const type = show ? 'text' : 'password';

  return (
    <>
      <form className="panel" onSubmit={saveName}>
        <h3 style={{ fontSize: 15, marginBottom: 6 }}>Profil</h3>
        <label className="fl">Nama lengkap</label>
        <input className="fi2" value={n} onChange={(e) => setN(e.target.value)} maxLength={100} required />
        <label className="fl">Email</label>
        <input className="fi2" value={email} disabled />
        <p className="meta" style={{ marginTop: 6 }}>Jenis akun: <b>{peran === 'penjual' ? 'Penjual' : 'Pembeli'}</b>{toko && <> · Nama toko: <b>{toko}</b></>}</p>
        {rename && <p className="meta" style={{ marginTop: 6, color: '#8a5a00' }}>Nama toko mengikuti nama depan. Jika nama depan diganti, nama toko di produk dan riwayat pesananmu ikut menjadi “Toko {first(n)}”.</p>}
        <Msg m={nm} />
        <button className="btn-g" disabled={nb || n.trim() === nama} style={{ marginTop: 14, padding: '10px 22px' }}>{nb ? 'Menyimpan…' : 'Simpan nama'}</button>
      </form>

      <form className="panel" onSubmit={savePw}>
        <h3 style={{ fontSize: 15, marginBottom: 6 }}>Ubah kata sandi</h3>
        <label className="fl">Kata sandi lama</label>
        <div className="inp" style={{ background: '#f7f8f3' }}><input type={type} value={pw.lama} onChange={setP('lama')} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label="Tampilkan kata sandi">{show ? <EyeOff size={13} /> : <Eye size={13} />}</button></div>
        <label className="fl">Kata sandi baru</label>
        <div className="inp" style={{ background: '#f7f8f3' }}><input type={type} value={pw.baru} onChange={setP('baru')} autoComplete="new-password" placeholder="Minimal 8 karakter" required /></div>
        <p className="meta" style={{ marginTop: 4 }}>Gunakan kombinasi huruf dan angka.</p>
        <label className="fl">Ulangi kata sandi baru</label>
        <div className="inp" style={{ background: '#f7f8f3' }}><input type={type} value={pw.ulang} onChange={setP('ulang')} autoComplete="new-password" required /></div>
        <Msg m={pm} />
        <button className="btn-g" disabled={pb} style={{ marginTop: 14, padding: '10px 22px' }}>{pb ? 'Menyimpan…' : 'Ubah kata sandi'}</button>
      </form>
    </>
  );
}
