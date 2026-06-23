import { prisma } from '@/lib/prisma';
import { BatchClient } from './BatchClient';
import { getSession } from '@/lib/auth';

export default async function BatchesPage() {
  const session = await getSession()
  const org = session?.organizationId

  const batches = await prisma.batch.findMany({
    where: { organizationId: org },
    include: {
      product: {
        include: {
          brand: true,
          category: true,
        },
      },
      stocks: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: { expiryDate: 'asc' },
  });

  return <BatchClient initialBatches={batches} />;
}