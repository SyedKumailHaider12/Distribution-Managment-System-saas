'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface SaleItem {
  productId: number;
  batchId: number;
  quantity: number;
  salePrice: number;
}

export async function getSalesInvoices(filters?: {
  startDate?: Date;
  endDate?: Date;
  customerId?: number;
  salesmanId?: number;
  status?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const where: any = { organizationId: session.organizationId };

  if (filters?.startDate || filters?.endDate) {
    where.invoiceDate = {};
    if (filters?.startDate) where.invoiceDate.gte = filters.startDate;
    if (filters?.endDate) where.invoiceDate.lte = filters.endDate;
  }
  if (filters?.customerId) where.customerId = filters.customerId;
  if (filters?.salesmanId) where.salesmanId = filters.salesmanId;
  if (filters?.status) where.status = filters.status;

  return prisma.salesInvoice.findMany({
    where,
    include: {
      customer: true,
      salesman: true,
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

export async function getSalesInvoiceById(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  return prisma.salesInvoice.findUnique({
    where: { 
      id,
      organizationId: session.organizationId 
    },
    include: {
      customer: true,
      salesman: true,
      warehouse: true,
      branch: true,
      items: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
  });
}

export async function createSalesInvoice(data: {
  customerId?: number;
  salesmanId?: number;
  warehouseId: number;
  branchId: number;
  saleType: 'retail' | 'distribution';
  items: SaleItem[];
  discount?: number;
  paymentMethod?: string;
  amountTendered?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { salesmanId, warehouseId, branchId, saleType, items, discount = 0, paymentMethod, amountTendered } = data;
  const organizationId = session.organizationId;

  // Calculate totals
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += item.quantity * item.salePrice;
  }

  const discountAmount = discount;
  const netAmount = totalAmount - discountAmount;
  let paidAmount = amountTendered || 0;
  
  if (saleType === 'retail') {
    paidAmount = netAmount; // Retail always fully paid instantly
  }
  
  const balanceDue = netAmount - paidAmount;

  // Resolve Customer
  let finalCustomerId = data.customerId;
  if (saleType === 'retail') {
    let walkInCustomer = await prisma.customer.findFirst({
      where: { isWalkIn: true, organizationId }
    });
    if (!walkInCustomer) {
      walkInCustomer = await prisma.customer.create({
        data: {
          organizationId,
          name: 'Walk-in Customer',
          isWalkIn: true,
          type: 'retail'
        }
      });
    }
    finalCustomerId = walkInCustomer.id;
  }

  if (!finalCustomerId) {
    throw new Error('Customer is required for distribution sales');
  }

  // Generate invoice number
  const count = await prisma.salesInvoice.count({ where: { organizationId } });
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.salesInvoice.create({
      data: {
        organizationId,
        branchId,
        warehouseId,
        customerId: finalCustomerId!,
        salesmanId,
        invoiceNumber,
        saleType,
        totalAmount,
        discount: discountAmount,
        netAmount,
        paidAmount,
        status: saleType === 'retail' ? 'PAID' : (balanceDue > 0 ? (paidAmount > 0 ? 'PARTIAL' : 'UNPAID') : 'PAID'),
      },
    });

    for (const item of items) {
      const stock = await tx.stock.findFirst({
        where: {
          organizationId,
          productId: item.productId,
          warehouseId,
          batchId: item.batchId,
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ID: ${item.productId}`);
      }

      const batch = await tx.batch.findUnique({ where: { id: item.batchId, organizationId } });

      await tx.salesInvoiceItem.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
          salePrice: item.salePrice,
          purchasePrice: batch?.purchasePrice || 0,
          subtotal: item.quantity * item.salePrice,
        },
      });

      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: stock.quantity - item.quantity },
      });
    }

    // Ledger logic only for Distribution
    if (saleType === 'distribution') {
      if (netAmount > 0) {
        const lastEntry = await tx.customerLedgerEntry.findFirst({
          where: { customerId: finalCustomerId, organizationId },
          orderBy: { date: 'desc' },
        });
        const runningBalance = (lastEntry?.balance || 0) + netAmount;

        await tx.customerLedgerEntry.create({
          data: {
            organizationId,
            customerId: finalCustomerId!,
            type: 'DEBIT',
            amount: netAmount,
            description: `Invoice ${invoiceNumber}`,
            referenceId: invoiceNumber,
            balance: runningBalance,
          },
        });
      }

      if (paidAmount > 0) {
        const lastEntry = await tx.customerLedgerEntry.findFirst({
          where: { customerId: finalCustomerId, organizationId },
          orderBy: { date: 'desc' },
        });
        await tx.customerLedgerEntry.create({
          data: {
            organizationId,
            customerId: finalCustomerId!,
            type: 'CREDIT',
            amount: paidAmount,
            description: `Payment for Invoice ${invoiceNumber}`,
            referenceId: invoiceNumber,
            balance: (lastEntry?.balance || 0) - paidAmount,
          },
        });
      }
    }

    // Always record payment if amount is > 0
    if (paidAmount > 0) {
      await tx.payment.create({
        data: {
          organizationId,
          branchId,
          type: 'INCOMING',
          paymentMethod: paymentMethod || 'CASH',
          amount: paidAmount,
          customerId: finalCustomerId,
          invoiceNumber,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId,
        userId: session.id,
        action: 'CREATE',
        tableName: 'SalesInvoice',
        recordId: invoice.id,
        details: `Created ${saleType} invoice ${invoiceNumber}`,
      },
    });

    return invoice;
  });

  revalidatePath('/sales');
  return { success: true, invoice: result };
}

export async function getCustomersForSale() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return prisma.customer.findMany({
    where: { isWalkIn: false, organizationId: session.organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function getWalkInCustomer() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return prisma.customer.findFirst({
    where: { isWalkIn: true, organizationId: session.organizationId },
  });
}

export async function getSalesmen() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return prisma.salesman.findMany({
    where: { organizationId: session.organizationId },
    include: { employee: true },
    orderBy: { name: 'asc' },
  });
}

export async function getWarehouses(branchId: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return prisma.warehouse.findMany({
    where: { branchId, organizationId: session.organizationId },
    orderBy: { name: 'asc' },
  });
}

export async function getProductsWithStock(warehouseId: number) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const products = await prisma.product.findMany({
    where: { organizationId: session.organizationId },
    include: {
      brand: true,
      category: true,
      batches: {
        where: { organizationId: session.organizationId },
        include: {
          stocks: {
            where: { warehouseId, organizationId: session.organizationId },
          },
        },
      },
    },
  });

  return products.map((product) => {
    const totalStock = product.batches.reduce((sum, batch) => {
      return sum + batch.stocks.reduce((s, st) => s + st.quantity, 0);
    }, 0);

    return {
      ...product,
      totalStock,
      batches: product.batches.map((batch) => ({
        ...batch,
        quantity: batch.stocks[0]?.quantity || 0,
      })).filter((b) => b.quantity > 0),
    };
  }).filter((p) => p.totalStock > 0); // Only return products with stock
}
