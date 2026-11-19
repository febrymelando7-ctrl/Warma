import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { storeName } from '@/lib/seller';
import { MSG_SQL, mapMsg, markRead } from '@/lib/chat';
import { agoShort } from '@/lib/format';
import ChatPane from '@/components/ChatPane';

export const metadata = { title: 'Chat — Warma' };

export default async function Page({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/chat');
  const sp = (await searchParams) || {};
  const sel = Number(sp.c) || 0;
  const pid = Number(sp.produk) || 0;

  let threads = [], failed = false;
  try {
    threads = await query(
      `SELECT t.id, t.buyer_id, t.last_message, t.last_sender, t.last_msg_id, t.last_at, t.buyer_read_id, t.seller_read_id,
              b.nama AS buyer_nama, b.foto AS buyer_foto, s.nama AS seller_nama, s.foto AS seller_foto
       FROM chat_threads t JOIN users b ON b.id = t.buyer_id JOIN users s ON s.id = t.seller_id
       WHERE (t.buyer_id = ? OR t.seller_id = ?) AND (t.last_msg_id > 0 OR t.id = ?) ORDER BY t.last_at DESC`, [user.id, user.id, sel]);
  } catch { failed = true; }

  const list = threads.map((t) => {
    const isBuyer = t.buyer_id === user.id;
    const lastRead = isBuyer ? t.buyer_read_id : t.seller_read_id;
    return {
      id: t.id, sub: isBuyer ? 'Penjual' : 'Pembeli',
      name: isBuyer ? storeName({ nama: t.seller_nama }) : t.buyer_nama,
      foto: (isBuyer ? t.seller_foto : t.buyer_foto) || '',
      last: t.last_message ? `${t.last_sender === user.id ? 'Kamu: ' : ''}${t.last_message}` : 'Belum ada pesan',
      at: t.last_msg_id ? agoShort(t.last_at) : '',
      unread: !!t.last_sender && t.last_sender !== user.id && t.last_msg_id > lastRead && t.id !== sel,
    };
  });
  const cur = list.find((t) => t.id === sel);

  let initial = [], attach = null;
  if (cur) {
    try {
      const rows = await query(`${MSG_SQL} WHERE m.thread_id = ? ORDER BY m.id DESC LIMIT 100`, [cur.id]);
      initial = rows.reverse().map((r) => mapMsg(r, user.id));
      await markRead(cur.id, user.id);
      if (pid) {
        const p = (await query('SELECT id, slug, nama, harga, gambar FROM products WHERE id = ?', [pid]))[0];
        if (p) attach = { id: p.id, slug: p.slug, nama: p.nama, harga: Number(p.harga), gambar: p.gambar };
      }
    } catch {}
  }

  return (
    <div className="wrap" style={{ padding: '20px 16px 50px' }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Chat</h2>
      {failed && <div className="aerr">Tidak bisa membuka chat. Pastikan MySQL menyala dan warma.sql terbaru sudah diimpor.</div>}
      <div className="chatw">
        <aside className="chl">
          {!list.length && <p className="meta" style={{ padding: 20, textAlign: 'center' }}>Belum ada percakapan. Mulai dengan menekan <b>Chat</b> di halaman produk.</p>}
          {list.map((t) => (
            <Link key={t.id} href={`/chat?c=${t.id}`} className={'chi' + (t.id === sel ? ' on' : '')}>
              <span className="av" style={t.foto ? { backgroundImage: `url(${t.foto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{t.foto ? '' : t.name.replace('Toko ', '')[0]?.toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}><b>{t.name}</b><small>{t.last}</small></div>
              <div style={{ textAlign: 'right' }}><small>{t.at}</small>{t.unread && <i className="udot" />}</div>
            </Link>))}
        </aside>
        <section className="chp">
          {cur ? <ChatPane key={cur.id} threadId={cur.id} title={cur.name} sub={cur.sub} initial={initial} attach={attach} />
            : <div className="chempty"><span className="sico"><MessageCircle size={18} /></span><b>Pilih percakapan</b><p className="meta">Pilih percakapan di sebelah kiri untuk mulai mengobrol.</p></div>}
        </section>
      </div>
    </div>
  );
}
