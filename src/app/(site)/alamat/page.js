import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getAddresses } from '@/lib/addresses';
import AddressManager from '@/components/AddressManager';

export const metadata = { title: 'Alamat Tersimpan — Warma' };

export default async function Page({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/masuk?next=/alamat');
  const sp = (await searchParams) || {};
  const next = typeof sp.next === 'string' && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '';
  return (
    <div className="wrap" style={{ maxWidth: 820, padding: '24px 16px 60px' }}>
      <div className="sec" style={{ margin: '0 0 14px' }}>
        <div><h2 style={{ fontSize: 22 }}>Alamat tersimpan</h2><p>Alamat pengiriman untuk akun {user.nama}. Maksimal 10 alamat.</p></div>
        <Link href={next || '/'} className="out">{next ? '← Kembali ke checkout' : '← Beranda'}</Link>
      </div>
      <AddressManager addresses={await getAddresses(user.id)} next={next} defaultName={user.nama} />
    </div>
  );
}
