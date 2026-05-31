'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: 'Rs.',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: '﷼',
  AED: 'د.إ',
}

type CurrencyContextType = {
  currency: string
  symbol: string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PKR',
  symbol: 'Rs.',
})

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: string
  children: ReactNode
}) {
  const [currency] = useState(initialCurrency || 'PKR')
  const symbol = CURRENCY_SYMBOLS[currency] || currency

  return (
    <CurrencyContext.Provider value={{ currency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
