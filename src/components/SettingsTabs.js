'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Wallet, Landmark, Plus, Trash2, Camera, Laptop, Smartphone, X, Info, ShieldCheck } from 'lucide-react';

async function api(url, method, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Gagal memproses permintaan.');
  return d;
}
const Msg = ({ m }) => (m ? <div className={m.ok ? 'okmsg' : 'aerr'}>{m.text}</div> : null);
const tgl = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/* ---------------------------------------------------------------- Biodata Diri */
export function BiodataTab({ u }) {
  const router = useRouter();
  const [edit, setEdit] = useState(null);
  const [val, setVal] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = [
    ['h', 'Ubah Biodata Diri'],
    ['nama', 'Nama', 'text', u.nama, u.nama],
    ['tgl_lahir', 'Tanggal Lahir', 'date', tgl(u.tgl), u.tgl],
    ['jenis_kelamin', 'Jenis Kelamin', 'select', u.jk, u.jk],
    ['h', 'Ubah Kontak'],
    ['email', 'Email', 'email', u.email, u.email],
    ['telepon', 'Nomor HP', 'tel', u.telepon, u.telepon],
  ];
  const start = (k, raw) => { setEdit(k); setVal(raw || ''); setPw(''); setMsg(null); };

  async function save() {
    setBusy(true); setMsg(null);
    try {
      if (edit === 'nama') await api('/api/akun', 'PATCH', { nama: val });
      else if (edit === 'email') await api('/api/akun/profil', 'PATCH', { email: val, password: pw });
      else await api('/api/akun/profil', 'PATCH', { [edit]: val });
      setEdit(null); router.refresh();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  }
  async function pickFoto(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setMsg({ ok: false, text: 'Format foto harus JPG, PNG, atau WebP.' });
    if (f.size > 5 * 1024 * 1024) return setMsg({ ok: false, text: 'Ukuran foto maksimal 5 MB.' });
    setBusy(true); setMsg(null);
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/akun/foto', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    if (r.ok) router.refresh(); else setMsg({ ok: false, text: d.error || 'Gagal mengunggah foto.' });
    setBusy(false);
  }
  async function delFoto() { setBusy(true); await api('/api/akun/foto', 'DELETE').catch(() => {}); router.refresh(); setBusy(false); }

  return (
    <div className="bio">
      <div>
        <div className="avcard">
          <div className="avbig" style={u.foto ? { backgroundImage: `url(${u.foto})` } : undefined}>{u.foto ? '' : u.nama[0]?.toUpperCase()}</div>
          <label className="out avbtn"><Camera size={13} /> Pilih Foto<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickFoto} disabled={busy} /></label>
          <p className="meta">Besar file: maksimum 5 MB. Ekstensi yang diperbolehkan: JPG, PNG, WebP.</p>
          {u.foto && <button className="lnk2" onClick={delFoto} disabled={busy}>Hapus foto</button>}
        </div>
        <Link href="/pengaturan?tab=keamanan" className="out avbtn" style={{ marginTop: 12 }}>Ubah Kata Sandi</Link>
      </div>
      <div>
        {rows.map((r, i) => r[0] === 'h' ? <h4 key={i} className="bh4">{r[1]}</h4> : (
          <div className="brow" key={r[0]}>
            <span className="bl">{r[1]}</span>
            {edit === r[0] ? (
              <div className="bed">
                {r[2] === 'select'
                  ? <select className="fi2" value={val} onChange={(e) => setVal(e.target.value)}><option value="">—</option><option>Pria</option><option>Wanita</option></select>
                  : <input className="fi2" type={r[2]} value={val} onChange={(e) => setVal(e.target.value)} max={r[2] === 'date' ? new Date().toISOString().slice(0, 10) : undefined} maxLength={r[0] === 'nama' ? 100 : 60} autoFocus />}
                {r[0] === 'email' && <input className="fi2" type="password" placeholder="Kata sandi untuk konfirmasi" value={pw} onChange={(e) => setPw(e.target.value)} />}
                <div style={{ display: 'flex', gap: 8 }}><button className="btn-g" onClick={save} disabled={busy}>Simpan</button><button className="out" onClick={() => setEdit(null)} disabled={busy}>Batal</button></div>
              </div>
            ) : (<>
              <span className="bv">{r[3] || ''}</span>
              <button className="lnk2" onClick={() => start(r[0], r[4])}>{r[3] ? 'Ubah' : `Tambah ${r[1]}`}</button>
            </>)}
          </div>))}
        <Msg m={msg} />
        {u.toko && <p className="meta" style={{ marginTop: 14 }}>Nama toko: <b>{u.toko}</b> — mengikuti nama depan. Jika nama depan diganti, nama toko di produk dan riwayat pesananmu ikut berubah.</p>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Pembayaran */
const WALLETS = { gopay: 'GoPay', dana: 'DANA' };
export function PaymentTab({ wallets }) {
  const router = useRouter();
  const [sel, setSel] = useState('gopay');
  const [open, setOpen] = useState(false);
  const [nomor, setNomor] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const cur = wallets.find((w) => w.jenis === sel);
  async function run(fn) { setBusy(true); setMsg(null); try { await fn(); setOpen(false); setNomor(''); router.refresh(); } catch (e) { setMsg({ ok: false, text: e.message }); } setBusy(false); }
  return (
    <div className="pmgrid">
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>Pengaturan Pembayaran</h3>
        <p className="meta" style={{ margin: '8px 0 14px' }}>Hubungkan dompet digital agar pembayaran lebih cepat dan aman.</p>
        {Object.entries(WALLETS).map(([k, l]) => (
          <button key={k} className={'pml' + (sel === k ? ' on' : '')} onClick={() => { setSel(k); setOpen(false); setMsg(null); }}>{l}{wallets.some((w) => w.jenis === k) && <span className="tag p">Terhubung</span>}</button>))}
      </div>
      <div className="pmr">
        <div className="pmh">{WALLETS[sel]}</div>
        <div className="pmb">
          <span className="pmic"><Wallet size={34} /></span>
          {cur ? (<>
            <h3>{WALLETS[sel]} terhubung</h3>
            <p className="meta">Nomor terdaftar: <b>{cur.masked}</b></p>
            <button className="out" style={{ marginTop: 14 }} disabled={busy} onClick={() => run(() => api('/api/akun/ewallet', 'DELETE', { jenis: sel }))}>Putuskan</button>
          </>) : (<>
            <h3>Yuk, aktifkan {WALLETS[sel]}!</h3>
            <p className="meta">{WALLETS[sel]} kamu belum tersambung. Masukkan nomor HP yang terdaftar di {WALLETS[sel]}.</p>
            {open ? (
              <div style={{ width: '100%', maxWidth: 320, marginTop: 14 }}>
                <input className="fi2" inputMode="tel" placeholder="0812-3456-7890" value={nomor} onChange={(e) => setNomor(e.target.value)} autoFocus />
                <button className="btn-g" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 11 }} disabled={busy} onClick={() => run(() => api('/api/akun/ewallet', 'POST', { jenis: sel, nomor }))}>Hubungkan</button>
              </div>
            ) : <button className="btn-g" style={{ width: '100%', maxWidth: 320, justifyContent: 'center', marginTop: 14, padding: 12 }} onClick={() => setOpen(true)}>Aktifkan</button>}
          </>)}
          <Msg m={msg} />
          <p className="meta" style={{ marginTop: 16, fontSize: 10 }}>Catatan: fitur ini masih simulasi, nomor hanya disimpan di akunmu dan belum terhubung ke layanan {WALLETS[sel]} yang sebenarnya.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Rekening Bank */
const BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon', 'Lainnya'];
export function BankTab({ rows, defaultName }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ bank: 'BCA', no_rek: '', atas_nama: defaultName, utama: false });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function run(fn, close) { setBusy(true); setMsg(null); try { await fn(); if (close) setOpen(false); router.refresh(); } catch (e) { setMsg({ ok: false, text: e.message }); } setBusy(false); }
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div><h3 style={{ fontSize: 16 }}>Rekening bank</h3><p className="meta">Dipakai untuk pencairan dana penjual dan pengembalian dana. Maksimal 5 rekening.</p></div>
        {rows.length < 5 && <button className="btn-g" onClick={() => { setOpen(true); setMsg(null); }}><Plus size={12} /> Tambah Rekening</button>}
      </div>
      <Msg m={msg} />
      {!rows.length && (
        <div className="panel" style={{ textAlign: 'center', padding: 44 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><Landmark size={16} /></span>
          <b>Belum ada rekening tersimpan</b>
          <p className="meta" style={{ margin: '6px 0 14px' }}>Tambahkan rekening bank agar lebih mudah saat menarik dana.</p>
          <button className="btn-g" onClick={() => setOpen(true)}>Tambah Rekening</button>
        </div>)}
      {rows.map((r) => (
        <div className="panel acard" key={r.id}>
          <span className="sico"><Landmark size={14} /></span>
          <div style={{ flex: 1 }}><b>{r.bank}</b> {r.utama && <span className="tag p">Utama</span>}<div className="meta" style={{ marginTop: 3 }}>{r.masked} · a.n. {r.atas_nama}</div></div>
          <div className="aact">
            {!r.utama && <button className="out" disabled={busy} onClick={() => run(() => api('/api/akun/rekening', 'PATCH', { id: r.id }))}>Jadikan utama</button>}
            <button className="danger" style={{ margin: 0 }} disabled={busy} onClick={() => confirm(`Hapus rekening ${r.bank}?`) && run(() => api('/api/akun/rekening', 'DELETE', { id: r.id }))}><Trash2 size={11} /> Hapus</button>
          </div>
        </div>))}
      {open && (
        <div className="ov" onClick={() => setOpen(false)}>
          <form className="md" style={{ width: 420, padding: 22 }} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); run(() => api('/api/akun/rekening', 'POST', f), true); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ fontSize: 16 }}>Tambah Rekening</h3><button type="button" onClick={() => setOpen(false)} aria-label="Tutup"><X size={16} /></button></div>
            <label className="fl">Bank</label><select className="fi2" value={f.bank} onChange={set('bank')}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
            <label className="fl">Nomor rekening</label><input className="fi2" inputMode="numeric" value={f.no_rek} onChange={set('no_rek')} maxLength={24} required />
            <label className="fl">Nama pemilik rekening</label><input className="fi2" value={f.atas_nama} onChange={set('atas_nama')} maxLength={100} required />
            <label className="meta" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}><input type="checkbox" checked={f.utama} onChange={set('utama')} /> Jadikan rekening utama</label>
            <Msg m={msg} />
            <button className="btn-g" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: 12 }}>{busy ? 'Menyimpan…' : 'Simpan rekening'}</button>
          </form>
        </div>)}
    </div>
  );
}

