import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FinancialReportClient from './FinancialReportClient';

export default async function FinancialReportPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const org = session.organizationId;

  const [salesInvoices, purchaseInvoices, customerReturns, settings, organization] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { organizationId: org },
      include: { customer: { select: { id: true, name: true } }, items: { select: { quantity: true, salePrice: true, purchasePrice: true, subtotal: true, productId: true } } },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.purchaseInvoice.findMany({
      where: { organizationId: org },
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.customerReturn.findMany({
      where: { organizationId: org },
      include: { invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } } },
    }),
    prisma.settings.findUnique({ where: { organizationId: org } }),
    prisma.organization.findUnique({ where: { id: org } }),
  ]);

  // Customer aging
  const unpaidSales = await prisma.salesInvoice.findMany({
    where: { organizationId: org, status: { in: ['UNPAID', 'PARTIAL'] }, saleType: 'distribution' },
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { invoiceDate: 'asc' },
  });

  // Supplier aging
  const unpaidPurchases = await prisma.purchaseInvoice.findMany({
    where: { organizationId: org, status: { in: ['UNPAID', 'PARTIAL', 'RECEIVED'] } },
    include: { supplier: { select: { id: true, name: true, phone: true } } },
    orderBy: { invoiceDate: 'asc' },
  });

  return (
    <FinancialReportClient
      salesInvoices={salesInvoices as any}
      purchaseInvoices={purchaseInvoices as any}
      customerReturns={customerReturns as any}
      unpaidSales={unpaidSales as any}
      unpaidPurchases={unpaidPurchases as any}
      settings={settings}
      organization={organization}
    />
  );
}
