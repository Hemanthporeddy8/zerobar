import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import OfflineRegister from '../components/OfflineRegister';

export const metadata = {
  title: 'Zerobar',
  description: 'Full feed. Zero signal.',
  manifest: '/manifest.json'
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
