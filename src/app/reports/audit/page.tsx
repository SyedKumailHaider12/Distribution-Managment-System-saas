import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AuditReportClient from './AuditReportClient';

export default async function AuditReportPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const org = session.organizationId;

  const [logs, payments, customerReturns, purchaseReturns, settings, organization] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId: org },
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    }),
    prisma.payment.findMany({
      where: { organizationId: org },
      include: {
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.customerReturn.findMany({
      where: { organizationId: org },
      include: {
        invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { returnDate: 'desc' },
    }),
    prisma.purchaseReturn.findMany({
      where: { organizationId: org },
      include: {
        invoice: { select: { invoiceNumber: true, supplier: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { returnDate: 'desc' },
    }),
    prisma.settings.findUnique({ where: { organizationId: org } }),
    prisma.organization.findUnique({ where: { id: org } }),
  ]);

  return (
    <AuditReportClient
      logs={logs as any}
      payments={payments as any}
      customerReturns={customerReturns as any}
      purchaseReturns={purchaseReturns as any}
      settings={settings}
      organization={organization}
    />
  );
}
