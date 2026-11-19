import { redirect } from 'next/navigation';
import CartView from '@/components/CartView';
import { getUser } from '@/lib/auth';
import { getCart, groupCart } from '@/lib/cart';

export const metadata = { title: 'Keranjang — Warma' };

export default async function Page() {
  const u = await getUser();
  if (!u) redirect('/masuk?next=/keranjang');
  return <CartView sellers={groupCart(await getCart(u.id))} />;
}
