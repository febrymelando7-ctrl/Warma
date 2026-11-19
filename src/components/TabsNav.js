'use client';
import { useEffect, useState } from 'react';

// Bar melayang yang muncul saat halaman di-scroll: nama produk + tab Detail / Ulasan / Rekomendasi
export default function TabsNav({ nama, tabs }) {
  const [on, setOn] = useState(false);
  const [act, setAct] = useState(tabs[0][0]);
  useEffect(() => {
    const h = () => {
      setOn(window.scrollY > 380);
      let cur = tabs[0][0];
      for (const [id] of tabs) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 140) cur = id; }
      setAct(cur);
    };
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [tabs]);
  return (
    <div className={'subnav' + (on ? ' on' : '')}>
      <div className="wrap"><b className="sn-name">{nama}</b>{tabs.map(([id, l]) => <a key={id} href={`#${id}`} className={act === id ? 'on' : ''}>{l}</a>)}</div>
    </div>
  );
}
