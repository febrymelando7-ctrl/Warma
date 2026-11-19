import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye, Package, Wallet, TrendingUp, Store, Clock, ShoppingBasket } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { sellerData, storeName } from '@/lib/seller';
import { rp } from '@/lib/format';
import { ActionBtn, AddProduct, Activate } from '@/components/SellerClient';

export const metadata = { title: 'Dasbor Penjual — Warma' };

const ST = { baru: ['New order', 'tag p'], diproses: ['Processing', 'tag'], dikirim: ['Shipped', 'tag'], selesai: ['Delivered', 'tag p'], batal: ['Cancelled', 'tag'] };
const NEXT = { baru: ['diproses', 'Process'], diproses: ['dikirim', 'Ship'], dikirim: ['selesai', 'Delivered'] };
const when = (d) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const user = await getUser();
  if (!user) redirect('/masuk?next=/penjual');
  const toko = storeName(user);

  if (user.peran !== 'penjual') {
    return (
      <div className="wrap" style={{ maxWidth: 520, margin: '60px auto' }}>
        <div className="panel" style={{ textAlign: 'center', padding: 30 }}>
          <span className="sico" style={{ margin: '0 auto 12px' }}><Store size={16} /></span>
          <h2 style={{ fontSize: 20 }}>Buka toko Warma kamu</h2>
          <p className="meta" style={{ margin: '8px 0 16px' }}>Jual ke pembeli di seluruh Indonesia, 24 jam sehari. Nama tokomu nanti: <b>{toko}</b>.</p>
          <Activate />
        </div>
      </div>
    );
  }

  const { products, orders, daily } = await sellerData(user);
  const tab = ['overview', 'orders', 'products', 'payouts'].includes(sp.tab) ? sp.tab : 'overview';
  const live = orders.filter((o) => o.status !== 'batal');
  const revenue = live.reduce((a, o) => a + Number(o.total), 0);
  const toShip = orders.filter((o) => ['baru', 'diproses'].includes(o.status)).length;
  const active = products.filter((p) => p.status === 'aktif').length;
  const low = products.filter((p) => p.stok < 5);

  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
  const bars = days.map((d) => ({ l: d.toLocaleDateString('id-ID', { weekday: 'short' }), v: daily.filter((r) => new Date(r.d).toDateString() === d.toDateString()).reduce((a, r) => a + Number(r.t), 0) }));
  const max = Math.max(1, ...bars.map((b) => b.v));
  const week = bars.reduce((a, b) => a + b.v, 0);

  const filter = ['baru', 'diproses', 'dikirim', 'selesai', 'batal'].includes(sp.s) ? sp.s : null;
  const shown = filter ? orders.filter((o) => o.status === filter) : orders;
  const settled = orders.filter((o) => o.status === 'selesai').reduce((a, o) => a + Number(o.total), 0);
  const pending = orders.filter((o) => ['baru', 'diproses', 'dikirim'].includes(o.status)).reduce((a, o) => a + Number(o.total), 0);

  const OrderRow = ({ o }) => (
    <tr>
      <td><b>{o.kode}</b><div className="meta">{when(o.created_at)}</div></td>
      <td><b>{o.pembeli}</b>{o.alamat && <div className="meta" title={o.alamat} style={{ maxWidth: 220 }}>{o.alamat.length > 70 ? o.alamat.slice(0, 70) + '…' : o.alamat}</div>}</td>
      <td className="meta">{o.qty} pcs · {o.items}</td>
      <td style={{ textAlign: 'right' }}><b>{rp(o.total)}</b></td>
      <td><span className={ST[o.status][1]}>{ST[o.status][0]}</span></td>
      <td style={{ textAlign: 'right' }}>{NEXT[o.status] ? <ActionBtn url="/api/seller/orders" body={{ id: o.id, status: NEXT[o.status][0] }}>{NEXT[o.status][1]}</ActionBtn> : <span className="meta">—</span>}</td>
    </tr>
  );
  const Table = ({ rows }) => rows.length ? (
    <table className="tbl"><thead><tr><th>ORDER</th><th>BUYER</th><th>ITEMS</th><th style={{ textAlign: 'right' }}>TOTAL</th><th>STATUS</th><th style={{ textAlign: 'right' }}>ACTION</th></tr></thead><tbody>{rows.map((o) => <OrderRow key={o.id} o={o} />)}</tbody></table>
  ) : <p className="meta" style={{ padding: 18 }}>Belum ada pesanan{filter ? ' dengan status ini' : ' untuk tokomu'}. Pesanan muncul di sini saat pembeli memesan barang dari {toko}.</p>;

  return (
    <div className="wrap" style={{ paddingTop: 18, paddingBottom: 50 }}>
      <section className="sb">
        <span className="tn">{toko.replace('Toko ', '').slice(0, 2).toUpperCase()}</span>
        <div style={{ flex: 1 }}>
          <h1>{toko} <span className="chip3">● Verified seller</span> <span className="chip3">◷ Buka 24/7</span></h1>
          <p>{products.length} produk · {orders.length} pesanan · Bergabung sebagai {user.nama}</p>
        </div>
        <Link href="/" className="out" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}><Store size={11} /> View storefront</Link>
        <AddProduct toko={toko} />
      </section>

      <nav className="stabs">
        {[['overview', 'Overview', null], ['orders', 'Orders', toShip], ['products', 'Products', products.length], ['payouts', 'Payouts', null]].map(([k, l, c]) => (
          <Link key={k} href={`/penjual?tab=${k}`} className={tab === k ? 'on' : ''}>{l}{c != null && <em>{c}</em>}</Link>))}
      </nav>

      {tab === 'overview' && (<>
        <div className="kpi">
          {[['TOTAL REVENUE', rp(revenue), Wallet, `${live.length} pesanan aktif`], ['ORDERS TO SHIP', toShip, ShoppingBasket, 'Baru & sedang diproses'], ['ACTIVE PRODUCTS', active, Package, `${products.length} listing total`], ['LOW STOCK', low.length, Eye, 'Stok di bawah 5 unit']].map(([t, v, I, s]) => (
            <div className="panel" key={t}><div className="meta" style={{ display: 'flex', justifyContent: 'space-between' }}><b>{t}</b><I size={14} /></div><div className="kv">{v}</div><div className="meta">{s}</div></div>))}
        </div>
        <div className="cg" style={{ gridTemplateColumns: '1fr 280px', marginTop: 0 }}>
          <div className="panel"><b style={{ fontSize: 14 }}>Sales overview</b><div className="meta">Nilai penjualan 7 hari terakhir sebelum ongkir</div>
            <div className="kv">{rp(week)}</div>
            <div className="bars">{bars.map((b) => <div key={b.l}><span style={{ height: Math.max(4, (b.v / max) * 150) }} title={rp(b.v)} /><small>{b.l}</small></div>)}</div></div>
          <div className="panel"><b style={{ fontSize: 14 }}>Low stock</b><div className="meta" style={{ marginBottom: 8 }}>Restock sebelum ramai</div>
            {low.length ? low.map((p) => <div className="ls" key={p.id}><img src={p.gambar} alt="" /><div style={{ flex: 1 }}><b>{p.nama}</b><div className="meta">{p.stok ? `${p.stok} left` : 'Out of stock'}</div></div></div>) : <p className="meta">Semua stok aman.</p>}</div>
        </div>
        <div className="panel" style={{ padding: 0 }}><div className="ph" style={{ padding: '14px 14px 0' }}><div><b style={{ fontSize: 14 }}>Recent orders</b><div className="meta">Geser tiap paket ke tahap berikutnya dari sini</div></div><Link href="/penjual?tab=orders" className="out">View all →</Link></div><Table rows={orders.slice(0, 5)} /></div>
      </>)}

      {tab === 'orders' && (<>
        <div className="chips">
          <Link href="/penjual?tab=orders" className={!filter ? 'on' : ''}>All orders <em>{orders.length}</em></Link>
          {Object.entries(ST).map(([k, [l]]) => <Link key={k} href={`/penjual?tab=orders&s=${k}`} className={filter === k ? 'on' : ''}>{l} <em>{orders.filter((o) => o.status === k).length}</em></Link>)}
        </div>
        <div className="panel" style={{ padding: 0 }}><div className="ph" style={{ padding: '14px 14px 0' }}><b style={{ fontSize: 14 }}>Order queue</b></div><Table rows={shown} /></div>
      </>)}

      {tab === 'products' && (<>
        <div className="panel ph"><div><b>{products.length} listings</b> <span className="tag p">{active} active</span> <span className="tag">{low.length} need restock</span></div><AddProduct toko={toko} /></div>
        {products.length ? <div className="g3">{products.map((p) => (
          <div className="panel" key={p.id}>
            <div style={{ display: 'flex', gap: 10 }}><img src={p.gambar} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}><b>{p.nama}</b><div className="meta">{p.kategori}</div><b>{rp(p.harga)}</b></div><span className={p.status === 'aktif' ? 'tag p' : 'tag'} style={{ alignSelf: 'flex-start' }}>{p.status === 'aktif' ? 'Active' : 'Paused'}</span></div>
            <div className="g3" style={{ margin: '10px 0' }}>{[['STOCK', p.stok], ['SOLD', p.laku]].map(([a, b]) => <div className="mini" key={a}><small>{a}</small><b>{b}</b></div>)}</div>
            <div style={{ display: 'flex', gap: 8 }}><ActionBtn url="/api/seller/products" body={{ id: p.id, status: p.status === 'aktif' ? 'jeda' : 'aktif' }}>{p.status === 'aktif' ? 'Pause listing' : 'Activate'}</ActionBtn><Link href={`/penjual/produk/${p.id}`} className="out">Edit</Link></div>
          </div>))}</div> : <p className="meta">Belum ada produk. Klik “Add product” untuk membuat listing pertamamu.</p>}
      </>)}

      {tab === 'payouts' && (
        <div className="kpi" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="panel"><div className="meta"><b>AVAILABLE TO WITHDRAW</b></div><div className="kv">{rp(Math.floor(settled * 0.98))}</div><div className="meta">Dari pesanan berstatus Delivered · biaya platform 2% sudah dipotong</div></div>
          <div className="panel"><div className="meta"><b>PENDING CLEARANCE</b></div><div className="kv">{rp(pending)}</div><div className="meta"><Clock size={10} /> Dari pesanan yang masih berjalan</div></div>
        </div>)}
    </div>
  );
}
