'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Wish({ id, on = false }) {
  const router = useRouter();
  const [v, setV] = useState(on);
  const [busy, setBusy] = useState(false);
  useEffect(() => setV(on), [on]); // ikut data terbaru dari server setelah refresh
  async function toggle() {
    if (!id) return alert('Data produk belum berasal dari database. Nyalakan MySQL dan impor warma.sql.');
    if (busy) return;
    const nx = !v; setV(nx); setBusy(true);
    try {
      const r = await fetch('/api/wishlist', { method: nx ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (r.status === 401) { setV(!nx); return router.push('/masuk?next=' + encodeURIComponent(window.location.pathname + window.location.search)); }
      if (!r.ok) { setV(!nx); alert('Gagal memperbarui wishlist.'); } else router.refresh();
    } catch { setV(!nx); } finally { setBusy(false); }
  }
  return (
    <button className={'heart' + (v ? ' on' : '')} aria-label={v ? 'Hapus dari wishlist' : 'Tambah ke wishlist'} aria-pressed={v} onClick={toggle}>
      <Heart size={12} fill={v ? 'currentColor' : 'none'} />
    </button>
  );
}

export function Countdown({ start = 2 * 3600 + 42 * 60 + 50 }) {
  const [s, setS] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : start)), 1000);
    return () => clearInterval(t);
  }, [start]);
  const p = (n) => String(n).padStart(2, '0');
  return (
    <div className="cd">
      <span className="cd-l">BERAKHIR</span>
      {[[Math.floor(s / 3600), 'JAM'], [Math.floor((s % 3600) / 60), 'MNT'], [s % 60, 'DTK']].map(([n, l], i) => (
        <span key={l} className="cd-u">{i > 0 && <i>:</i>}<b>{p(n)}</b><small>{l}</small></span>
      ))}
    </div>
  );
}

export function AddToCart({ id, slug, className, done = '✓ Ditambahkan', children }) {
  const router = useRouter();
  const [st, setSt] = useState('idle');
  async function add() {
    if (!id) return alert('Data produk belum berasal dari database. Nyalakan MySQL dan impor warma.sql.');
    setSt('busy');
    try {
      const r = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (r.status === 401) return router.push('/masuk?next=/');
      if (!r.ok) { const d = await r.json().catch(() => ({})); setSt('idle'); if (d.needVariant && slug) return router.push('/produk/' + slug); return alert(d.error || 'Gagal menambah ke keranjang.'); }
      setSt('done'); router.refresh(); setTimeout(() => setSt('idle'), 1200);
    } catch { setSt('idle'); alert('Tidak bisa menghubungi server.'); }
  }
  return <button className={className} onClick={add} disabled={st === 'busy'}>{st === 'done' ? done : children}</button>;
}

// Tombol klaim voucher: state undefined = belum diklaim, 0 = sudah diklaim, 1 = sudah terpakai
export function ClaimBtn({ id, state }) {
  const router = useRouter();
  const init = state === undefined ? 'idle' : state ? 'used' : 'done';
  const [st, setSt] = useState(init);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSt(init), [init]);
  async function claim() {
    if (!id) return alert('Data voucher belum berasal dari database. Nyalakan MySQL dan impor warma.sql.');
    setBusy(true);
    try {
      const r = await fetch('/api/voucher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (r.status === 401) return router.push('/masuk?next=' + encodeURIComponent('/#voucher'));
      const d = await r.json().catch(() => ({}));
      if (r.ok || r.status === 409) { setSt('done'); router.refresh(); } else alert(d.error || 'Gagal mengklaim voucher.');
    } catch { alert('Tidak bisa menghubungi server.'); } finally { setBusy(false); }
  }
  if (st === 'done') return <Link href="/voucher" className="btn-g claimed">Diklaim ✓</Link>;
  if (st === 'used') return <span className="btn-g claimed">Terpakai</span>;
  return <button className="btn-g" onClick={claim} disabled={busy}>Klaim Voucher</button>;
}
