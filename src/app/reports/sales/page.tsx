import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SalesReportClient from './SalesReportClient';

export default async function SalesReportPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const org = session.organizationId;

  const [invoices, returns, customers, salesmen, categories, settings, organization] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { organizationId: org },
      include: {
        customer: { select: { id: true, name: true } },
        salesman: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, categoryId: true, purchasePrice: true } } } },
      },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.customerReturn.findMany({
      where: { organizationId: org },
      include: {
        invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { returnDate: 'desc' },
    }),
    prisma.customer.findMany({ where: { organizationId: org, isWalkIn: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.salesman.findMany({ where: { organizationId: org }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { organizationId: org }, select: { id: true, name: true } }),
    prisma.settings.findUnique({ where: { organizationId: org } }),
    prisma.organization.findUnique({ where: { id: org } }),
  ]);

  return (
    <SalesReportClient
      invoices={invoices as any}
      returns={returns as any}
      customers={customers}
      salesmen={salesmen}
      categories={categories}
      settings={settings}
      organization={organization}
    />
  );
}
