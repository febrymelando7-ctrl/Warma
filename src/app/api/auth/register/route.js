import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, startSession } from '@/lib/auth';

export async function POST(req) {
  try {
    const { nama, email, password, peran } = await req.json();
    const e = String(email || '').trim().toLowerCase();
    if (String(nama || '').trim().length < 2) return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(e)) return NextResponse.json({ error: 'Format email belum benar.' }, { status: 400 });
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(password || ''))) return NextResponse.json({ error: 'Kata sandi minimal 8 karakter dengan huruf dan angka.' }, { status: 400 });
    if ((await query('SELECT id FROM users WHERE email = ?', [e])).length) return NextResponse.json({ error: 'Email ini sudah terdaftar. Silakan masuk.' }, { status: 409 });
    const r = await query('INSERT INTO users (nama, email, password_hash, peran) VALUES (?,?,?,?)', [String(nama).trim(), e, hashPassword(password), peran === 'penjual' ? 'penjual' : 'pembeli']);
    await startSession(r.insertId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Tidak bisa terhubung ke database. Pastikan MySQL di XAMPP menyala dan warma.sql sudah diimpor.' }, { status: 500 });
  }
}
