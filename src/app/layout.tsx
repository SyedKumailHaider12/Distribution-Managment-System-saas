import type { Metadata } from 'next'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch settings from database
  const theme = await getSettingValue('theme') || 'light'
  const currency = await getSettingValue('currency') || 'PKR'

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
