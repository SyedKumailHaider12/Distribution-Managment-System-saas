'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getPurchaseInvoices() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  return prisma.purchaseInvoice.findMany({
    where: { organizationId: session.organizationId },
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
    orderBy: { invoiceDate: 'desc' },
  });
}

export async function getPurchaseReturns() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  return prisma.purchaseReturn.findMany({
    where: { organizationId: session.organizationId },
    include: {
      invoice: {
        include: {
          supplier: true,
        },
      },
      processedByUser: true,
      items: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
    orderBy: { returnDate: 'desc' },
  });
}

export async function createPurchaseReturn(data: {
  invoiceId: number;
  reason?: string;
  remarks?: string;
  items: Array<{
    productId: number;
    batchId: number;
    quantity: number;
    returnPrice: number;
  }>;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { invoiceId, reason, remarks, items } = data;

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.returnPrice), 0);

  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id: invoiceId },
    select: { warehouseId: true },
  });

  if (!invoice) throw new Error('Invoice not found');

  const purchaseReturn = await prisma.purchaseReturn.create({
    data: {
      organizationId: session.organizationId,
      invoiceId,
      reason,
      remarks,
      totalAmount,
      processedBy: session.id,
      items: {
        create: items.map(item => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
          returnPrice: item.returnPrice,
          subtotal: item.quantity * item.returnPrice,
        })),
      },
    },
  });

  // Update stock - deduct returned items from warehouse
  for (const item of items) {
    const existingStock = await prisma.stock.findUnique({
      where: {
        organizationId_warehouseId_productId_batchId: {
          organizationId: session.organizationId,
          warehouseId: invoice.warehouseId,
          productId: item.productId,
          batchId: item.batchId,
        },
      },
    });

    if (existingStock) {
      await prisma.stock.update({
        where: { id: existingStock.id },
        data: { quantity: { decrement: item.quantity } },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.id,
      action: 'CREATE_PURCHASE_RETURN',
      tableName: 'PurchaseReturn',
      recordId: purchaseReturn.id,
      details: `Returned ${items.length} items to supplier from invoice #${invoiceId}. Reason: ${reason || 'N/A'}`,
    },
  });

  revalidatePath('/returns/purchase');
  return purchaseReturn;
}
