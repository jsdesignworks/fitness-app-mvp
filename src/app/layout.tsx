import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { RegisterServiceWorker } from '@/components/pwa/register-service-worker'
import { PWA_THEME_COLOR } from '@/lib/pwa-config'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  colorScheme: 'dark',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Fitness App',
  description: 'Workout tracking with AI-powered training',
  applicationName: 'Fitness App',
  appleWebApp: {
    capable: true,
    title: 'Fitness App',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'msapplication-TileColor': PWA_THEME_COLOR,
    'theme-color': PWA_THEME_COLOR,
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className={`${dmSans.className} min-h-screen bg-background text-foreground font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <RegisterServiceWorker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
