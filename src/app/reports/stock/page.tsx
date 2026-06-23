import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import StockReportClient from './StockReportClient';

export default async function StockReportPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const org = session.organizationId;

  const [stocks, settings, organization] = await Promise.all([
    prisma.stock.findMany({
      where: { organizationId: org },
      include: {
        product: { include: { category: true, brand: true } },
        batch: true,
        warehouse: true,
      },
    }),
    prisma.settings.findUnique({ where: { organizationId: org } }),
    prisma.organization.findUnique({ where: { id: org } }),
  ]);

  return (
    <StockReportClient
      stocks={stocks as any}
      settings={settings}
      organization={organization}
    />
  );
}
