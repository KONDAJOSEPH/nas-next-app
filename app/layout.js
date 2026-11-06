import './globals.css';
import { Providers } from '@/components/AppContext';
import Shell from '@/components/Shell';

export const metadata = {
  title: 'Nas Transaction Company',
  description: 'Offline-first agent banking and case management',
  manifest: '/manifest.webmanifest',
  icons: { apple: '/icon-192.png' },
};
export const viewport = { themeColor: '#1565d8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers><Shell>{children}</Shell></Providers>
      </body>
    </html>
  );
}
