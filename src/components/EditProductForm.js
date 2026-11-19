'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Trash2, Video } from 'lucide-react';

const OK = ['image/jpeg', 'image/png', 'image/webp'];

export default function EditProductForm({ p, extras: initialExtras = [], variants: initialVariants = [] }) {
  const router = useRouter();
  const [f, setF] = useState({ nama: p.nama, kategori: p.kategori, deskripsi: p.deskripsi, harga: p.harga, harga_asli: p.harga_asli, stok: p.stok, berat: p.berat, kondisi: p.kondisi });
  const [extras, setExtras] = useState(initialExtras);
  const [video, setVideo] = useState(p.video || '');
  const [pct, setPct] = useState(null);
  const [vlabel, setVlabel] = useState(p.varian_label || '');
  const [variants, setVariants] = useState(initialVariants.map((v) => ({ id: v.id, nama: v.nama, harga: v.harga, stok: v.stok })));
  const hasV = variants.length > 0;
  const setV = (k, key) => (e) => setVariants((a) => a.map((v, i) => (i === k ? { ...v, [key]: e.target.value } : v)));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(p.gambar);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function pick(e) {
    const x = e.target.files?.[0];
    if (!x) return;
    if (!OK.includes(x.type)) return setErr('Format foto harus JPG, PNG, atau WebP.');
    if (x.size > 3 * 1024 * 1024) return setErr('Ukuran foto maksimal 3 MB.');
    setErr(''); setFile(x); setPreview(URL.createObjectURL(x));
  }

  async function addExtra(e) {
    const files = [...(e.target.files || [])]; e.target.value = '';
    if (!files.length) return;
    setErr(''); setBusy(true);
    try {
      for (const x of files.slice(0, 10 - extras.length)) {
        if (!OK.includes(x.type)) throw new Error(`“${x.name}”: format foto harus JPG, PNG, atau WebP.`);
        if (x.size > 3 * 1024 * 1024) throw new Error(`“${x.name}”: ukuran foto maksimal 3 MB.`);
        const fd = new FormData(); fd.append('file', x); fd.append('kind', 'image');
        const r = await fetch('/api/seller/upload', { method: 'POST', body: fd }); const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Gagal mengunggah foto.');
        const r2 = await fetch('/api/seller/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, url: d.url }) }); const d2 = await r2.json();
        if (!r2.ok) throw new Error(d2.error || 'Gagal menyimpan foto.');
        setExtras((a) => [...a, { id: d2.id, url: d.url, caption: '' }]);
      }
    } catch (x2) { setErr(x2.message); }
    setBusy(false);
  }
  async function saveCaption(id, caption) {
    await fetch('/api/seller/images', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, caption }) }).catch(() => {});
  }
  function addVideo(e) {
    const x = e.target.files?.[0]; e.target.value = '';
    if (!x) return;
    if (!['video/mp4', 'video/webm'].includes(x.type)) return setErr('Format video harus MP4 atau WebM.');
    if (x.size > 40 * 1024 * 1024) return setErr('Ukuran video maksimal 40 MB.');
    setErr(''); setBusy(true); setPct(0);
    const fd = new FormData(); fd.append('file', x); fd.append('kind', 'video');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/seller/upload');
    xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setPct(Math.round((ev.loaded / ev.total) * 100)); };
    xhr.onerror = () => { setErr('Gagal mengunggah video.'); setBusy(false); setPct(null); };
    xhr.onload = async () => {
      try {
        const d = JSON.parse(xhr.responseText || '{}');
        if (xhr.status !== 200) throw new Error(d.error || 'Gagal mengunggah video.');
        const r2 = await fetch('/api/seller/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, url: d.url }) });
        const d2 = await r2.json().catch(() => ({}));
        if (!r2.ok) throw new Error(d2.error || 'Gagal menyimpan video.');
        setVideo(d.url);
      } catch (x2) { setErr(x2.message); }
      setBusy(false); setPct(null);
    };
    xhr.send(fd);
  }
  async function delVideo() {
    if (!confirm('Hapus video produk ini?')) return;
    setBusy(true);
    const r = await fetch('/api/seller/video', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
    if (r.ok) setVideo(''); else setErr('Gagal menghapus video.');
    setBusy(false);
  }
  async function delExtra(id) {
    const r = await fetch('/api/seller/images', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) setExtras((a) => a.filter((x) => x.id !== id)); else setErr('Gagal menghapus foto.');
  }

  async function save(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      let gambar = p.gambar;
      if (file) {
        const fd = new FormData(); fd.append('file', file); fd.append('kind', 'image');
        const r = await fetch('/api/seller/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Gagal mengunggah foto.');
        gambar = d.url;
      }
      const r2 = await fetch('/api/seller/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, id: p.id, gambar, varian_label: vlabel, variants }) });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error || 'Gagal menyimpan perubahan.');
      router.push('/penjual?tab=products'); router.refresh();
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  async function del() {
    if (!confirm('Hapus produk ini? Tindakan ini tidak bisa dibatalkan.')) return;
    setBusy(true);
    const r = await fetch('/api/seller/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
    if (r.ok) { router.push('/penjual?tab=products'); router.refresh(); } else { setErr('Gagal menghapus produk.'); setBusy(false); }
  }

  return (
    <form className="panel" onSubmit={save}>
      <label className="fl">Foto produk</label>
      <div className="upl">
        <img src={preview} alt="Foto produk" />
        <div><label className="out" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><ImagePlus size={13} /> {file ? 'Ganti pilihan' : 'Ganti foto'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden /></label>
          <p className="meta" style={{ marginTop: 6 }}>JPG, PNG, atau WebP · maksimal 3 MB{file ? ` · dipilih: ${file.name}` : ''}</p></div>
      </div>
      <label className="fl">Galeri foto &amp; motif <span className="meta">(maks. 10 foto, tampil sebagai kolase di halaman produk)</span></label>
      <div className="xgrid">
        {extras.map((x) => (
          <div key={x.id} className="xcard">
            <span className="xph"><img src={x.url} alt="" /><button type="button" onClick={() => delExtra(x.id)} aria-label="Hapus foto">✕</button></span>
            <input className="fi2" placeholder="Nama motif / keterangan" defaultValue={x.caption} maxLength={80} onBlur={(e) => saveCaption(x.id, e.target.value)} />
          </div>))}
        {extras.length < 10 && <label className="xadd"><ImagePlus size={16} /><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addExtra} hidden disabled={busy} /></label>}
      </div>
      <p className="meta" style={{ marginTop: 6 }}>Beri nama pada tiap foto, misalnya nama motif batik atau warna kainnya. Bisa memilih beberapa foto sekaligus.</p>

      <label className="fl">Video produk <span className="meta">(opsional · MP4 atau WebM · maks. 40 MB)</span></label>
      {video ? (
        <div className="vidbox"><video src={video} controls preload="metadata" playsInline /><button type="button" className="danger" style={{ margin: 0 }} onClick={delVideo} disabled={busy}><Trash2 size={12} /> Hapus video</button></div>
      ) : (
        <div>
          <label className="out" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: busy ? 'not-allowed' : 'pointer' }}><Video size={13} /> Unggah video<input type="file" accept="video/mp4,video/webm" onChange={addVideo} hidden disabled={busy} /></label>
          {pct !== null && <div className="prog"><i style={{ width: pct + '%' }} /><span>{pct}%</span></div>}
        </div>)}

      <label className="fl">Nama produk</label><input className="fi2" value={f.nama} onChange={set('nama')} required />
      <label className="fl">Kategori / varian / kondisi</label><input className="fi2" value={f.kategori} onChange={set('kategori')} />
      <label className="fl">Deskripsi</label><textarea className="fi2" rows={5} value={f.deskripsi} onChange={set('deskripsi')} placeholder="Jelaskan produk, kondisi, dan isi paketnya" />
      <div className="vbox">
        <label className="fl" style={{ marginTop: 0 }}>Varian produk <span className="meta">(opsional — ukuran, warna, dan sebagainya)</span></label>
        <input className="fi2" placeholder="Nama grup varian, mis. Ukuran atau Warna" value={vlabel} onChange={(e) => setVlabel(e.target.value)} maxLength={40} />
        {variants.map((v, k) => (
          <div className="vrow2" key={k}>
            <input className="fi2" placeholder="Nama (mis. L)" value={v.nama} onChange={setV(k, 'nama')} maxLength={60} />
            <input className="fi2" type="number" min="1" placeholder="Harga" value={v.harga} onChange={setV(k, 'harga')} />
            <input className="fi2" type="number" min="0" placeholder="Stok" value={v.stok} onChange={setV(k, 'stok')} />
            <button type="button" onClick={() => setVariants((a) => a.filter((_, i) => i !== k))} aria-label="Hapus varian">✕</button>
          </div>))}
        {variants.length < 20 && <button type="button" className="out" style={{ marginTop: 8 }} onClick={() => setVariants((a) => [...a, { nama: '', harga: a.length ? a[a.length - 1].harga : f.harga, stok: 10 }])}>+ Tambah varian</button>}
        {hasV && <p className="meta" style={{ marginTop: 6 }}>Harga dan stok produk dihitung otomatis dari varian. Di daftar produk, harga tampil sebagai harga terendah.</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div><label className="fl">Harga (Rp)</label><input className="fi2" type="number" min="1" value={hasV ? Math.min(...variants.map((v) => Number(v.harga) || 0)) : f.harga} onChange={set('harga')} required={!hasV} disabled={hasV} /></div>
        <div><label className="fl">Harga sebelum diskon</label><input className="fi2" type="number" min="0" value={f.harga_asli} onChange={set('harga_asli')} /></div>
        <div><label className="fl">Stok</label><input className="fi2" type="number" min="0" value={hasV ? variants.reduce((a, v) => a + (Number(v.stok) || 0), 0) : f.stok} onChange={set('stok')} disabled={hasV} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label className="fl">Berat satuan (gram)</label><input className="fi2" type="number" min="1" value={f.berat} onChange={set('berat')} /></div>
        <div><label className="fl">Kondisi</label><select className="fi2" value={f.kondisi} onChange={set('kondisi')}><option>Baru</option><option>Bekas</option></select></div>
      </div>
      <p className="meta" style={{ marginTop: 6 }}>Persentase diskon dihitung otomatis dari harga sebelum diskon.</p>
      {err && <div className="aerr">{err}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
        <button className="btn-g" disabled={busy} style={{ padding: '11px 22px' }}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>
        <button type="button" className="out" onClick={() => router.push('/penjual?tab=products')} disabled={busy}>Batal</button>
        <button type="button" className="danger" onClick={del} disabled={busy}><Trash2 size={12} /> Hapus produk</button>
      </div>
    </form>
  );
}
