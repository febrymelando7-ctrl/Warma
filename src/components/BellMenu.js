'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { agoShort } from '@/lib/format';

async function markRead(body) {
  await fetch('/api/notifikasi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
}

// Satu baris notifikasi: menandai dibaca lalu membuka tautannya
export function NotifLink({ n, onGo }) {
  const router = useRouter();
  return (
    <button className={'ni' + (n.dibaca ? '' : ' un')} onClick={async () => {
      if (!n.dibaca) { await markRead({ id: n.id }); }
      onGo?.(); router.push(n.link || '/notifikasi'); router.refresh();
    }}>
      <b>{n.judul}</b><small>{n.isi}</small><small>{agoShort(n.created_at)}</small>
    </button>
  );
}

export default function BellMenu({ unread = 0, loggedIn }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  async function load() {
    try { const r = await fetch('/api/notifikasi'); setItems(r.ok ? (await r.json()).items : []); } catch { setItems([]); }
  }
  function toggle() {
    if (!loggedIn) return router.push('/masuk?next=/notifikasi');
    const nx = !open; setOpen(nx); if (nx) load();
  }
  async function readAll() { await markRead({ all: true }); await load(); router.refresh(); }

  return (
    <div className="amw" ref={ref}>
      <button className="ic" onClick={toggle} aria-label="Notifikasi" aria-expanded={open}><Bell size={15} />{unread > 0 && <em>{unread > 9 ? '9+' : unread}</em>}</button>
      {open && (
        <div className="amenu bellm">
          <div className="bh"><b>Notifikasi</b>{items?.some((n) => !n.dibaca) && <button onClick={readAll}><CheckCheck size={12} /> Tandai semua dibaca</button>}</div>
          {items === null && <p className="meta" style={{ padding: 16 }}>Memuat…</p>}
          {items && !items.length && <p className="meta" style={{ padding: 20, textAlign: 'center' }}>Belum ada notifikasi.</p>}
          {items && items.map((n) => <NotifLink key={n.id} n={n} onGo={() => setOpen(false)} />)}
          <Link href="/notifikasi" className="bf" onClick={() => setOpen(false)}>Lihat semua notifikasi</Link>
        </div>)}
    </div>
  );
}
