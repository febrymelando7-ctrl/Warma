'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

export default function ReviewForm({ productId }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function send(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId, rating, komentar: txt }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || 'Gagal mengirim ulasan.'); setBusy(false); } else router.refresh();
  }
  return (
    <form className="panel" onSubmit={send} style={{ marginTop: 14 }}>
      <b>Tulis ulasanmu</b>
      <div style={{ display: 'flex', gap: 4, margin: '8px 0' }}>{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} bintang`}><Star size={22} fill={n <= rating ? '#f4b400' : 'none'} stroke="#f4b400" /></button>)}</div>
      <textarea className="fi2" rows={3} maxLength={1000} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Ceritakan kualitas barang, kemasan, dan pengirimannya" />
      {err && <div className="aerr">{err}</div>}
      <button className="btn-g" disabled={busy} style={{ marginTop: 10, padding: '10px 20px' }}>{busy ? 'Mengirim…' : 'Kirim ulasan'}</button>
    </form>
  );
}
