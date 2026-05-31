import { prisma } from '@/lib/prisma';
import { BatchClient } from './BatchClient';

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
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