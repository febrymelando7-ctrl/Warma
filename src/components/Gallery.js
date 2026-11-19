'use client';
import { useState } from 'react';
import { Play } from 'lucide-react';

// Galeri utama: foto, video produk, dan foto tambahan. Klik gambar kecil untuk berganti.
export default function Gallery({ media, alt, diskon = 0 }) {
  const [i, setI] = useState(0);
  const cur = media[i] || media[0];
  const isVid = cur.type === 'video';
  return (
    <div>
      <div className="pdimg" role={isVid ? undefined : 'img'} aria-label={alt} style={isVid ? { background: '#0b0f14' } : { backgroundImage: `url(${cur.url})` }}>
        {isVid ? <video key={cur.url} src={cur.url} controls playsInline preload="metadata" className="pdvid" />
          : diskon > 0 && <span className="off" style={{ fontSize: 12, padding: '4px 10px' }}>-{diskon}%</span>}
      </div>
      {media.length > 1 && (
        <div className="thumbs">
          {media.map((m, k) => (
            <button key={m.url} className={(k === i ? 'on ' : '') + (m.type === 'video' ? 'tv' : '')} onClick={() => setI(k)} style={m.type === 'image' ? { backgroundImage: `url(${m.url})` } : undefined} aria-label={m.type === 'video' ? 'Video produk' : `Foto ${k + 1}`}>
              {m.type === 'video' && <Play size={18} fill="#fff" />}
            </button>))}
        </div>)}
    </div>
  );
}
