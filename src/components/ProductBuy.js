'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Heart, Share2, MessageCircle } from 'lucide-react';
import { rp } from '@/lib/format';
import { useVariant } from '@/components/VariantCtx';

export default function ProductBuy({ id, info, next, wished = false, sellerId = null, isOwner = false }) {
  const { current, base, label } = useVariant();
  const stok = current.stok, harga = current.harga, asli = base.asli;
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [st, setSt] = useState('idle');
  const [msg, setMsg] = useState('');
  const [wish, setWish] = useState(!!wished);
  const max = Math.max(0, Math.min(stok, 99));
  const shown = Math.min(qty, Math.max(1, max));

  async function add(go) {
    if (!id) return setMsg('Data produk belum berasal dari database. Nyalakan MySQL dan impor warma.sql.');
    setSt('busy'); setMsg('');
    try {
      const r = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, qty: shown, variant_id: current.variantId }) });
      if (r.status === 401) return router.push('/masuk?next=' + encodeURIComponent(next));
      if (!r.ok) { setSt('idle'); return setMsg((await r.json().catch(() => ({}))).error || 'Gagal menambah ke keranjang.'); }
      if (go) return router.push('/checkout');
      setSt('done'); router.refresh(); setTimeout(() => setSt('idle'), 1500);
    } catch { setSt('idle'); setMsg('Tidak bisa menghubungi server.'); }
  }
  async function toggleWish() {
    if (!id) return setMsg('Data produk belum berasal dari database. Nyalakan MySQL dan impor warma.sql.');
    const nx = !wish; setWish(nx);
    const r = await fetch('/api/wishlist', { method: nx ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
    if (r && r.status === 401) { setWish(!nx); return router.push('/masuk?next=' + encodeURIComponent(next)); }
    if (!r || !r.ok) { setWish(!nx); return setMsg('Gagal memperbarui wishlist.'); }
    router.refresh();
  }
  async function startChat() {
    if (!sellerId) return setMsg('Toko ini belum menerima chat.');
    const r = await fetch('/api/chat/mulai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seller_id: sellerId }) }).catch(() => null);
    if (r && r.status === 401) return router.push('/masuk?next=' + encodeURIComponent(next));
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) return setMsg(d.error || 'Gagal membuka chat.');
    router.push(`/chat?c=${d.id}&produk=${id}`);
  }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setMsg('Tautan produk disalin.'); } catch { setMsg(window.location.href); }
  }

  return (
    <aside className="buybox">
      <h3>Atur jumlah</h3>
      <div className="meta" style={{ padding: '8px 0 10px', borderBottom: '1px solid var(--line)' }}>{current.nama ? `${label || 'Varian'}: ${current.nama} · ` : ''}{info}</div>
      <div className="qline" style={{ margin: '12px 0' }}>
        <div className="qty"><button onClick={() => setQty(Math.max(1, shown - 1))} disabled={max < 1}><Minus size={11} /></button><span>{max < 1 ? 0 : shown}</span><button onClick={() => setQty(Math.min(max, shown + 1))} disabled={max < 1}><Plus size={11} /></button></div>
        <span className="meta">Stok: <b style={{ color: '#0b1b2b' }}>{stok}</b></span>
      </div>
      {asli > harga && <div className="bstr">{rp(asli * shown)}</div>}
      <div className="bsub"><span className="meta">Subtotal</span><b>{rp(harga * shown)}</b></div>
      <button className="bbtn p" disabled={max < 1 || st === 'busy'} onClick={() => add(false)}>{st === 'done' ? '✓ Masuk keranjang' : '+ Keranjang'}</button>
      <button className="bbtn o" disabled={max < 1 || st === 'busy'} onClick={() => add(true)}>Beli Langsung</button>
      {msg && <div className="meta" style={{ textAlign: 'center', marginBottom: 6, color: msg.startsWith('Tautan') ? '#2a6b12' : '#b3261e' }}>{msg}</div>}
      <div className="blinks"><button onClick={startChat} disabled={isOwner} title={isOwner ? 'Ini tokomu' : undefined}><MessageCircle size={13} /> Chat</button><span>|</span><button onClick={toggleWish}><Heart size={13} fill={wish ? '#14507f' : 'none'} /> Wishlist</button><span>|</span><button onClick={share}><Share2 size={13} /> Bagikan</button></div>
    </aside>
  );
}
