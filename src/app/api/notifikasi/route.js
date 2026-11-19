import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

const need = () => NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });

// Daftar notifikasi terbaru (untuk menu lonceng)
export async function GET() {
  const u = await getUser(); if (!u) return need();
  try {
    const rows = await query('SELECT id, judul, isi, link, dibaca, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20', [u.id]);
    return NextResponse.json({ items: rows.map((r) => ({ id: r.id, judul: r.judul, isi: r.isi, link: r.link, dibaca: !!r.dibaca, created_at: new Date(r.created_at).toISOString() })) });
  } catch { return NextResponse.json({ items: [] }); }
}

// Tandai dibaca: { id } untuk satu, { all: true } untuk semua
export async function POST(req) {
  const u = await getUser(); if (!u) return need();
  const b = await req.json().catch(() => ({}));
  try {
    if (b.all) await query('UPDATE notifications SET dibaca = 1 WHERE user_id = ? AND dibaca = 0', [u.id]);
    else await query('UPDATE notifications SET dibaca = 1 WHERE id = ? AND user_id = ?', [b.id, u.id]);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Gagal memperbarui notifikasi.' }, { status: 500 }); }
}
