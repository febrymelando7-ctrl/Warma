'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Pencil, Trash2 } from 'lucide-react';

const Stars = ({ n, size = 14, onPick }) => [1, 2, 3, 4, 5].map((i) => (
  <button type="button" key={i} onClick={onPick ? () => onPick(i) : undefined} style={{ cursor: onPick ? 'pointer' : 'default' }} aria-label={`${i} bintang`}>
    <Star size={size} fill={i <= n ? '#f4b400' : 'none'} stroke="#f4b400" />
  </button>));

// Satu ulasan milik sendiri: bisa diubah atau dihapus langsung di kartunya
export default function MyReview({ r }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [rating, setRating] = useState(r.rating);
  const [txt, setTxt] = useState(r.komentar);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function call(method, body) {
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/reviews', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Gagal memproses permintaan.');
      setEdit(false); router.refresh();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ width: 52, height: 52, borderRadius: 10, flex: 'none', background: `#e8ecdf url(${r.gambar}) center/cover` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/produk/${r.slug}`} className="nl" style={{ fontWeight: 700, fontSize: 13 }}>{r.nama}</Link>
          <div className="meta">{new Date(r.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        {!edit && <div className="aact"><button className="out" onClick={() => setEdit(true)} disabled={busy}><Pencil size={11} /> Ubah</button>
          <button className="danger" style={{ margin: 0 }} disabled={busy} onClick={() => confirm('Hapus ulasan ini?') && call('DELETE', { id: r.id })}><Trash2 size={11} /> Hapus</button></div>}
      </div>
      {edit ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}><Stars n={rating} size={22} onPick={setRating} /></div>
          <textarea className="fi2" rows={3} maxLength={1000} value={txt} onChange={(e) => setTxt(e.target.value)} style={{ marginTop: 8 }} />
          {err && <div className="aerr">{err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn-g" disabled={busy} onClick={() => call('PATCH', { id: r.id, rating, komentar: txt })}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
            <button className="out" disabled={busy} onClick={() => { setEdit(false); setRating(r.rating); setTxt(r.komentar); setErr(''); }}>Batal</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 2 }}><Stars n={r.rating} /></div>
          {r.komentar ? <p style={{ marginTop: 6, fontSize: 13, whiteSpace: 'pre-wrap' }}>{r.komentar}</p> : <p className="meta" style={{ marginTop: 6 }}>Tanpa komentar.</p>}
          {err && <div className="aerr">{err}</div>}
        </div>)}
    </div>
  );
}
