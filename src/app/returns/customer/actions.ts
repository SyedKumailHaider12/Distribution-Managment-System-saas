'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSalesInvoices() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  return prisma.salesInvoice.findMany({
    where: { organizationId: session.organizationId },
    include: {
      customer: true,
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

export async function getCustomerReturns() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  return prisma.customerReturn.findMany({
    where: { organizationId: session.organizationId },
    include: {
      invoice: {
        include: {
          customer: true,
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

export async function createCustomerReturn(data: {
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

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.returnPrice), 0);

  // Get invoice to find warehouse
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id: invoiceId },
    select: { warehouseId: true },
  });

  if (!invoice) throw new Error('Invoice not found');

  // Create return with items
  const customerReturn = await prisma.customerReturn.create({
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

  // Update stock - add returned items back to warehouse
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
        data: { quantity: { increment: item.quantity } },
      });
    } else {
      await prisma.stock.create({
        data: {
          organizationId: session.organizationId,
          warehouseId: invoice.warehouseId,
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
        },
      });
    }
  }

  // Update invoice status and amounts
  const fullInvoice = await prisma.salesInvoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });

  if (fullInvoice) {
    const totalReturnedQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalInvoiceQty = fullInvoice.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Check if full return or partial
    const isFullReturn = totalReturnedQty >= totalInvoiceQty;
    
    await prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: {
        status: isFullReturn ? 'RETURNED' : 'PARTIAL_RETURN',
        netAmount: { decrement: totalAmount },
        paidAmount: { decrement: totalAmount },
      },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.id,
      action: 'CREATE_CUSTOMER_RETURN',
      tableName: 'CustomerReturn',
      recordId: customerReturn.id,
      details: `Returned ${items.length} items from invoice #${invoiceId}. Reason: ${reason || 'N/A'}`,
    },
  });

  revalidatePath('/returns/customer');
  return customerReturn;
}
