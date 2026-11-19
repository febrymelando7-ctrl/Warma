import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { NotifLink } from '@/components/BellMenu';
import { ActionBtn } from '@/components/SellerClient';

export const metadata = { title: 'Notifikasi — Warma' };

export default async function Page() {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/notifikasi');
  let items = [], failed = false;
  try {
    items = (await query('SELECT id, judul, isi, link, dibaca, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50', [user.id]))
      .map((r) => ({ id: r.id, judul: r.judul, isi: r.isi, link: r.link, dibaca: !!r.dibaca, created_at: new Date(r.created_at).toISOString() }));
  } catch { failed = true; }
  const unread = items.filter((n) => !n.dibaca).length;
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}>
        <div><h2 style={{ fontSize: 22 }}>Notifikasi</h2><p>{unread ? `${unread} belum dibaca` : 'Semua sudah dibaca'}</p></div>
        {unread > 0 && <ActionBtn url="/api/notifikasi" method="POST" body={{ all: true }}>Tandai semua dibaca</ActionBtn>}
      </div>
      {failed && <div className="aerr">Tidak bisa membaca notifikasi. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.</div>}
      {!failed && !items.length && (
        <div className="panel" style={{ textAlign: 'center', padding: 44 }}>
          <span className="sico" style={{ margin: '0 auto 10px' }}><Bell size={16} /></span>
          <b>Belum ada notifikasi</b>
          <p className="meta" style={{ marginTop: 6 }}>Kabar tentang pesananmu akan muncul di sini.</p>
        </div>)}
      {items.length > 0 && <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>{items.map((n) => <NotifLink key={n.id} n={n} />)}</div>}
    </div>
  );
}
