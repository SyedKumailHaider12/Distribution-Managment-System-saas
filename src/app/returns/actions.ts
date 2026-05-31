'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSalesInvoicesForReturn() {
  return prisma.salesInvoice.findMany({
    where: {
      status: { not: 'CANCELLED' },
    },
    include: {
      customer: true,
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

export async function getPurchaseInvoicesForReturn() {
  return prisma.purchaseInvoice.findMany({
    where: {
      status: { not: 'CANCELLED' },
    },
    include: {
      supplier: true,
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

export interface ReturnItem {
  salesItemId: number;
  productId: number;
  batchId: number;
  quantity: number;
  salePrice: number;
}

export async function createSalesReturn(data: {
  salesInvoiceId: number;
  items: ReturnItem[];
  returnReason: string;
  refundMethod: 'CASH' | 'LEDGER';
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { salesInvoiceId, items, returnReason, refundMethod } = data;

  // Get original invoice
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id: salesInvoiceId },
    include: { customer: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Calculate return amount
  let returnAmount = 0;
  for (const item of items) {
    returnAmount += item.quantity * item.salePrice;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create sales return record
    const salesReturn = await tx.salesInvoice.create({
      data: {
        branchId: invoice.branchId,
        warehouseId: invoice.warehouseId,
        customerId: invoice.customerId,
        invoiceNumber: `RET-${invoice.invoiceNumber}`,
        invoiceDate: new Date(),
        saleType: 'retail',
        totalAmount: -returnAmount,
        netAmount: -returnAmount,
        status: 'COMPLETED',
      },
    });

    // Create return items and restore stock
    for (const item of items) {
      await tx.salesInvoiceItem.create({
        data: {
          invoiceId: salesReturn.id,
          productId: item.productId,
          batchId: item.batchId,
          quantity: -item.quantity,
          salePrice: item.salePrice,
          subtotal: -item.quantity * item.salePrice,
        },
      });

      // Restore stock
      const stock = await tx.stock.findFirst({
        where: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          batchId: item.batchId,
        },
      });

      if (stock) {
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: stock.quantity + item.quantity },
        });
      } else {
        await tx.stock.create({
          data: {
            productId: item.productId,
            warehouseId: invoice.warehouseId,
            batchId: item.batchId,
            quantity: item.quantity,
          },
        });
      }
    }

    // Update customer ledger
    const lastLedgerEntry = await tx.customerLedgerEntry.findFirst({
      where: { customerId: invoice.customerId },
      orderBy: { date: 'desc' },
    });

    await tx.customerLedgerEntry.create({
      data: {
        customerId: invoice.customerId,
        type: 'CREDIT',
        amount: returnAmount,
        description: `Return for ${invoice.invoiceNumber}`,
        referenceId: invoice.invoiceNumber,
        balance: (lastLedgerEntry?.balance || 0) - returnAmount,
      },
    });

    // Create payment record for refund
    if (refundMethod === 'CASH') {
      await tx.payment.create({
        data: {
          branchId: invoice.branchId,
          type: 'OUTGOING',
          paymentMethod: 'CASH',
          amount: returnAmount,
          customerId: invoice.customerId,
          invoiceNumber: invoice.invoiceNumber,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: session.id,
        action: 'RETURN',
        tableName: 'SalesInvoice',
        recordId: salesReturn.id,
        details: `Sales return for invoice ${invoice.invoiceNumber}, amount: ${returnAmount}`,
      },
    });

    return salesReturn;
  });

  revalidatePath('/sales');
  return result;
}

export async function createPurchaseReturn(data: {
  purchaseInvoiceId: number;
  items: {
    purchaseItemId: number;
    productId: number;
    batchId: number;
    quantity: number;
    purchasePrice: number;
  }[];
  returnReason: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { purchaseInvoiceId, items, returnReason } = data;

  // Get original invoice
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id: purchaseInvoiceId },
    include: { supplier: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Calculate return amount
  let returnAmount = 0;
  for (const item of items) {
    returnAmount += item.quantity * item.purchasePrice;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Deduct stock
    for (const item of items) {
      const stock = await tx.stock.findFirst({
        where: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          batchId: item.batchId,
        },
      });

      if (stock) {
        const newQty = stock.quantity - item.quantity;
        if (newQty <= 0) {
          await tx.stock.delete({ where: { id: stock.id } });
        } else {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: newQty },
          });
        }
      }
    }

    // Update supplier ledger
    const lastLedgerEntry = await tx.supplierLedgerEntry.findFirst({
      where: { supplierId: invoice.supplierId },
      orderBy: { date: 'desc' },
    });

    await tx.supplierLedgerEntry.create({
      data: {
        supplierId: invoice.supplierId,
        type: 'DEBIT',
        amount: returnAmount,
        description: `Return for ${invoice.invoiceNumber}`,
        referenceId: invoice.invoiceNumber,
        balance: (lastLedgerEntry?.balance || 0) + returnAmount,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: session.id,
        action: 'RETURN',
        tableName: 'PurchaseInvoice',
        recordId: invoice.id,
        details: `Purchase return for invoice ${invoice.invoiceNumber}, amount: ${returnAmount}`,
      },
    });

    return { success: true };
  });

  revalidatePath('/purchases');
  return result;
}