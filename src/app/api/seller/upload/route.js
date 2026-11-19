import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { sniff, isVideo, saveBuffer } from '@/lib/uploads';

const fail = (error, status) => NextResponse.json({ error }, { status });

// Unggah foto (kind=image, maks. 3 MB) atau video (kind=video, maks. 40 MB)
export async function POST(req) {
  const u = await getUser();
  if (!u || u.peran !== 'penjual') return fail('Khusus akun penjual.', 403);
  try {
    const form = await req.formData();
    const file = form.get('file');
    const kind = form.get('kind') === 'video' ? 'video' : 'image';
    if (!file || typeof file === 'string') return fail('Pilih file terlebih dahulu.', 400);
    if (file.size > 40 * 1024 * 1024) return fail('Ukuran file terlalu besar.', 413);
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = sniff(buf);
    if (!ext || isVideo(ext) !== (kind === 'video')) return fail(kind === 'video' ? 'Format video harus MP4 atau WebM.' : 'Format foto harus JPG, PNG, atau WebP.', 415);
    if (!isVideo(ext) && buf.length > 3 * 1024 * 1024) return fail('Ukuran foto maksimal 3 MB.', 413);
    return NextResponse.json({ ok: true, url: await saveBuffer(buf, ext, u.id) });
  } catch {
    return fail('Gagal mengunggah file.', 500);
  }
}
