import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST() {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: 'Silakan masuk dulu.' }, { status: 401 });
  await query("UPDATE users SET peran = 'penjual' WHERE id = ?", [u.id]);
  return NextResponse.json({ ok: true });
}
