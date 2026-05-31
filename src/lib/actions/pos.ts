"use server";

import prisma from '../prisma';
import { getSession } from '../auth';

interface POSItem {
  productId: number;
  quantity: number;
  salePrice: number;
}

export async function processPOSCheckout(data: {
  branchId: number;
  warehouseId: number;
  customerId: number;
  items: POSItem[];
  paymentAmount: number;
  paymentMethod: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const invoiceItems: any[] = [];

    // 1. Process each item (FIFO Stock Deduction)
    for (const item of data.items) {
      let remainingQuantityToDeduct = item.quantity;
      let itemSubtotal = 0;

      // Find available stock for this product in the specific warehouse, ordered by oldest batch (FIFO)
      const availableStocks = await tx.stock.findMany({
        where: { 
          productId: item.productId, 
          warehouseId: data.warehouseId,
          quantity: { gt: 0 }
        },
        include: { batch: true },
        orderBy: { batch: { createdAt: 'asc' } }
      });

      const totalAvailable = availableStocks.reduce((sum, s) => sum + s.quantity, 0);
      if (totalAvailable < item.quantity) {
        throw new Error(`Insufficient stock for Product ID: ${item.productId}`);
      }

      for (const stock of availableStocks) {
        if (remainingQuantityToDeduct <= 0) break;

        const quantityToTake = Math.min(stock.quantity, remainingQuantityToDeduct);
        
        // Deduct from Stock
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: stock.quantity - quantityToTake }
        });

        // Record the invoice item linked to this specific batch
        const subtotal = quantityToTake * item.salePrice;
        itemSubtotal += subtotal;

        invoiceItems.push({
          productId: item.productId,
          batchId: stock.batchId,
          quantity: quantityToTake,
          salePrice: item.salePrice,
          purchasePrice: stock.batch.purchasePrice, // Capture cost for Profit Reporting
          subtotal: subtotal,
          organizationId: session.organizationId,
        });

        remainingQuantityToDeduct -= quantityToTake;
      }
      
      totalAmount += itemSubtotal;
    }

    // 2. Create the Sales Invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await tx.salesInvoice.create({
      data: {
        branchId: data.branchId,
        warehouseId: data.warehouseId,
        customerId: data.customerId,
        invoiceNumber,
        saleType: 'retail',
        totalAmount,
        netAmount: totalAmount,
        status: 'COMPLETED',
        organizationId: session.organizationId,
        items: {
          create: invoiceItems
        }
      }
    });

    // 3. Update Customer Ledger
    const lastEntry = await tx.customerLedgerEntry.findFirst({
      where: { customerId: data.customerId },
      orderBy: { id: 'desc' }
    });
    const currentBalance = lastEntry ? lastEntry.balance : 0;
    
    // Sale increases what they owe us
    const newBalanceAfterSale = currentBalance + totalAmount;

    await tx.customerLedgerEntry.create({
      data: {
        customerId: data.customerId,
        type: 'DEBIT',
        amount: totalAmount,
        description: `Sales Invoice ${invoiceNumber}`,
        referenceId: invoiceNumber,
        balance: newBalanceAfterSale,
        organizationId: session.organizationId,
      }
    });

    // 4. Record Payment if amount > 0
    if (data.paymentAmount > 0) {
      const payment = await tx.payment.create({
        data: {
          branchId: data.branchId,
          customerId: data.customerId,
          type: 'INCOMING',
          paymentMethod: data.paymentMethod,
          amount: data.paymentAmount,
          invoiceNumber: invoiceNumber,
          organizationId: session.organizationId,
        }
      });

      // Payment reduces what they owe
      const newBalanceAfterPayment = newBalanceAfterSale - data.paymentAmount;

      await tx.customerLedgerEntry.create({
        data: {
          customerId: data.customerId,
          type: 'CREDIT',
          amount: data.paymentAmount,
          description: `Payment for ${invoiceNumber}`,
          referenceId: `PAY-${payment.id}`,
          balance: newBalanceAfterPayment,
          organizationId: session.organizationId,
        }
      });
    }

    return invoice;
  });
}
