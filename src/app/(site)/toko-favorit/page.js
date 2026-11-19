import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Store, MapPin, Star } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { FollowBtn } from '@/components/ShipBox';

export const metadata = { title: 'Toko Favorit — Warma' };

const TIPE = { resmi: 'Toko Resmi', pengguna: 'Penjual Pengguna', lokal: 'Toko Lokal' };

export default async function Page() {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/toko-favorit');

  let stores = [], thumbs = {}, failed = false;
  try {
    stores = await query(
      `SELECT f.toko,
         (SELECT COUNT(*) FROM products p WHERE p.toko = f.toko AND p.status = 'aktif') AS n,
         (SELECT ROUND(AVG(p.rating), 1) FROM products p WHERE p.toko = f.toko AND p.status = 'aktif') AS r,
         (SELECT MAX(p.tipe_toko) FROM products p WHERE p.toko = f.toko) AS tipe,
         (SELECT MAX(p.lokasi) FROM products p WHERE p.toko = f.toko) AS lokasi,
         (SELECT COUNT(*) FROM toko_favorit x WHERE x.toko = f.toko) AS pengikut
       FROM toko_favorit f WHERE f.user_id = ? ORDER BY f.id DESC`, [user.id]);
    if (stores.length) {
      const rows = await query("SELECT toko, slug, gambar FROM products WHERE toko IN (?) AND status = 'aktif' ORDER BY id DESC", [stores.map((s) => s.toko)]);
      for (const p of rows) (thumbs[p.toko] ||= []).length < 4 && thumbs[p.toko].push({ slug: p.slug, gambar: p.gambar });
    }
  } catch { failed = true; }

  return (
    <div className="wrap" style={{ maxWidth: 860, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}>
        <div><h2 style={{ fontSize: 22 }}>Toko favorit</h2><p>{stores.length} toko yang kamu ikuti · kamu dikabari saat toko menambah produk baru</p></div>
        <Link href="/cari" className="out">Cari produk →</Link>
      </div>
      {failed && <div className="aerr">Tidak bisa membaca toko favorit. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.</div>}
      {!failed && !stores.length && (
        <div className="panel" style={{ textAlign: 'center', padding: 44 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><Store size={16} /></span>
          <b>Belum ada toko favorit</b>
          <p className="meta" style={{ margin: '6px 0 14px' }}>Tekan tombol Follow di kartu toko pada halaman produk untuk menyimpannya di sini.</p>
          <Link href="/" className="btn-g" style={{ display: 'inline-flex' }}>Mulai belanja</Link>
        </div>)}
      {stores.map((s) => (
        <div className="panel" key={s.toko}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="av" style={{ width: 46, height: 46, fontSize: 14, flex: 'none' }}>{s.toko.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 14 }}>{s.toko}</b> <span className={'tag' + (s.tipe === 'pengguna' ? ' p' : '')}>{TIPE[s.tipe] || 'Toko'}</span>
              <div className="meta" style={{ marginTop: 4 }}>
                {s.lokasi && <><MapPin size={10} /> {s.lokasi} · </>}<Star size={10} fill="#8fd25f" stroke="none" /> {Number(s.r || 0).toFixed(1)} · {s.n} produk · {s.pengikut} pengikut
              </div>
            </div>
            <FollowBtn toko={s.toko} on />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            {(thumbs[s.toko] || []).map((p) => <Link key={p.slug} href={`/produk/${p.slug}`} style={{ width: 64, height: 64, borderRadius: 10, background: `#e8ecdf url(${p.gambar}) center/cover`, border: '1px solid var(--line)' }} aria-label="Lihat produk" />)}
            <Link href={`/cari?q=${encodeURIComponent(s.toko)}`} className="out" style={{ marginLeft: 'auto' }}>Lihat semua produk →</Link>
          </div>
        </div>))}
    </div>
  );
}
