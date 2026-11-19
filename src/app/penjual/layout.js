import { Header, Footer } from '@/components/Chrome';

export default function SellerLayout({ children }) {
  return (<><Header seller /><main>{children}</main><Footer /></>);
}