/* ------------------------------------------------------------------ Notifikasi */
const GROUPS = [
  ['Transaksi Pembelian', [['beli_dibuat', 'Pesanan berhasil dibuat'], ['beli_diproses', 'Pesanan diproses'], ['beli_dikirim', 'Pesanan dikirim'], ['beli_selesai', 'Pesanan selesai'], ['beli_batal', 'Pesanan dibatalkan']]],
  ['Penjualan', [['jual_pesanan', 'Pesanan baru masuk dan pembatalan oleh pembeli'], ['jual_ulasan', 'Ulasan baru pada produkmu']], true],
  ['Chat', [['chat_baru', 'Pesan baru dari pembeli atau penjual']]],
  ['Promo', [['promo_voucher', 'Voucher yang kamu klaim'], ['toko_produk_baru', 'Produk baru dari toko favorit']]],
];
export function NotifTab({ prefs, isSeller }) {
  const [p, setP] = useState(prefs);
  const [hide, setHide] = useState(false);
  const [err, setErr] = useState('');
  async function toggle(k) {
    const nx = !(p[k] !== false);
    setP({ ...p, [k]: nx }); setErr('');
    try { await api('/api/akun/notifikasi', 'PUT', { kode: k, aktif: nx }); } catch (e) { setP((x) => ({ ...x, [k]: !nx })); setErr(e.message); }
  }
  return (
    <div>
      {!hide && <div className="nbanner"><Info size={16} /><span>Notifikasi tentang keamanan akun, seperti perubahan kata sandi, selalu dikirim dan tidak bisa dimatikan.</span><button onClick={() => setHide(true)} aria-label="Tutup"><X size={14} /></button></div>}
      <h2 style={{ fontSize: 26, fontWeight: 800 }}>Notifikasi</h2>
      <p className="meta" style={{ marginBottom: 14 }}>Atur notifikasi yang ingin kamu terima di aplikasi.</p>
      {err && <div className="aerr">{err}</div>}
      {GROUPS.filter((g) => !g[2] || isSeller).map(([title, items]) => (
        <div key={title} style={{ marginBottom: 18 }}>
          <div className="nhead"><b>{title}</b><span>Aplikasi</span></div>
          {items.map(([k, l]) => (
            <label className="nrow" key={k}><span>{l}</span><input type="checkbox" checked={p[k] !== false} onChange={() => toggle(k)} /></label>))}
        </div>))}
    </div>
  );
}

