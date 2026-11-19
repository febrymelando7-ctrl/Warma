'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, X, Pencil, Trash2, Search } from 'lucide-react';

const EMPTY = { label: 'Home', nama: '', telepon: '', alamat: '', kota: '', provinsi: '', kode_pos: '', utama: false };
const STEPS = ['Lokasi tujuan', 'Alamat jalan & patokan', 'Penerima & label'];

async function call(method, body) {
  const r = await fetch('/api/alamat', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Gagal memproses permintaan.');
}

export default function AddressManager({ addresses, next, defaultName }) {
  const router = useRouter();
  const [f, setF] = useState(null); // null = formulir tertutup
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const open = (a) => { setErr(''); setStep(1); setF(a ? { ...a } : { ...EMPTY, nama: defaultName, utama: !addresses.length }); };
  const shown = addresses.filter((a) => !q.trim() || `${a.label} ${a.nama} ${a.alamat} ${a.kota} ${a.provinsi}`.toLowerCase().includes(q.trim().toLowerCase()));

  async function run(fn) {
    setBusy(true); setErr('');
    try { await fn(); router.refresh(); return true; } catch (e) { setErr(e.message); return false; } finally { setBusy(false); }
  }
  async function onNext(e) {
    e.preventDefault(); setErr('');
    if (step === 1 && (!f.kota.trim() || !f.provinsi.trim())) return setErr('Kota dan provinsi wajib diisi.');
    if (step === 2 && f.alamat.trim().length < 10) return setErr('Alamat minimal 10 karakter (jalan, nomor, kelurahan, patokan).');
    if (step < 3) return setStep(step + 1);
    if (await run(() => call(f.id ? 'PUT' : 'POST', f))) setF(null);
  }
  const del = (a) => { if (confirm(`Hapus alamat "${a.label}"?`)) run(() => call('DELETE', { id: a.id })); };

  return (
    <>
      <div className="asearch">
        <div className="inp" style={{ flex: 1, background: '#fff' }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama alamat / kota / provinsi" /></div>
        {addresses.length < 10 && <button className="btn-g" onClick={() => open(null)}><Plus size={12} /> Tambah Alamat Baru</button>}
      </div>
      {err && !f && <div className="aerr" style={{ marginBottom: 10 }}>{err}</div>}

      {shown.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><MapPin size={16} /></span>
          <b>{addresses.length ? 'Alamat tidak ditemukan' : 'Belum ada alamat tersimpan'}</b>
          <p className="meta" style={{ marginTop: 6 }}>{addresses.length ? 'Coba kata kunci lain.' : 'Tambahkan alamat agar checkout lebih cepat.'}</p>
        </div>)}

      {shown.map((a) => (
        <div className="panel acard" key={a.id}>
          <div style={{ flex: 1 }}>
            <div><span className="tag">{a.label}</span>{a.utama && <span className="tag p" style={{ marginLeft: 6 }}>Utama</span>}</div>
            <p style={{ margin: '8px 0 2px', fontSize: 13 }}><b>{a.nama}</b> <span className="meta">{a.telepon}</span></p>
            <p className="meta" style={{ fontSize: 12 }}>{a.alamat}, {a.kota}, {a.provinsi}{a.kode_pos ? ` ${a.kode_pos}` : ''}</p>
          </div>
          <div className="aact">
            {!a.utama && <button className="out" disabled={busy} onClick={() => run(() => call('PATCH', { id: a.id }))}>Jadikan utama</button>}
            <button className="out" disabled={busy} onClick={() => open(a)}><Pencil size={11} /> Ubah</button>
            <button className="danger" style={{ margin: 0 }} disabled={busy} onClick={() => del(a)}><Trash2 size={11} /> Hapus</button>
          </div>
        </div>))}

      {next && addresses.length > 0 && <Link href={next} className="btn-g" style={{ background: 'var(--blue)', color: '#fff', marginTop: 6 }}>Lanjut ke checkout →</Link>}

      {f && (
        <div className="ov" onClick={() => setF(null)}>
          <form className="md" style={{ width: 520, padding: 22, maxHeight: '92vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()} onSubmit={onNext}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ fontSize: 17, margin: '0 auto' }}>{f.id ? 'Ubah Alamat' : 'Tambah Alamat'}</h3><button type="button" onClick={() => setF(null)} aria-label="Tutup"><X size={16} /></button></div>
            <div className="stepper">{STEPS.map((t, i) => <div key={t} className={step > i + 1 ? 'dn' : step === i + 1 ? 'on' : ''}><i>{i + 1}</i><small>{t}</small></div>)}</div>

            {step === 1 && (<>
              <h4 className="sth">Di mana lokasi tujuan pengirimanmu?</h4>
              <label className="fl">Kota / Kabupaten</label><input className="fi2" value={f.kota} onChange={set('kota')} maxLength={80} autoFocus />
              <label className="fl">Provinsi</label><input className="fi2" value={f.provinsi} onChange={set('provinsi')} maxLength={80} />
              <label className="fl">Kode pos <span className="meta">(opsional)</span></label><input className="fi2" value={f.kode_pos} onChange={set('kode_pos')} maxLength={5} inputMode="numeric" />
            </>)}
            {step === 2 && (<>
              <h4 className="sth">Tulis alamat jalan dan patokan lokasi</h4>
              <label className="fl">Nama jalan / gedung / perumahan</label>
              <textarea className="fi2" rows={4} value={f.alamat} onChange={set('alamat')} maxLength={300} placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan patokan (mis. dekat masjid)" autoFocus />
              <p className="meta" style={{ marginTop: 6 }}>{f.kota}, {f.provinsi}</p>
            </>)}
            {step === 3 && (<>
              <h4 className="sth">Lengkapi data penerima</h4>
              <label className="fl">Label alamat</label>
              <input className="fi2" value={f.label} onChange={set('label')} maxLength={30} placeholder="Home, Office, Rumah orang tua…" />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{['Home', 'Office'].map((l) => <button type="button" key={l} className="out" style={{ padding: '4px 12px' }} onClick={() => setF({ ...f, label: l })}>{l}</button>)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label className="fl">Nama penerima</label><input className="fi2" value={f.nama} onChange={set('nama')} maxLength={100} required /></div>
                <div><label className="fl">Nomor HP</label><input className="fi2" value={f.telepon} onChange={set('telepon')} maxLength={20} placeholder="0812-3456-7890" required /></div>
              </div>
              <label className="meta" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}><input type="checkbox" checked={f.utama} onChange={set('utama')} /> Jadikan alamat utama</label>
            </>)}

            {err && <div className="aerr">{err}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginTop: 16 }}>
              <button type="button" className="out" onClick={() => (step > 1 ? setStep(step - 1) : setF(null))}>{step > 1 ? 'Kembali' : 'Batal'}</button>
              <button className="btn-g" style={{ justifyContent: 'center' }} disabled={busy}>{step < 3 ? 'Lanjut' : busy ? 'Menyimpan…' : 'Simpan alamat'}</button>
            </div>
          </form>
        </div>)}
    </>
  );
}
