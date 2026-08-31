import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import OfflineRegister from '../components/OfflineRegister';

export const metadata = {
  title: 'Zerobar — Full feed. Zero signal.',
  description: 'Ultra-fast, low-bandwidth, offline-first social reader for commutes, flights, and low signal zones.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  }
};

export const viewport = {
  themeColor: '#1C2242'
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <OfflineRegister />
          <div className="app-shell">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
