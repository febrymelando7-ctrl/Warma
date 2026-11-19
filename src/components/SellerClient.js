'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';

async function call(url, method, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Gagal memproses permintaan.');
  return d;
}

export function ActionBtn({ url, method = 'PATCH', body, className = 'out', children }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button className={className} disabled={busy} onClick={async () => {
      setBusy(true);
      try { await call(url, method, body); router.refresh(); } catch (e) { alert(e.message); }
      setBusy(false);
    }}>{children}</button>
  );
}

export function AddProduct({ toko, label = 'Add product', className = 'btn-g' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ nama: '', varian: '', deskripsi: '', harga: '', stok: '10' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setErr('');
    try { await call('/api/seller/products', 'POST', f); setOpen(false); setF({ nama: '', varian: '', deskripsi: '', harga: '', stok: '10' }); router.refresh(); }
    catch (x) { setErr(x.message); }
  }
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}><Plus size={12} /> {label}</button>
      {open && (
        <div className="ov" onClick={() => setOpen(false)}>
          <form className="md" style={{ width: 360, padding: 20 }} onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ fontSize: 16 }}>Add a product</h3><button type="button" onClick={() => setOpen(false)}><X size={14} /></button></div>
            <p className="meta" style={{ margin: '4px 0 10px' }}>A quick listing for {toko}. It appears in your product list right away.</p>
            <label className="fl">Product name</label><input className="fi2" value={f.nama} onChange={set('nama')} placeholder="e.g. Preloved instant camera" required />
            <label className="fl">Variant / condition</label><input className="fi2" value={f.varian} onChange={set('varian')} placeholder="e.g. 90% condition · black" />
            <label className="fl">Description</label><textarea className="fi2" rows={3} value={f.deskripsi} onChange={set('deskripsi')} placeholder="Describe the item, its condition and what is included" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label className="fl">Price (Rp)</label><input className="fi2" type="number" min="1" value={f.harga} onChange={set('harga')} placeholder="150000" required /></div>
              <div><label className="fl">Stock</label><input className="fi2" type="number" min="0" value={f.stok} onChange={set('stok')} /></div>
            </div>
            {err && <div className="aerr">{err}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginTop: 14 }}><button type="button" className="out" onClick={() => setOpen(false)}>Cancel</button><button className="btn-g" style={{ justifyContent: 'center' }}>Publish listing</button></div>
          </form>
        </div>)}
    </>
  );
}

export function Activate() {
  const router = useRouter();
  return <ActionBtn url="/api/seller/activate" method="POST" className="btn-g"><span onClick={() => setTimeout(() => router.refresh(), 400)}>Siapkan toko saya</span></ActionBtn>;
}
