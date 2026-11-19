import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { rp } from '@/lib/format';
import { ActionBtn } from '@/components/SellerClient';

export const metadata = { title: 'Pesanan Saya — Warma' };

const ST = { baru: 'Baru', diproses: 'Diproses', dikirim: 'Dikirim', selesai: 'Selesai', batal: 'Dibatalkan' };
const when = (d) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function Page({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/pesanan');
  const sp = (await searchParams) || {};
  const filter = ST[sp.s] ? sp.s : null;

  let orders = [], items = [], failed = false;
  try {
    orders = await query('SELECT id, kode, total, metode_bayar, status, created_at, alamat FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50', [user.id]);
    if (orders.length) items = await query('SELECT order_id, toko, nama, varian, harga, qty FROM order_items WHERE order_id IN (?)', [orders.map((o) => o.id)]);
  } catch { failed = true; }

  const shown = filter ? orders.filter((o) => o.status === filter) : orders;
  return (
    <div className="wrap" style={{ maxWidth: 860, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}><div><h2 style={{ fontSize: 22 }}>Pesanan saya</h2><p>Riwayat belanja akun {user.nama}</p></div><Link href="/" className="out">Lanjut belanja →</Link></div>
      <div className="chips">
        <Link href="/pesanan" className={!filter ? 'on' : ''}>Semua <em>{orders.length}</em></Link>
        {Object.entries(ST).map(([k, l]) => <Link key={k} href={`/pesanan?s=${k}`} className={filter === k ? 'on' : ''}>{l} <em>{orders.filter((o) => o.status === k).length}</em></Link>)}
      </div>

      {failed && <div className="aerr">Tidak bisa membaca pesanan. Pastikan MySQL di XAMPP menyala.</div>}
      {!failed && !shown.length && (
        <div className="panel" style={{ textAlign: 'center', padding: 36 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><ClipboardList size={16} /></span>
          <b>{filter ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan'}</b>
          <p className="meta" style={{ margin: '6px 0 14px' }}>Pesanan yang kamu buat dari keranjang akan muncul di sini.</p>
          <Link href="/" className="btn-g" style={{ display: 'inline-flex' }}>Mulai belanja</Link>
        </div>)}

      {shown.map((o) => {
        const lines = items.filter((x) => x.order_id === o.id);
        const byStore = [...new Set(lines.map((x) => x.toko))];
        return (
          <div className="panel" key={o.id} style={{ padding: 0 }}>
            <div className="ph" style={{ padding: '14px 16px', margin: 0, borderBottom: '1px solid var(--line)' }}>
              <div><b style={{ fontSize: 13 }}>{o.kode}</b><div className="meta">{when(o.created_at)} · {o.metode_bayar || '—'}</div></div>
              <span className={o.status === 'baru' || o.status === 'selesai' ? 'tag p' : 'tag'} style={o.status === 'batal' ? { background: '#eef1ea', color: '#6b7a88' } : undefined}>{ST[o.status]}</span>
              {o.status === 'baru' && <ActionBtn url="/api/orders" body={{ id: o.id }}>Batalkan</ActionBtn>}
            </div>
            {o.alamat && <div className="meta" style={{ padding: '10px 16px 0' }}>Dikirim ke: {o.alamat}</div>}
            <div style={{ padding: '10px 16px' }}>
              {byStore.map((t) => (
                <div key={t} style={{ marginBottom: 10 }}>
                  <div className="meta" style={{ fontWeight: 700, marginBottom: 4 }}>▸ {t}</div>
                  {lines.filter((x) => x.toko === t).map((x, k) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '3px 0' }}>
                      <span>{x.nama}{x.varian ? ` (${x.varian})` : ''} <span className="meta">× {x.qty}</span></span><b>{rp(x.harga * x.qty)}</b>
                    </div>))}
                </div>))}
            </div>
            <div className="sfoot" style={{ borderTop: '1px solid var(--line)' }}><span>{lines.reduce((a, x) => a + x.qty, 0)} barang · ongkir dan biaya perlindungan sudah termasuk</span><span>Total <b>{rp(o.total)}</b></span></div>
          </div>);
      })}
    </div>
  );
}
