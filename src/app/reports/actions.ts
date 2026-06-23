'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

// ─── SALES ─────────────────────────────────────────────────
export async function getSalesReportData(filters?: {
  startDate?: string; endDate?: string;
  customerId?: number; salesmanId?: number; saleType?: string;
}) {
  const session = await requireSession();
  const org = session.organizationId;
  const where: any = { organizationId: org };
  if (filters?.startDate) where.invoiceDate = { ...(where.invoiceDate || {}), gte: new Date(filters.startDate) };
  if (filters?.endDate) where.invoiceDate = { ...(where.invoiceDate || {}), lte: new Date(filters.endDate + 'T23:59:59') };
  if (filters?.customerId) where.customerId = filters.customerId;
  if (filters?.salesmanId) where.salesmanId = filters.salesmanId;
  if (filters?.saleType) where.saleType = filters.saleType;

  const [invoices, returns, customers, salesmen, categories] = await Promise.all([
    prisma.salesInvoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        salesman: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
      },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.customerReturn.findMany({
      where: { organizationId: org, invoice: { isNot: null } },
      include: { invoice: { select: { invoiceNumber: true, invoiceDate: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { returnDate: 'desc' },
    }),
    prisma.customer.findMany({ where: { organizationId: org, isWalkIn: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.salesman.findMany({ where: { organizationId: org }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { organizationId: org }, select: { id: true, name: true } }),
  ]);

  return { invoices, returns, customers, salesmen, categories };
}

// ─── PURCHASES ─────────────────────────────────────────────
export async function getPurchasesReportData(filters?: {
  startDate?: string; endDate?: string;
  supplierId?: number; categoryId?: number;
}) {
  const session = await requireSession();
  const org = session.organizationId;
  const where: any = { organizationId: org };
  if (filters?.startDate) where.invoiceDate = { ...(where.invoiceDate || {}), gte: new Date(filters.startDate) };
  if (filters?.endDate) where.invoiceDate = { ...(where.invoiceDate || {}), lte: new Date(filters.endDate + 'T23:59:59') };
  if (filters?.supplierId) where.supplierId = filters.supplierId;

  const [invoices, returns, suppliers, categories] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true }, },
        items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
      },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.purchaseReturn.findMany({
      where: { organizationId: org, invoice: { isNot: null } },
      include: { invoice: { select: { invoiceNumber: true } }, items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.supplier.findMany({ where: { organizationId: org }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { organizationId: org }, select: { id: true, name: true } }),
  ]);

  return { invoices, returns, suppliers, categories };
}

// ─── FINANCIAL ─────────────────────────────────────────────
export async function getProfitLossData(filters?: { startDate?: string; endDate?: string }) {
  const session = await requireSession();
  const org = session.organizationId;
  const dateWhere: any = {};
  if (filters?.startDate) dateWhere.gte = new Date(filters.startDate);
  if (filters?.endDate) dateWhere.lte = new Date(filters.endDate + 'T23:59:59');

  const salesWhere: any = { organizationId: org };
  const purchaseWhere: any = { organizationId: org };
  if (Object.keys(dateWhere).length) {
    salesWhere.invoiceDate = dateWhere;
    purchaseWhere.invoiceDate = dateWhere;
  }

  const [salesInvoices, purchaseInvoices, returns] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: salesWhere,
      include: { items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.purchaseInvoice.findMany({
      where: purchaseWhere,
      include: { items: true },
    }),
    prisma.customerReturn.findMany({
      where: { organizationId: org },
      include: { items: true },
    }),
  const totalSales = salesInvoices.reduce((s, i) => s + i.netAmount, 0);
  const totalCOGS = salesInvoices.reduce((s, inv) =>
    s + inv.items.reduce((is, item) => is + (item.purchasePrice * item.quantity), 0), 0);
  const totalReturns = returns.reduce((s, r) => s + r.totalAmount, 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + i.netAmount, 0);
  const grossProfit = totalSales - totalCOGS - totalReturns;
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  return {
    totalSales,
    totalCOGS,
    totalReturns,
    totalPurchases,
    grossProfit,
    grossMargin,
    salesInvoices,
    purchaseInvoices,
  };
}

export async function getCustomerAgingData() {
  const session = await requireSession();
  const org = session.organizationId;
  const now = new Date();

  const invoices = await prisma.salesInvoice.findMany({
    where: { organizationId: org, status: { in: ['UNPAID', 'PARTIAL'] } },
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { invoiceDate: 'asc' },
  });

  const customerMap = new Map<number, {
    id: number; name: string; phone: string;
    current: number; days30: number; days60: number; days90: number; over90: number; total: number;
  }>();

  for (const inv of invoices) {
    const due = inv.netAmount - inv.paidAmount;
    if (due <= 0) continue;
    const days = Math.floor((now.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24));
    const key = inv.customerId;
    const existing = customerMap.get(key) || {
      id: inv.customer.id, name: inv.customer.name, phone: inv.customer.phone || '',
      current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0,
    };
    if (days <= 30) existing.current += due;
    else if (days <= 60) existing.days30 += due;
    else if (days <= 90) existing.days60 += due;
    else existing.over90 += due;
    existing.total += due;
    customerMap.set(key, existing);
  }

  return { customers: Array.from(customerMap.values()).sort((a, b) => b.total - a.total) };
}

export async function getSupplierAgingData() {
  const session = await requireSession();
  const org = session.organizationId;
  const now = new Date();

  const invoices = await prisma.purchaseInvoice.findMany({
    where: { organizationId: org, status: { in: ['UNPAID', 'PARTIAL', 'RECEIVED'] } },
    include: { supplier: { select: { id: true, name: true, phone: true } } },
    orderBy: { invoiceDate: 'asc' },
  });

  const supplierMap = new Map<number, {
    id: number; name: string; phone: string;
    current: number; days30: number; days60: number; over90: number; total: number;
  }>();

  for (const inv of invoices) {
    const due = inv.netAmount - inv.paidAmount;
    if (due <= 0) continue;
    const days = Math.floor((now.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24));
    const key = inv.supplierId;
    const existing = supplierMap.get(key) || {
      id: inv.supplier.id, name: inv.supplier.name, phone: inv.supplier.phone || '',
      current: 0, days30: 0, days60: 0, over90: 0, total: 0,
    };
    if (days <= 30) existing.current += due;
    else if (days <= 60) existing.days30 += due;
    else if (days <= 90) existing.days60 += due;
    else existing.over90 += due;
    existing.total += due;
    supplierMap.set(key, existing);
  }

  return { suppliers: Array.from(supplierMap.values()).sort((a, b) => b.total - a.total) };
}

// ─── STOCK ─────────────────────────────────────────────────
export async function getStockReportData() {
  const session = await requireSession();
  const org = session.organizationId;

  const settings = await prisma.settings.findUnique({ where: { organizationId: org } });
  const lowStockThreshold = parseInt(settings?.alertStockThreshold || '10');
  const expiryAlertDays = parseInt(settings?.alertExpiryDays || '30');
  const expiryAlertDate = new Date();
  expiryAlertDate.setDate(expiryAlertDate.getDate() + expiryAlertDays);

  const stocks = await prisma.stock.findMany({
    where: { organizationId: org },
    include: {
      product: { select: { id: true, name: true, reorderLevel: true, purchasePrice: true, salePriceRetail: true, salePriceDistribution: true } },
      batch: { select: { batchNumber: true, expiryDate: true } },
      warehouse: { select: { name: true } },
    },
  });

  const totalInventoryValue = stocks.reduce((s, st) => s + (st.quantity * st.product.purchasePrice), 0);

  const lowStock = stocks.filter(st =>
    st.quantity <= Math.max(lowStockThreshold, st.product.reorderLevel)
  );

  const expiringSoon = stocks.filter(st =>
    st.batch.expiryDate && new Date(st.batch.expiryDate) <= expiryAlertDate && st.quantity > 0
  );

  const expired = stocks.filter(st =>
    st.batch.expiryDate && new Date(st.batch.expiryDate) < new Date() && st.quantity > 0
  );

  return { stocks, totalInventoryValue, lowStock, expiringSoon, expired };
}

// ─── AUDIT ─────────────────────────────────────────────────
export async function getAuditLogData(filters?: { startDate?: string; endDate?: string; action?: string }) {
  const session = await requireSession();
  const org = session.organizationId;
  const where: any = { organizationId: org };
  if (filters?.startDate) where.timestamp = { gte: new Date(filters.startDate) };
  if (filters?.endDate) where.timestamp = { ...(where.timestamp || {}), lte: new Date(filters.endDate + 'T23:59:59') };
  if (filters?.action && filters.action !== 'ALL') where.action = filters.action;

  const [logs, payments] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    }),
    prisma.payment.findMany({
      where: { organizationId: org },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
  ]);

  return { logs, payments };
}

export async function getReturnsData(filters?: { startDate?: string; endDate?: string }) {
  const session = await requireSession();
  const org = session.organizationId;
  const where: any = { organizationId: org };

  const [customerReturns, purchaseReturns] = await Promise.all([
    prisma.customerReturn.findMany({
      where,
      include: {
        invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { returnDate: 'desc' },
    }),
    prisma.purchaseReturn.findMany({
      where,
      include: {
        invoice: { select: { invoiceNumber: true, supplier: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { returnDate: 'desc' },
    }),
  ]);

  return { customerReturns, purchaseReturns };
}

export async function getOrganizationSettings() {
  const session = await requireSession();
  const org = session.organizationId;
  const [settings, organization] = await Promise.all([
    prisma.settings.findUnique({ where: { organizationId: org } }),
    prisma.organization.findUnique({ where: { id: org } }),
  ]);
  return { settings, organization };
}
