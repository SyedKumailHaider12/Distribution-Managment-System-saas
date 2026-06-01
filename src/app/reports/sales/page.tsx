import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SalesReportClient from './SalesReportClient';

export default async function SalesReportPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const organizationId = session.organizationId;

  const [invoices, customers, salesmen] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { organizationId },
      include: {
        customer: { select: { id: true, name: true } },
        salesman: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, genericName: true } },
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.customer.findMany({
      where: { organizationId, isWalkIn: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.salesman.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <SalesReportClient
      invoices={invoices}
      customers={customers}
      salesmen={salesmen}
    />
  );
}
