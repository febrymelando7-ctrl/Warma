import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { getUser } from '@/lib/auth';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font' });

export const metadata = {
  title: 'Warma — Marketplace Serba Ada, Buka 24/7',
  description: 'Marketplace brand resmi dan penjual perorangan, pengiriman instan di 42 kota.',
};

// Tema, filter warna, dan warna aksen mengikuti pilihan di Pengaturan > Mode Tampilan
export default async function RootLayout({ children }) {
  const u = await getUser();
  return (
    <html lang="id" className={font.variable} data-tema={u?.tema || 'terang'} data-filter={u?.filter_warna || 'standar'} data-aksen={u?.aksen || 'hijau'}>
      <body>{children}</body>
    </html>
  );
}
