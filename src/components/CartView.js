'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, MessageCircle, MapPin, Star, Lock, ArrowLeft, Check, Minus, Plus, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { rp } from '@/lib/format';

const mk = (src) => src.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, on: true })) }));

export default function CartView({ sellers: src = [] }) {
  const router = useRouter();
  const [sellers, setSellers] = useState(() => mk(src));
  const all = sellers.flatMap((s) => s.items);
  const sel = all.filter((i) => i.on);
  const sub = sel.reduce((a, i) => a + i.harga * i.qty, 0);
  const disc = sel.reduce((a, i) => a + (i.asli - i.harga) * i.qty, 0);
  const parcels = sellers.filter((s) => s.items.some((i) => i.on)).length;
  const fee = parcels * 1000;
  const total = sel.length ? sub + fee : 0;
  const upd = (fn) => setSellers((ss) => ss.map((s) => ({ ...s, items: s.items.map(fn).filter(Boolean) })).filter((s) => s.items.length));
  const qty = all.reduce((a, i) => a + i.qty, 0);
  const sync = (id, q) => fetch('/api/cart', { method: q == null ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, qty: q }) }).then(() => router.refresh());

  return (
    <>
      <section className="ban">
        <div className="wrap bn">
          <div>
            <small>Home › <b>Cart</b></small>
            <h1>Your cart · {qty} items, {sellers.length} sellers</h1>
            <p>Adjust quantities, uncheck what you want to buy later, or remove an item entirely. Whatever stays checked is grouped per seller and carried into checkout — one payment, separate parcels, open 24/7.</p>
            <Steps at={0} />
          </div>
          <div className="bb"><span className="g1"><ShieldCheck size={12} /> Warma Buyer Guarantee on every parcel</span><span className="g2"><Zap size={12} /> Instant 30 min delivery</span></div>
        </div>
      </section>
      <div className="wrap cg">
        <div>
          <div className="selall"><label><input type="checkbox" checked={sel.length === all.length} onChange={(e) => upd((i) => ({ ...i, on: e.target.checked }))} /> <b>Select all items</b> <span className="tag">{sel.length} of {all.length} selected</span></label><span className="meta">Grouped by {sellers.length} sellers <span className="tag p">Shipping picked at checkout</span></span></div>
          {!sellers.length && <div className="panel meta">Keranjangmu masih kosong. <Link href="/" style={{ color: '#14507f', fontWeight: 700 }}>Mulai belanja →</Link></div>}
          {sellers.map((s, n) => (
            <div className="sc" key={s.id}>
              <div className="sh">
                <input type="checkbox" checked={s.items.every((i) => i.on)} onChange={(e) => upd((i) => (s.items.includes(i) || s.items.find((x) => x.id === i.id) ? { ...i, on: e.target.checked } : i))} />
                <span className="sico"><Check size={14} /></span>
                <div><b>{s.nama} <span className="tag" style={{ background: '#eef1ea', color: '#6b7a88' }}>{s.badge}</span></b><div className="meta"><MapPin size={9} /> {s.kota} · <Star size={9} fill="#8fd25f" stroke="none" /> {s.rating} · <span className="tag">Parcel {n + 1} of {sellers.length}</span></div></div>
                <button className="out"><MessageCircle size={11} /> Chat</button>
              </div>
              {s.items.map((i) => (
                <div className="ci" key={i.id}>
                  <input type="checkbox" checked={i.on} onChange={() => upd((x) => (x.id === i.id ? { ...x, on: !x.on } : x))} />
                  <img src={i.img} alt="" />
                  <div className="cm"><b>{i.nama}</b><div className="meta">{i.info}</div>
                    <div className="tags">{i.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
                    {i.cond && <div className="cond"><b>Condition check:</b> {i.cond}</div>}
                    <div className="qrow">
                      <div className="qty"><button onClick={() => { upd((x) => (x.id === i.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)); sync(i.id, Math.max(1, i.qty - 1)); }}><Minus size={10} /></button><span>{i.qty}</span><button onClick={() => { upd((x) => (x.id === i.id ? { ...x, qty: Math.min(99, x.qty + 1) } : x)); sync(i.id, Math.min(99, i.qty + 1)); }}><Plus size={10} /></button></div>
                      <span className="tag p">Save {rp((i.asli - i.harga) * i.qty)}</span>
                    </div></div>
                  <div className="cp"><b>{rp(i.harga * i.qty)}</b><s>{rp(i.asli * i.qty)}</s><small>{rp(i.harga)} / item</small>
                    <button onClick={() => { upd((x) => (x.id === i.id ? null : x)); sync(i.id, null); }}><Trash2 size={10} /> Remove</button></div>
                </div>
              ))}
              <div className="sfoot"><span>{s.note}</span><span>Parcel subtotal <b>{rp(s.items.reduce((a, i) => a + i.harga * i.qty, 0))}</b></span></div>
            </div>
          ))}
          <div className="later"><span><b>Buying later?</b> Uncheck an item instead of removing it — it stays in your cart and is simply left out of this order.</span></div>
        </div>
        <aside className="sum">
          <h3>Cart summary <span className="tag" style={{ background: '#eef1ea', color: '#6b7a88' }}>{qty} items · {sellers.length} sellers</span></h3>
          <div className="sr"><span>Subtotal ({sel.length} of {all.length} items)</span><b>{rp(sub)}</b></div>
          <div className="sr"><span>Item discounts</span><b style={{ color: '#14507f' }}>−{rp(disc)}</b></div>
          <div className="sr"><span>Shipping</span><b>From Rp0</b></div>
          <div className="sr"><span>Buyer protection</span><b>{rp(fee)}</b></div>
          <div className="tot"><small>ESTIMATED TOTAL</small><strong>{rp(total)}</strong><span className="meta">↓ Save {rp(disc)}</span></div>
          <p className="meta">Shipping fees and voucher codes are applied on the checkout step, so the final amount can change slightly.</p>
          <Link href="/checkout" className="ck"><Lock size={12} /> Checkout · {rp(total)}</Link>
          <Link href="/" className="cs"><ArrowLeft size={11} /> Continue shopping</Link>
          <div className="meta sec3">SECURED BY · 3-D Secure · SSL 256-bit</div>
        </aside>
      </div>
    </>
  );
}

export function Steps({ at }) {
  return (
    <div className="steps">{['Cart', 'Delivery & shipping', 'Payment', 'Done'].map((t, i) => <span key={t} className={i === at ? 'on' : i < at ? 'dn' : ''}>{i < at ? '✓ ' : ''}{t}</span>)}</div>
  );
}
