import Link from 'next/link';
import { SlidersHorizontal, X, SearchX } from 'lucide-react';
import { searchProducts, getFacets, rp, SORT_LABEL } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { getUser } from '@/lib/auth';
import { getWishIds } from '@/lib/wishlist';

export const metadata = { title: 'Cari Produk — Warma' };

const TIPE = { resmi: 'Toko Resmi', pengguna: 'Penjual Pengguna', lokal: 'Toko Lokal' };
const PER = 12;
const int = (v) => Math.max(0, Math.floor(Number(v) || 0));

export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  const q = String(one(sp.q)).trim().slice(0, 80);
  const kategori = String(one(sp.kategori)).slice(0, 80);
  const tipe = [].concat(sp.tipe || []).filter((t) => TIPE[t]);
  const min = int(one(sp.min));
  const max = int(one(sp.max));
  const rating = [3, 4].includes(int(one(sp.rating))) ? int(one(sp.rating)) : 0;
  const diskon = one(sp.diskon) === '1';
  const urut = SORT_LABEL[one(sp.urut)] ? one(sp.urut) : 'relevan';
  const page = Math.max(1, int(one(sp.page)) || 1);

  const f = { q, kategori, tipe, min, max, rating, diskon, urut };
  const [{ rows, total }, facets] = await Promise.all([searchProducts({ ...f, page, per: PER }), getFacets(q)]);
  const pages = Math.max(1, Math.ceil(total / PER));
  const user = await getUser();
  const wished = user ? await getWishIds(user.id) : new Set();

  // Susun tautan dengan mempertahankan filter lain
  const href = (over = {}) => {
    const b = { ...f, diskon: diskon ? '1' : '', page: 1, ...over };
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(b)) {
      if (v == null || v === '' || v === 0 || v === false || (Array.isArray(v) && !v.length)) continue;
      if (k === 'urut' && v === 'relevan') continue;
      if (k === 'page' && v === 1) continue;
      Array.isArray(v) ? v.forEach((x) => u.append(k, x)) : u.set(k, String(v));
    }
    const s = u.toString();
    return '/cari' + (s ? `?${s}` : '');
  };

  const chips = [
    q && ['Kata kunci: ' + q, href({ q: '' })],
    kategori && [kategori, href({ kategori: '' })],
    ...tipe.map((t) => [TIPE[t], href({ tipe: tipe.filter((x) => x !== t) })]),
    min > 0 && ['Min ' + rp(min), href({ min: 0 })],
    max > 0 && ['Maks ' + rp(max), href({ max: 0 })],
    rating > 0 && [`Rating ${rating}+`, href({ rating: 0 })],
    diskon && ['Sedang diskon', href({ diskon: '' })],
  ].filter(Boolean);

  const nums = [...new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))].sort((a, b) => a - b);

  return (
    <div className="wrap" style={{ paddingTop: 18, paddingBottom: 56 }}>
      <div className="sec" style={{ margin: '0 0 12px' }}>
        <div><h2 style={{ fontSize: 22 }}>{q ? <>Hasil untuk “{q}”</> : kategori || 'Semua produk'}</h2><p>{total.toLocaleString('id-ID')} produk ditemukan</p></div>
      </div>

      <div className="sortrow">
        <span className="meta"><b>Urutkan:</b></span>
        {Object.entries(SORT_LABEL).map(([k, l]) => <Link key={k} href={href({ urut: k })} className={urut === k ? 'on' : ''}>{l}</Link>)}
      </div>

      {chips.length > 0 && (
        <div className="chipx">
          {chips.map(([l, h]) => <Link key={l} href={h}>{l} <X size={10} /></Link>)}
          <Link href={q ? `/cari?q=${encodeURIComponent(q)}` : '/cari'} className="rst">Hapus semua filter</Link>
        </div>)}

      <div className="sg">
        <form className="fbox" action="/cari" method="get">
          <h3><SlidersHorizontal size={13} /> Filter</h3>
          <input type="hidden" name="q" value={q} />
          {urut !== 'relevan' && <input type="hidden" name="urut" value={urut} />}

          <div className="fgrp"><b>Kategori</b>
            <label><input type="radio" name="kategori" value="" defaultChecked={!kategori} /> Semua kategori</label>
            {facets.map((c) => <label key={c.kategori}><input type="radio" name="kategori" value={c.kategori} defaultChecked={kategori === c.kategori} /> {c.kategori} <em>{c.n}</em></label>)}
          </div>
          <div className="fgrp"><b>Jenis penjual</b>
            {Object.entries(TIPE).map(([k, l]) => <label key={k}><input type="checkbox" name="tipe" value={k} defaultChecked={tipe.includes(k)} /> {l}</label>)}
          </div>
          <div className="fgrp"><b>Harga (Rp)</b>
            <div className="prr"><input type="number" name="min" min="0" placeholder="Minimum" defaultValue={min || ''} /><input type="number" name="max" min="0" placeholder="Maksimum" defaultValue={max || ''} /></div>
          </div>
          <div className="fgrp"><b>Rating</b>
            <label><input type="radio" name="rating" value="" defaultChecked={!rating} /> Semua</label>
            <label><input type="radio" name="rating" value="4" defaultChecked={rating === 4} /> ★ 4 ke atas</label>
            <label><input type="radio" name="rating" value="3" defaultChecked={rating === 3} /> ★ 3 ke atas</label>
          </div>
          <div className="fgrp"><b>Penawaran</b><label><input type="checkbox" name="diskon" value="1" defaultChecked={diskon} /> Sedang diskon</label></div>
          <button className="btn-g" style={{ width: '100%', justifyContent: 'center', padding: 11 }}>Terapkan filter</button>
        </form>

        <div>
          {rows.length ? <div className="g4">{rows.map((p) => <ProductCard key={p.slug} p={p} wished={wished.has(p.id)} />)}</div> : (
            <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
              <span className="sico" style={{ margin: '0 auto 10px' }}><SearchX size={16} /></span>
              <b>Tidak ada produk yang cocok</b>
              <p className="meta" style={{ margin: '6px 0 14px' }}>Coba kata kunci lain, longgarkan rentang harga, atau hapus beberapa filter.</p>
              <Link href="/cari" className="btn-g" style={{ display: 'inline-flex' }}>Lihat semua produk</Link>
            </div>)}

          {pages > 1 && (
            <nav className="pager">
              {page > 1 && <Link href={href({ page: page - 1 })}>‹</Link>}
              {nums.map((n, i) => <span key={n}>{i > 0 && n - nums[i - 1] > 1 && <em>…</em>}<Link href={href({ page: n })} className={n === page ? 'on' : ''}>{n}</Link></span>)}
              {page < pages && <Link href={href({ page: page + 1 })}>›</Link>}
            </nav>)}
        </div>
      </div>
    </div>
  );
}
