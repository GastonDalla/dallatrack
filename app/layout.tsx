import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DallaTrack - Tu Compañero de Entrenamiento',
  description: 'Rastrea tus entrenamientos, crea rutinas y monitorea tu progreso',
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dallatrack'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'Dallatrack',
    title: 'DallaTrack - Tu Compañero de Entrenamiento',
    description: 'Rastrea tus entrenamientos, crea rutinas y monitorea tu progreso'
  },
  twitter: {
    card: 'summary',
    title: 'DallaTrack - Tu Compañero de Entrenamiento',
    description: 'Rastrea tus entrenamientos, crea rutinas y monitorea tu progreso'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Dallatrack" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dallatrack" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
        
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="mask-icon" href="/icons/icon-512x512.png" color="#000000" />
        <link rel="shortcut icon" href="/icons/icon-192x192.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://dallatrack.com" />
        <meta name="twitter:title" content="Dallatrack" />
        <meta name="twitter:description" content="Tu aplicación de seguimiento de fitness y entrenamientos" />
        <meta name="twitter:image" content="/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@dallatrack" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Dallatrack" />
        <meta property="og:description" content="Tu aplicación de seguimiento de fitness y entrenamientos" />
        <meta property="og:site_name" content="Dallatrack" />
        <meta property="og:url" content="https://dallatrack.com" />
        <meta property="og:image" content="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthSessionProvider>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <LanguageProvider>
                <LoadingOverlay />
                <div className="flex min-h-screen flex-col bg-background">
                  <Navigation />
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster />
              </LanguageProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthSessionProvider>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}