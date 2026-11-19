'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Truck } from 'lucide-react';
import { rp } from '@/lib/format';

export function ShipBox({ lokasi, options }) {
  const [all, setAll] = useState(false);
  const best = options.reduce((a, o) => (o[2] < a[2] ? o : a), options[0]);
  return (
    <div className="shipb">
      <h3>Pengiriman</h3>
      <div className="shl"><MapPin size={14} /> Dikirim dari <b>{lokasi}</b></div>
      {(all ? options : [best]).map(([n, eta, fee]) => (
        <div className="shl" key={n}><Truck size={14} /><div><b>{fee ? rp(fee) : 'Rp0'}</b><div className="meta">{n} • Estimasi {eta}</div></div>
          {!all && <button className="lnk" onClick={() => setAll(true)}>Lihat Kurir Lainnya</button>}</div>))}
    </div>
  );
}

export function FollowBtn({ toko, on = false }) {
  const router = useRouter();
  const [v, setV] = useState(on);
  const [busy, setBusy] = useState(false);
  useEffect(() => setV(on), [on]);
  async function toggle() {
    if (busy) return;
    const nx = !v; setV(nx); setBusy(true);
    try {
      const r = await fetch('/api/toko-favorit', { method: nx ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toko }) });
      if (r.status === 401) { setV(!nx); return router.push('/masuk?next=' + encodeURIComponent(window.location.pathname)); }
      if (!r.ok) { setV(!nx); const d = await r.json().catch(() => ({})); alert(d.error || 'Gagal memperbarui toko favorit.'); } else router.refresh();
    } catch { setV(!nx); } finally { setBusy(false); }
  }
  return <button className={'follow' + (v ? ' on' : '')} onClick={toggle} disabled={busy}>{v ? 'Diikuti' : 'Follow'}</button>;
}
