import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, startSession } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const u = (await query('SELECT id, password_hash FROM users WHERE email = ?', [String(email || '').trim().toLowerCase()]))[0];
    if (!u || !verifyPassword(String(password || ''), u.password_hash)) return NextResponse.json({ error: 'Email atau kata sandi salah.' }, { status: 401 });
    await startSession(u.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Tidak bisa terhubung ke database. Pastikan MySQL di XAMPP menyala.' }, { status: 500 });
  }
}
