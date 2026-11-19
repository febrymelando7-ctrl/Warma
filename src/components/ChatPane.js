'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, X, ImagePlus } from 'lucide-react';
import { rp } from '@/lib/format';

const hm = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const day = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function Prod({ p }) {
  return (
    <Link href={`/produk/${p.slug}`} className="cprod">
      <span style={{ backgroundImage: `url(${p.gambar})` }} /><div><b>{p.nama}</b><small>{rp(p.harga)}</small></div>
    </Link>
  );
}

export default function ChatPane({ threadId, title, sub, initial, attach }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState(initial);
  const [txt, setTxt] = useState('');
  const [att, setAtt] = useState(attach);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pic, setPic] = useState(null);
  const [zoom, setZoom] = useState(null);
  const [up, setUp] = useState(false);
  const box = useRef(null);
  const last = useRef(initial.length ? initial[initial.length - 1].id : 0);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs.length]);

  // Cek pesan baru tiap 4 detik selama tab terbuka
  useEffect(() => {
    let stop = false;
    async function poll() {
      if (stop || document.visibilityState !== 'visible') return;
      try {
        const r = await fetch(`/api/chat/pesan?thread=${threadId}&after=${last.current}`, { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (d.messages?.length) {
          last.current = d.messages[d.messages.length - 1].id;
          setMsgs((a) => [...a, ...d.messages.filter((m) => !a.some((x) => x.id === m.id))]);
          router.refresh();
        }
      } catch {}
    }
    const t = setInterval(poll, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [threadId, router]);

  async function pickPic(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setErr('Format foto harus JPG, PNG, atau WebP.');
    if (f.size > 3 * 1024 * 1024) return setErr('Ukuran foto maksimal 3 MB.');
    setErr(''); setUp(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/chat/foto', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Gagal mengunggah foto.');
      setPic(d.url);
    } catch (x) { setErr(x.message); }
    setUp(false);
  }

  async function send(e) {
    e?.preventDefault();
    const isi = txt.trim();
    if ((!isi && !att && !pic) || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/chat/kirim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ thread: threadId, isi, product_id: att?.id, gambar: pic }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErr(d.error || 'Gagal mengirim pesan.');
      else {
        setMsgs((a) => (a.some((x) => x.id === d.message.id) ? a : [...a, d.message]));
        setTxt(''); setPic(null);
        if (att) { setAtt(null); router.replace(`/chat?c=${threadId}`); }
        router.refresh();
      }
    } catch { setErr('Tidak bisa menghubungi server.'); }
    setBusy(false);
  }

  return (
    <>
      <div className="chh"><b>{title}</b><small>{sub}</small></div>
      <div className="chm" ref={box}>
        {!msgs.length && <p className="meta" style={{ textAlign: 'center', marginTop: 30 }}>Belum ada pesan. Tulis pesan pertamamu di bawah.</p>}
        {msgs.map((m, i) => (
          <div key={m.id}>
            {(i === 0 || day(msgs[i - 1].at) !== day(m.at)) && <div className="cday"><span>{day(m.at)}</span></div>}
            <div className={'cbub' + (m.mine ? ' me' : '')}>
              {m.produk && <Prod p={m.produk} />}
              {m.gambar && <img className="cimg" src={m.gambar} alt="Foto dari chat" onClick={() => setZoom(m.gambar)} />}
              {m.isi && <p>{m.isi}</p>}
              <small>{hm(m.at)}</small>
            </div>
          </div>))}
      </div>
      <form className="chc" onSubmit={send}>
        {att && <div className="catt"><span style={{ backgroundImage: `url(${att.gambar})` }} /><div><small>Tanyakan produk ini</small><b>{att.nama}</b></div><button type="button" onClick={() => { setAtt(null); router.replace(`/chat?c=${threadId}`); }} aria-label="Hapus lampiran"><X size={14} /></button></div>}
        {err && <div className="aerr" style={{ margin: '0 0 8px' }}>{err}</div>}
        {(pic || up) && <div className="cpic">{up ? <small>Mengunggah foto…</small> : <><img src={pic} alt="" /><button type="button" onClick={() => setPic(null)} aria-label="Hapus foto"><X size={12} /></button></>}</div>}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <label className="out cpick" aria-label="Kirim foto"><ImagePlus size={16} /><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPic} disabled={up || busy} /></label>
          <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={1} maxLength={1000} placeholder="Tulis pesan…"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn-g" disabled={busy || up || (!txt.trim() && !att && !pic)} aria-label="Kirim"><Send size={14} /></button>
        </div>
      </form>
      {zoom && <div className="lb" onClick={() => setZoom(null)}><button className="lbx" onClick={() => setZoom(null)} aria-label="Tutup"><X size={20} /></button><figure><img src={zoom} alt="" /></figure></div>}
    </>
  );
}
