import { redirect } from 'next/navigation';
import CheckoutView from '@/components/CheckoutView';
import { getUser } from '@/lib/auth';
import { getCart, groupCart } from '@/lib/cart';
import { getAddresses } from '@/lib/addresses';
import { getUserVouchers } from '@/lib/vouchers';

export const metadata = { title: 'Checkout — Warma' };

export default async function Page() {
  const u = await getUser();
  if (!u) redirect('/masuk?next=/checkout');
  const sellers = groupCart(await getCart(u.id));
  if (!sellers.length) redirect('/keranjang');
  return <CheckoutView sellers={sellers} addresses={await getAddresses(u.id)} vouchers={await getUserVouchers(u.id)} />;
}
