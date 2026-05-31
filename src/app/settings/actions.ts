'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export type OrganizationSettings = {
  companyName: string
  companyContact: string
  companyPhone: string
  companyEmail: string
  companyAddress: string
  companyCity: string
  invoiceHeader: string
  invoiceFooter: string
  invoicePrefix: string
  invoiceTax: string
  currency: string
  invoiceShowLogo: boolean
  alertExpiryDays: string
  alertStockThreshold: string
  alertEmailEnabled: boolean
  alertEmail: string
  theme: string
}

const DEFAULT_SETTINGS: OrganizationSettings = {
  companyName: '',
  companyContact: '',
  companyPhone: '',
  companyEmail: '',
  companyAddress: '',
  companyCity: '',
  invoiceHeader: '',
  invoiceFooter: '',
  invoicePrefix: 'INV',
  invoiceTax: '0',
  currency: 'PKR',
  invoiceShowLogo: true,
  alertExpiryDays: '30',
  alertStockThreshold: '10',
  alertEmailEnabled: false,
  alertEmail: '',
  theme: 'light',
}

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const session = await getSession()
  if (!session) return DEFAULT_SETTINGS

  const settings = await prisma.settings.findUnique({
    where: { organizationId: session.organizationId },
  })

  if (!settings) return DEFAULT_SETTINGS

  return {
    companyName: settings.companyName || '',
    companyContact: settings.companyContact || '',
    companyPhone: settings.companyPhone || '',
    companyEmail: settings.companyEmail || '',
    companyAddress: settings.companyAddress || '',
    companyCity: settings.companyCity || '',
    invoiceHeader: settings.invoiceHeader || '',
    invoiceFooter: settings.invoiceFooter || '',
    invoicePrefix: settings.invoicePrefix || 'INV',
    invoiceTax: settings.invoiceTax || '0',
    currency: settings.currency || 'PKR',
    invoiceShowLogo: settings.invoiceShowLogo ?? true,
    alertExpiryDays: settings.alertExpiryDays || '30',
    alertStockThreshold: settings.alertStockThreshold || '10',
    alertEmailEnabled: settings.alertEmailEnabled ?? false,
    alertEmail: settings.alertEmail || '',
    theme: settings.theme || 'light',
  }
}

export async function saveOrganizationSettings(data: Partial<OrganizationSettings>) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  await prisma.settings.upsert({
    where: { organizationId: session.organizationId },
    update: {
      companyName: data.companyName,
      companyContact: data.companyContact,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companyAddress: data.companyAddress,
      companyCity: data.companyCity,
      invoiceHeader: data.invoiceHeader,
      invoiceFooter: data.invoiceFooter,
      invoicePrefix: data.invoicePrefix,
      invoiceTax: data.invoiceTax,
      currency: data.currency,
      invoiceShowLogo: data.invoiceShowLogo,
      alertExpiryDays: data.alertExpiryDays,
      alertStockThreshold: data.alertStockThreshold,
      alertEmailEnabled: data.alertEmailEnabled,
      alertEmail: data.alertEmail,
      theme: data.theme,
    },
    create: {
      organizationId: session.organizationId,
      companyName: data.companyName,
      companyContact: data.companyContact,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companyAddress: data.companyAddress,
      companyCity: data.companyCity,
      invoiceHeader: data.invoiceHeader,
      invoiceFooter: data.invoiceFooter,
      invoicePrefix: data.invoicePrefix,
      invoiceTax: data.invoiceTax,
      currency: data.currency ?? 'PKR',
      invoiceShowLogo: data.invoiceShowLogo ?? true,
      alertExpiryDays: data.alertExpiryDays,
      alertStockThreshold: data.alertStockThreshold,
      alertEmailEnabled: data.alertEmailEnabled ?? false,
      alertEmail: data.alertEmail,
      theme: data.theme ?? 'light',
    },
  })

  revalidatePath('/settings')
}

// Legacy helper kept for layout.tsx theme reading (server-side)
export async function getSettingValue(key: string, organizationId?: number): Promise<string | null> {
  const orgId = organizationId
  if (!orgId) {
    const session = await getSession()
    if (!session) return null
    const settings = await prisma.settings.findUnique({
      where: { organizationId: session.organizationId },
    })
    if (!settings) return null
    return (settings as any)[key] ?? null
  }

  const settings = await prisma.settings.findUnique({
    where: { organizationId: orgId },
  })
  if (!settings) return null
  return (settings as any)[key] ?? null
}