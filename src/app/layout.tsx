import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { getSettingValue } from '@/app/settings/actions'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AZ | AzanTechSolutions',
  description: 'Enterprise Distribution Management System',
  icons: {
    icon: '/AzanTech.png',
    shortcut: '/AzanTech.png',
    apple: '/AzanTech.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch settings from database — fallback to defaults if DB is unreachable
  let theme = 'dark'
  let currency = 'PKR'
  try {
    theme = await getSettingValue('theme') || 'dark'
    currency = await getSettingValue('currency') || 'PKR'
  } catch {
    // DB unreachable (e.g. Neon cold start) — use safe defaults
  }

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body className={`${inter.className} bg-animated text-slate-800 dark:text-slate-100 flex flex-col min-h-screen`}>
        <ThemeProvider initialTheme={theme}>
          <CurrencyProvider initialCurrency={currency}>
            <ClientLayout>
              {children}
            </ClientLayout>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
