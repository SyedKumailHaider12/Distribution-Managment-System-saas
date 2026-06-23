import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PurchaseReportClient from './PurchaseReportClient';

export default async function PurchaseReportPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const org = session.organizationId;

  const [invoices, returns, suppliers, categories, settings, organization] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where: { organizationId: org },
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, categoryId: true } },
            batch: { select: { batchNumber: true, expiryDate: true } },
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.purchaseReturn.findMany({
      where: { organizationId: org },
      include: {
        invoice: { select: { invoiceNumber: true, supplier: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { returnDate: 'desc' },
    }),
    prisma.supplier.findMany({ where: { organizationId: org }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { organizationId: org }, select: { id: true, name: true } }),
    prisma.settings.findUnique({ where: { organizationId: org } }),
    prisma.organization.findUnique({ where: { id: org } }),
  ]);

  return (
    <PurchaseReportClient
      invoices={invoices as any}
      returns={returns as any}
      suppliers={suppliers}
      categories={categories}
      settings={settings}
      organization={organization}
    />
  );
}