/* --------------------------------------------------------------- Mode Tampilan */
const AKSEN = { hijau: '#5cb02f', tosca: '#2bbfae', biru: '#3b8fe8', ungu: '#9a6bef', merah: '#f26363', kuning: '#f5b400', abu: '#8a97a3' };
export function DisplayTab({ tema: t0, filter: f0, aksen: a0 }) {
  const [tema, setTema] = useState(t0);
  const [filter, setFilter] = useState(f0);
  const [aksen, setAksen] = useState(a0);
  const [err, setErr] = useState('');
  const mode = tema === 'sistem' ? 'sistem' : tema === 'gelap' ? 'gelap' : filter;

  async function save(patch) {
    const d = document.documentElement.dataset;
    if ('tema' in patch) d.tema = patch.tema;
    if ('filter_warna' in patch) d.filter = patch.filter_warna;
    if ('aksen' in patch) d.aksen = patch.aksen;
    setErr('');
    try { await api('/api/akun/tampilan', 'PATCH', patch); } catch (e) { setErr(e.message); }
  }
  function choose(m) {
    const patch = m === 'sistem' ? { tema: 'sistem', filter_warna: 'standar' } : m === 'gelap' ? { tema: 'gelap', filter_warna: 'standar' } : { tema: 'terang', filter_warna: m };
    setTema(patch.tema); setFilter(patch.filter_warna); save(patch);
  }
  const Opt = ({ m, title, desc, beta, nested }) => (
    <button className={'dopt' + (mode === m ? ' on' : '') + (nested ? ' nest' : '')} onClick={() => choose(m)}>
      <span><b>{title}</b>{beta && <em className="beta">BETA</em>}{desc && <small>{desc}</small>}</span><i className="rdo" />
    </button>
  );
  return (
    <div className="dgrid">
      <div>
        <p className="meta" style={{ marginBottom: 14 }}>Bebas atur tema dan warna yang kamu sukai dan nyaman dilihat.</p>
        <h3 className="dh">Tema</h3>
        <Opt m="sistem" title="Gunakan Pengaturan Device-mu" desc="Sesuaikan tampilan dengan mengikuti pengaturan di device kamu." />
        <div className="dh2">Light</div>
        <div className="dnest">
          <Opt nested m="standar" title="Filter Warna Standar" desc="Tampilan warna standar Warma." />
          <Opt nested m="merah-hijau" beta title="Filter Warna Hijau/Merah (Protanopia & Deuteranopia)" desc="Tampilan warna untuk seseorang dengan kondisi sulit membedakan warna merah atau hijau." />
          <Opt nested m="biru-kuning" beta title="Filter Warna Biru/Kuning (Tritanopia)" desc="Tampilan warna untuk seseorang dengan kondisi sulit membedakan warna biru dan kuning." />
        </div>
        <Opt m="gelap" beta title="Dark" desc="Tampilan gelap (eksperimen, beberapa bagian mungkin belum rapi)." />
        {err && <div className="aerr">{err}</div>}
      </div>
      <div className="dprev">
        <div className="dph">Preview Tampilan</div>
        <div className="dpb">
          <div className="mock">
            <div className="mbar"><span className="mlogo">Warma</span><span className="mchip">Cari</span></div>
            <div className="mcard"><div className="mimg" /><b>Contoh produk</b><span className="mprice">Rp89.000</span><span className="tag p">-36%</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><span className="btn-g" style={{ padding: '6px 12px', fontSize: 10 }}>+ Keranjang</span><span className="mbtn">Beli</span></div></div>
          </div>
          <div className="dfw"><span>Warna aksen</span>
            <div>{Object.entries(AKSEN).map(([k, c]) => <button key={k} className={aksen === k ? 'on' : ''} style={{ background: c }} aria-label={k} onClick={() => { setAksen(k); save({ aksen: k }); }} />)}</div></div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Keamanan */
export function SecurityTab({ nama, device, ip }) {
  const router = useRouter();
  const [pw, setPw] = useState({ lama: '', baru: '', ulang: '' });
  const [show, setShow] = useState(false);
  const [pm, setPm] = useState(null);
  const [busy, setBusy] = useState(false);
  const setP = (k) => (e) => setPw({ ...pw, [k]: e.target.value });
  const type = show ? 'text' : 'password';

  async function savePw(e) {
    e.preventDefault(); setPm(null);
    if (pw.baru !== pw.ulang) return setPm({ ok: false, text: 'Konfirmasi kata sandi baru tidak sama.' });
    setBusy(true);
    try { await api('/api/akun', 'PUT', { lama: pw.lama, baru: pw.baru }); setPw({ lama: '', baru: '', ulang: '' }); setPm({ ok: true, text: 'Kata sandi berhasil diubah. Perangkat lain otomatis keluar.' }); }
    catch (x) { setPm({ ok: false, text: x.message }); }
    setBusy(false);
  }
  async function logoutAll() {
    if (!confirm('Keluar dari semua perangkat, termasuk perangkat ini?')) return;
    await api('/api/akun/keluar-semua', 'POST').catch(() => {});
    window.location.href = '/masuk';
  }
  const Icon = /Android|iOS/.test(device) ? Smartphone : Laptop;

  return (
    <div className="secg">
      <div className="secl">
        <p>Hai {nama.split(' ')[0]},<br />Atur <b>Keamanan Akun</b> Anda di sini</p>
        <div className="secm on">Aktivitas Login</div>
      </div>
      <div className="secr">
        <h3 style={{ textAlign: 'center', fontSize: 18, fontWeight: 600 }}>Aktivitas Login</h3>
        <div className="sectip"><ShieldCheck size={16} /><span>Bila terdapat aktivitas yang tidak dikenal, segera pilih “Keluar dari semua perangkat” lalu ubah kata sandi di bawah.</span></div>
        <p className="meta" style={{ fontWeight: 700, margin: '16px 0 8px' }}>Aktivitas login saat ini</p>
        <div className="secdev"><Icon size={34} style={{ color: 'var(--gr)' }} /><div><b>{device}</b><div className="meta">{ip}</div><span className="tag p" style={{ marginTop: 4 }}>Sedang aktif</span></div></div>
        <div style={{ textAlign: 'right', marginTop: 10 }}><button className="lnk2" onClick={logoutAll}>Keluar dari semua perangkat</button></div>

        <form onSubmit={savePw} style={{ marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <h4 style={{ fontSize: 14 }}>Ubah kata sandi</h4>
          <label className="fl">Kata sandi lama</label>
          <div className="inp" style={{ background: '#f7f8f3' }}><input type={type} value={pw.lama} onChange={setP('lama')} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label="Tampilkan kata sandi">{show ? <EyeOff size={13} /> : <Eye size={13} />}</button></div>
          <label className="fl">Kata sandi baru</label>
          <div className="inp" style={{ background: '#f7f8f3' }}><input type={type} value={pw.baru} onChange={setP('baru')} autoComplete="new-password" placeholder="Minimal 8 karakter, huruf dan angka" required /></div>
          <label className="fl">Ulangi kata sandi baru</label>
          <div className="inp" style={{ background: '#f7f8f3' }}><input type={type} value={pw.ulang} onChange={setP('ulang')} autoComplete="new-password" required /></div>
          <Msg m={pm} />
          <button className="btn-g" disabled={busy} style={{ marginTop: 14, padding: '10px 22px' }}>{busy ? 'Menyimpan…' : 'Ubah kata sandi'}</button>
        </form>
      </div>
    </div>
  );
}
