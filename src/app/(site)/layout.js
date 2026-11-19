import { Header, Footer } from '@/components/Chrome';

export default function SiteLayout({ children }) {
  return (<><Header /><main>{children}</main><Footer /></>);
}
