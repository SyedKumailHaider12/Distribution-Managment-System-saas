'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getStockList(warehouseId?: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const where: any = { organizationId: session.organizationId };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  return prisma.stock.findMany({
    where,
    include: {
      product: {
        include: {
          brand: true,
          category: true,
        },
      },
      batch: true,
      warehouse: true,
    },
    orderBy: [{ product: { name: 'asc' } }],
  });
}

export async function getAllWarehouses() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  return prisma.warehouse.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function adjustStock(data: {
  stockId: number;
  adjustment: number;
  reason: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const stock = await prisma.stock.findUnique({
    where: { id: data.stockId, organizationId: session.organizationId },
  });

  if (!stock) {
    throw new Error('Stock not found');
  }

  const newQuantity = stock.quantity + data.adjustment;

  if (newQuantity < 0) {
    throw new Error('Cannot reduce stock below zero');
  }

  await prisma.stock.update({
    where: { id: data.stockId, organizationId: session.organizationId },
    data: { quantity: newQuantity },
  });

  revalidatePath('/stock');
  return { success: true };
}

export async function transferStock(data: {
  fromStockId: number;
  toWarehouseId: number;
  quantity: number;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const fromStock = await prisma.stock.findUnique({
    where: { id: data.fromStockId, organizationId: session.organizationId },
  });

  if (!fromStock) {
    throw new Error('Source stock not found');
  }

  if (fromStock.quantity < data.quantity) {
    throw new Error('Insufficient stock');
  }

  // Get or create destination stock
  let toStock = await prisma.stock.findFirst({
    where: {
      organizationId: session.organizationId,
      productId: fromStock.productId,
      warehouseId: data.toWarehouseId,
      batchId: fromStock.batchId,
    },
  });

  await prisma.$transaction(async (tx) => {
    // Deduct from source
    await tx.stock.update({
      where: { id: data.fromStockId, organizationId: session.organizationId },
      data: { quantity: fromStock.quantity - data.quantity },
    });

    // Add to destination
    if (toStock) {
      await tx.stock.update({
        where: { id: toStock.id, organizationId: session.organizationId },
        data: { quantity: toStock.quantity + data.quantity },
      });
    } else {
      await tx.stock.create({
        data: {
          organizationId: session.organizationId,
          productId: fromStock.productId,
          warehouseId: data.toWarehouseId,
          batchId: fromStock.batchId,
          quantity: data.quantity,
        },
      });
    }
  });

  revalidatePath('/stock');
  return { success: true };
}

export async function getLowStockProducts() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const products = await prisma.product.findMany({
    where: { organizationId: session.organizationId },
    include: {
      stocks: true,
      brand: true,
      category: true,
    },
  });

  return products.filter((p) => {
    const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
    return totalStock < p.reorderLevel;
  });
}

export async function getExpiringBatches(daysAhead: number = 30) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const batches = await prisma.batch.findMany({
    where: {
      organizationId: session.organizationId,
      expiryDate: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    include: {
      product: true,
      stocks: true,
    },
    orderBy: { expiryDate: 'asc' },
  });

  return batches;
}

export async function getExpiredBatches() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  return prisma.batch.findMany({
    where: {
      organizationId: session.organizationId,
      expiryDate: {
        lt: new Date(),
      },
    },
    include: {
      product: true,
      stocks: true,
    },
    orderBy: { expiryDate: 'desc' },
  });
}
