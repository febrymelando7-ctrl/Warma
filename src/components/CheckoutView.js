'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Check, Lock, ShieldCheck, Gift, Wallet, Landmark, QrCode, CreditCard, Truck, X, Bell, Receipt } from 'lucide-react';
import { SHIP, DEFAULT_SHIP as DEFAULT, DEMO_VOUCHERS, voucherCut } from '@/lib/shipping';
import { Steps } from '@/components/CartView';
import { rp } from '@/lib/format';

const PAY = [
  ['warma', Wallet, 'Warma Pay', 'Instant, no additional fee', 'Balance Rp1.250.000'],
  ['bca', Landmark, 'BCA Virtual Account', 'Pay from any BCA mobile banking app', 'No fee'],
  ['qris', QrCode, 'QRIS / GoPay', 'Scan once for all three sellers'],
  ['card', CreditCard, 'Credit / Debit Card', 'Visa, Mastercard, JCB · 0% instalment 3 months'],
  ['cod', Truck, 'Cash on Delivery', 'Available for Regular and Economy parcels', '2 of 3 parcels'],
];

export default function CheckoutView({ sellers = [], addresses = [], vouchers = [] }) {
  const [addrId, setAddrId] = useState((addresses.find((a) => a.utama) || addresses[0] || {}).id ?? null);
  const address = addresses.find((a) => a.id === addrId);
  const [ship, setShip] = useState({});
  const pick = (s) => ship[s.nama] ?? DEFAULT[s.tipe];
  const [pay, setPay] = useState('warma');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null);
  const [note, setNote] = useState('');
  const [gift, setGift] = useState(false);
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const router = useRouter();

  const sub = (s) => s.items.reduce((a, i) => a + i.harga * i.qty, 0);
  const subtotal = sellers.reduce((a, s) => a + sub(s), 0);
  const disc = sellers.flatMap((s) => s.items).reduce((a, i) => a + (i.asli - i.harga) * i.qty, 0);
  const shipTotal = sellers.reduce((a, s) => a + SHIP[s.tipe][pick(s)][2], 0);
  const vr = applied ? voucherCut(applied, subtotal, shipTotal) : { cut: 0 };
  const cut = vr.err ? 0 : vr.cut;
  const [vmsg, setVmsg] = useState('');
  const total = subtotal + shipTotal + 3000 - cut;
  const qty = sellers.flatMap((s) => s.items).reduce((a, i) => a + i.qty, 0);
  const choose = (v) => { setCode(v.kode); setVmsg(''); setApplied(applied?.kode === v.kode ? null : v); };
  const apply = () => {
    const k = code.trim().toUpperCase();
    const v = [...DEMO_VOUCHERS, ...vouchers].find((x) => x.kode === k);
    if (!v) { setApplied(null); return setVmsg('Kode tidak valid atau belum kamu klaim.'); }
    const r = voucherCut(v, subtotal, shipTotal);
    if (r.err) { setApplied(null); return setVmsg(r.err); }
    setVmsg(''); setApplied(v);
  };
  const place = async () => {
    setErr('');
    if (!addrId) return setErr('Pilih atau tambahkan alamat pengiriman dulu.');
    const shipping = Object.fromEntries(sellers.map((s) => [s.nama, pick(s)]));
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addressId: addrId, shipping, voucher: applied ? applied.kode : '', metode: payName }) });
      if (res.status === 401) return router.push('/masuk?next=/checkout');
      const d = await res.json();
      if (!res.ok) return setErr(d.error || 'Gagal membuat pesanan.');
      setDone(d.kode);
    } catch { setErr('Tidak bisa menghubungi server.'); }
  };
  const payName = PAY.find((p) => p[0] === pay)[2];

  return (
    <>
      <section className="ban">
        <div className="wrap bn">
          <div>
            <small>Home › Cart › <b>Checkout</b></small>
            <h1>One payment, {sellers.length} sellers, {sellers.length} parcels</h1>
            <p>Review your {qty} items from different Warma sellers — chilled drinks, daily needs and a preloved gadget. Each parcel keeps its own courier, cut-off time and tracking number, and Warma stays open 24/7 so you can check out at any hour.</p>
            <Steps at={1} />
          </div>
          <div className="bb"><span className="g1"><ShieldCheck size={12} /> Protected by the Warma Buyer Guarantee</span><span className="g2"><Lock size={12} /> Buka 24/7 · Secure SSL</span></div>
        </div>
      </section>

      <div className="wrap cg" style={{ gridTemplateColumns: '1fr 290px' }}>
        <div>
          <div className="panel">
            <div className="ph"><span className="sico"><MapPin size={14} /></span><div><b>Deliver to</b><div className="meta">{sellers.length} parcels leave the sellers separately, all to this address</div></div><Link href="/alamat?next=/checkout" className="out"><Plus size={10} /> {addresses.length ? 'Kelola alamat' : 'Add address'}</Link></div>
            {address ? (<>
              <div className="addr"><b>{address.nama}</b> <span className="meta">{address.telepon}</span> <span className="tag">{address.label}</span>{address.utama ? <span className="tag p" style={{ marginLeft: 6 }}>Default</span> : null}
                <p>{address.alamat}, {address.kota}, {address.provinsi}{address.kode_pos ? ` ${address.kode_pos}` : ''}</p>
                <div className="meta">◷ Courier will call before arriving. Warma delivers 24 hours a day</div></div>
              {addresses.length > 1 && <div className="g3">{addresses.map((a) => (
                <button key={a.id} className={'opt' + (addrId === a.id ? ' on' : '')} onClick={() => setAddrId(a.id)}><b>{a.label}</b><small>{a.kota}, {a.provinsi}</small>{addrId === a.id && <Check size={12} className="chk" />}</button>))}</div>}
            </>) : (
              <div className="addr"><b>Belum ada alamat pengiriman</b><p className="meta">Tambahkan alamat dulu agar pesananmu bisa dikirim.</p><Link href="/alamat?next=/checkout" className="btn-g" style={{ display: 'inline-flex' }}>Tambah alamat</Link></div>)}
          </div>

          <div className="sec" style={{ margin: '18px 0 8px' }}><div><h2 style={{ fontSize: 16 }}>Your items</h2><p>Grouped by seller · {qty} items from {sellers.length} sellers, open 24/7</p></div><Link href="/keranjang" className="meta" style={{ color: '#14507f' }}>✎ Edit cart</Link></div>
          {sellers.map((s, n) => (
            <div className="sc" key={s.id}>
              <div className="sh"><span className="sico"><Check size={14} /></span>
                <div><b>{s.nama} <span className="tag" style={{ background: '#eef1ea', color: '#6b7a88' }}>{s.badge}</span></b><div className="meta">{s.kota} · ★ {s.rating} · <span className="tag">Parcel {n + 1} of {sellers.length}</span></div></div></div>
              {s.items.map((i) => (
                <div className="ci" key={i.id}><img src={i.img} alt="" />
                  <div className="cm"><b>{i.nama}</b><div className="meta">{i.info}</div><div className="tags">{i.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
                    {i.cond && <div className="cond"><b>Condition check:</b> {i.cond}</div>}
                    <div className="meta">▸ Dispatched from {s.kota}</div></div>
                  <div className="cp"><b>{rp(i.harga * i.qty)}</b><s>{rp(i.asli * i.qty)}</s><small>Qty {i.qty}</small></div></div>))}
              <div style={{ padding: '0 14px 12px' }}>
                <div className="sec" style={{ margin: '6px 0' }}><b style={{ fontSize: 12 }}>⇄ Shipping option</b><span className="meta">{SHIP[s.tipe][pick(s)][0]} · {rp(SHIP[s.tipe][pick(s)][2])}</span></div>
                <div className="g3">{SHIP[s.tipe].map(([t, eta, fee, extra], k) => (
                  <button key={t} className={'opt' + (pick(s) === k ? ' on' : '')} onClick={() => setShip({ ...ship, [s.nama]: k })}>
                    <b>{t}</b><small>{eta}</small><div className="orow"><b>{fee ? rp(fee) : 'Free'}</b><small>{extra}</small></div><span className="radio" /></button>))}</div>
                <div className="meta" style={{ marginTop: 8 }}>ⓘ {s.note}</div>
              </div>
              <div className="sfoot"><span>{s.items.reduce((a, i) => a + i.qty, 0)} item · {SHIP[s.tipe][pick(s)][0]}</span><span>Parcel subtotal <b>{rp(sub(s) + SHIP[s.tipe][pick(s)][2])}</b></span></div>
            </div>
          ))}

          <div className="panel">
            <div className="ph"><span className="sico"><Receipt size={14} /></span><div><b>Delivery preferences</b><div className="meta">Applied to every parcel in this order</div></div><span className="tag">Optional</span></div>
            <label className="meta">Note for the courier and seller <span style={{ float: 'right' }}>{note.length}/500</span></label>
            <textarea className="ta" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Example: leave with the lobby receptionist, please call before arriving." />
            <div className="gift"><Gift size={14} /><span><b>Send as a gift</b><br /><small className="meta">Prices are hidden on the packing slip of all three parcels</small></span>
              <button className={'tg' + (gift ? ' on' : '')} onClick={() => setGift(!gift)} aria-label="Send as a gift"><i /></button></div>
          </div>

          <div className="panel">
            <div className="ph"><span className="sico"><Wallet size={14} /></span><div><b>Payment method</b><div className="meta">One payment covers all three sellers and all shipping fees</div></div></div>
            {PAY.map(([id, I, t, d, badge]) => (
              <button key={id} className={'pm' + (pay === id ? ' on' : '')} onClick={() => setPay(id)}>
                <span className="pi"><I size={15} /></span><span style={{ flex: 1, textAlign: 'left' }}><b>{t}</b> {badge && <span className={'tag' + (id === 'warma' ? ' p' : '')}>{badge}</span>}<br /><small className="meta">{d}</small></span>
                {pay === id ? <Check size={14} className="chk2" /> : <span className="radio static" />}</button>))}
            <div className="meta" style={{ background: '#f4f6ee', borderRadius: 8, padding: 8, marginTop: 8 }}>🛡 You selected <b>{payName}</b>. Funds are held by Warma until each parcel is confirmed delivered.</div>
          </div>
          <div className="panel meta"><b style={{ color: '#0b1b2b' }}>Demo notice:</b> this checkout is a design demo for Warma. No real payment is taken, no order is sent to the sellers, and no data is stored. Voucher codes available: <b style={{ color: '#0b1b2b' }}>WARMA50</b>, <b style={{ color: '#0b1b2b' }}>BUKA247</b>.</div>
        </div>

        <aside className="sum">
          <h3>Order summary <span className="tag" style={{ background: '#eef1ea', color: '#6b7a88' }}>{qty} items · {sellers.length} sellers</span></h3>
          <div className="vrow"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Voucher code" /><button onClick={apply}>Apply</button></div>
          <div className="meta" style={{ margin: '6px 0 4px' }}>Try: <span className="tag p">WARMA50</span> <span className="tag p">BUKA247</span></div>
          {vmsg && <div className="meta" style={{ color: '#c0392b', marginBottom: 6 }}>{vmsg}</div>}
          {applied && vr.err && <div className="meta" style={{ color: '#c0392b', marginBottom: 6 }}>{vr.err}</div>}
          {applied && !vr.err && <div className="meta" style={{ color: '#2a6b12', marginBottom: 6 }}>✓ {applied.judul} dipakai</div>}
          {vouchers.length > 0 && <div className="vchips"><b>Voucher saya</b>{vouchers.map((v) => <button type="button" key={v.id} className={'vchip' + (applied?.kode === v.kode ? ' on' : '')} onClick={() => choose(v)}>{v.judul}<small>{v.kode}</small></button>)}</div>}
          <div className="sr"><span>Subtotal ({qty} items)</span><b>{rp(subtotal)}</b></div>
          <div className="sr"><span>Shipping total <span className="tag">{sellers.length} parcels</span></span><b>{rp(shipTotal)}</b></div>
          <div className="sr"><span>Buyer protection</span><b>{rp(3000)}</b></div>
          {cut > 0 && <div className="sr"><span>Voucher</span><b style={{ color: '#14507f' }}>−{rp(cut)}</b></div>}
          <div className="tot"><small>TOTAL TO PAY</small><strong>{rp(total)}</strong><span className="meta">↓ Save {rp(disc - 4500 + cut)}</span></div>
          <div className="sr meta"><span>▭ Paying with {payName}</span><span>▤ Demo order</span></div>
          <button className="ck" style={{ width: '100%', opacity: agree && addrId ? 1 : .45 }} disabled={!agree || !addrId} onClick={place}><Lock size={12} /> Place order · {rp(total)}</button>
          {err && <div className="aerr">{err}</div>}
          <label className="meta agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree to Warma’s <u>terms of sale</u> and the multi-seller return policy.</label>
          <div className="meta sec3">SECURED BY · 3-D Secure · SSL 256-bit</div>
        </aside>
      </div>

      {done && (
        <div className="ov" onClick={() => setDone(null)}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <div className="mh"><span className="okc"><Check size={16} /></span><div><small>ORDER PLACED</small><h3>Thank you, Nadia</h3></div><button onClick={() => setDone(null)} aria-label="Close"><X size={14} /></button>
              <div className="mm"><span>▤ {done}</span><span>▭ {payName}</span><span>◉ {address?.label}</span></div></div>
            <div className="mb">
              <div className="sec" style={{ margin: '0 0 8px' }}><b style={{ fontSize: 12 }}>{sellers.length} shipments on the way</b><span className="tag p">Paid {rp(total)}</span></div>
              {sellers.map((s) => (
                <div className="mrow" key={s.id}><img src={s.items[0].img} alt="" /><div style={{ flex: 1 }}><b>{s.nama}</b><div className="meta">{s.items[0].nama}</div></div>
                  <div style={{ textAlign: 'right' }}><b style={{ color: '#14507f' }}>{SHIP[s.tipe][pick(s)][0]}</b><div className="meta">{SHIP[s.tipe][pick(s)][1]}</div></div></div>))}
              <div className="meta note"><Bell size={10} /> Tracking numbers are sent per parcel. Since sellers ship from Jakarta, Bandung and Sleman, parcels may arrive on different days.</div>
              <div className="mbtn"><button className="ck">▤ View order details</button><Link href="/" className="cs" style={{ marginTop: 0 }}>Continue shopping</Link></div>
            </div>
          </div>
        </div>)}
    </>
  );
}
