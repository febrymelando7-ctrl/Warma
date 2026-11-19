'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function DetailTabs({ rows, deskripsi, spec, info }) {
  const [tab, setTab] = useState('detail');
  const [more, setMore] = useState(false);
  const long = deskripsi.length > 260;
  return (
    <div>
      <div className="dtabs">{[['detail', 'Detail Produk'], ['spec', 'Spesifikasi'], ['info', 'Info Penting']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'detail' && (<>
        <div className="kv2">{rows.map(([k, v, href]) => <div key={k}>{k}: {href ? <Link href={href}>{v}</Link> : <b>{v}</b>}</div>)}</div>
        <p className={'pdesc' + (long && !more ? ' clamp' : '')} style={{ marginTop: 14 }}>{deskripsi}</p>
        {long && <button className="lnk" style={{ margin: '6px 0 0' }} onClick={() => setMore(!more)}>{more ? 'Lihat Lebih Sedikit' : 'Lihat Selengkapnya'}</button>}
      </>)}
      {tab === 'spec' && spec.map(([k, v]) => <div className="sr" key={k} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', marginBottom: 0, fontSize: 12 }}><span>{k}</span><b style={{ textAlign: 'right' }}>{v}</b></div>)}
      {tab === 'info' && <ul className="kv2" style={{ paddingLeft: 18 }}>{info.map((t) => <li key={t}>{t}</li>)}</ul>}
    </div>
  );
}
