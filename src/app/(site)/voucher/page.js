import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Ticket } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata = { title: 'Voucher Saya — Warma' };

export default async function Page() {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/voucher');
  let rows = [], failed = false;
  try {
    rows = await query(
      `SELECT uv.dipakai, v.judul, v.badge, v.deskripsi, v.minimal, v.berlaku, v.kode, v.warna, (v.berlaku_sampai IS NOT NULL AND v.berlaku_sampai < CURDATE()) AS kedaluwarsa
       FROM user_vouchers uv JOIN vouchers v ON v.id = uv.voucher_id WHERE uv.user_id = ? ORDER BY uv.dipakai ASC, uv.id DESC`, [user.id]);
  } catch { failed = true; }
  return (
    <div className="wrap" style={{ maxWidth: 860, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}>
        <div><h2 style={{ fontSize: 22 }}>Voucher saya</h2><p>Pilih voucher di halaman checkout untuk memakainya.</p></div>
        <Link href="/#voucher" className="out">Cari voucher lain →</Link>
      </div>
      {failed && <div className="aerr">Tidak bisa membaca voucher. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.</div>}
      {!failed && !rows.length && (
        <div className="panel" style={{ textAlign: 'center', padding: 44 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><Ticket size={16} /></span>
          <b>Belum ada voucher</b>
          <p className="meta" style={{ margin: '6px 0 14px' }}>Klaim voucher di beranda, lalu pakai saat checkout.</p>
          <Link href="/#voucher" className="btn-g" style={{ display: 'inline-flex' }}>Lihat voucher</Link>
        </div>)}
      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((v) => {
          const used = !!v.dipakai, ended = !used && !!Number(v.kedaluwarsa);
          return (
            <div className={'v ' + v.warna} key={v.kode} style={used || ended ? { opacity: .55 } : undefined}>
              <div className="vl"><b>{v.badge}</b><small>OFF</small></div>
              <div className="vb"><h4>{v.judul}</h4><strong style={{ fontWeight: 500 }}>{v.deskripsi}</strong><b style={{ color: '#14507f' }}>{v.minimal}</b>
                <div className="row"><span>{v.berlaku}<br />Kode: <b style={{ color: '#0b1b2b' }}>{v.kode}</b></span>
                  <span className="tag" style={used || ended ? { background: '#eef1ea', color: '#6b7a88' } : undefined}>{used ? 'Terpakai' : ended ? 'Berakhir' : 'Tersedia'}</span></div></div>
            </div>);
        })}
      </div>
    </div>
  );
}
