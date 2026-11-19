'use client';
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Kolase foto bergaya mosaik dengan keterangan motif; klik untuk memperbesar
export default function Collage({ photos }) {
  const [open, setOpen] = useState(null);
  const n = photos.length;

  useEffect(() => {
    if (open === null) return;
    const key = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((v) => (v + 1) % n);
      if (e.key === 'ArrowLeft') setOpen((v) => (v - 1 + n) % n);
    };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [open, n]);

  return (
    <>
      <div className="collage">
        {photos.map((p, k) => (
          <button key={p.url} className={'cl' + (k === 0 ? ' big' : k % 5 === 0 ? ' wide' : '')} style={{ backgroundImage: `url(${p.url})` }} onClick={() => setOpen(k)} aria-label={p.caption || `Foto ${k + 1}`}>
            {p.caption && <span>{p.caption}</span>}
          </button>))}
      </div>
      {open !== null && (
        <div className="lb" onClick={() => setOpen(null)}>
          <button className="lbx" onClick={() => setOpen(null)} aria-label="Tutup"><X size={20} /></button>
          {n > 1 && <button className="lbn l" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + n) % n); }} aria-label="Sebelumnya"><ChevronLeft size={24} /></button>}
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photos[open].url} alt={photos[open].caption || ''} />
            <figcaption>{photos[open].caption || ''}<small>{open + 1} / {n}</small></figcaption>
          </figure>
          {n > 1 && <button className="lbn r" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % n); }} aria-label="Berikutnya"><ChevronRight size={24} /></button>}
        </div>)}
    </>
  );
}
