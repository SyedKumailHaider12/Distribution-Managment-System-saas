'use server'

import { prisma } from '@/lib/prisma'
import { requirePermissionForAction } from '@/lib/authorization'

export async function getDashboardKPIs() {
  const session = await requirePermissionForAction('dashboard');
  const org = session.organizationId;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [alertDaysStr, organizationData] = await Promise.all([
    prisma.settings.findUnique({ where: { organizationId: org }, select: { alertStockThreshold: true, alertExpiryDays: true } }),
    prisma.organization.findUnique({ where: { id: org }, select: { name: true, subscriptionStatus: true, trialEndsAt: true, subscriptionEndsAt: true } })
  ]);
  const lowStockThreshold = parseInt(alertDaysStr?.alertStockThreshold || '10');
  const expiryDays = parseInt(alertDaysStr?.alertExpiryDays || '30');
  const expiryDate = new Date(now.getTime() + expiryDays * 86400000);

  const [todaySales, monthSales, totalCustomers, lowStockCount, expiringCount] = await Promise.all([
    prisma.salesInvoice.aggregate({
      where: { organizationId: org, invoiceDate: { gte: todayStart } },
      _sum: { netAmount: true },
    }),
    prisma.salesInvoice.aggregate({
      where: { organizationId: org, invoiceDate: { gte: monthStart } },
      _sum: { netAmount: true },
    }),
    prisma.customer.count({
      where: { organizationId: org, isWalkIn: false },
    }),
    prisma.stock.count({
      where: {
        organizationId: org,
        quantity: { lte: lowStockThreshold },
      },
    }),
    prisma.batch.count({
      where: {
        organizationId: org,
        expiryDate: { gte: now, lte: expiryDate },
      },
    }),
  ]);

  return {
    todaySales: todaySales._sum.netAmount || 0,
    monthSales: monthSales._sum.netAmount || 0,
    totalCustomers,
    lowStock: lowStockCount,
    expiring: expiringCount,
    organizationName: organizationData?.name || 'Unknown',
    subscriptionStatus: organizationData?.subscriptionStatus || 'TRIAL',
    trialEndsAt: organizationData?.trialEndsAt,
    subscriptionEndsAt: organizationData?.subscriptionEndsAt,
  };
}

export async function getDashboardOutstandingData() {
  const session = await requirePermissionForAction('dashboard');
  const organizationId = session.organizationId;

  const invoices = await prisma.purchaseInvoice.findMany({
    where: { organizationId, status: { in: ['UNPAID', 'PARTIAL', 'RECEIVED'] } },
    include: { supplier: { include: { supplierCompany: true } } }
  });

  let totalOutstanding = 0;
  const supplierMap = new Map();
  for (const inv of invoices) {
    const due = inv.netAmount - inv.paidAmount;
    if (due > 0) {
      totalOutstanding += due;
      const key = inv.supplierId;
      if (!supplierMap.has(key)) {
        supplierMap.set(key, { supplierId: key, supplierName: inv.supplier.name, companyName: (inv.supplier as any).supplierCompany?.name || 'N/A', phone: inv.supplier.phone || '', totalDue: 0, invoiceCount: 0 });
      }
      const data = supplierMap.get(key);
      data.totalDue += due;
      data.invoiceCount += 1;
    }
  }
  return { totalOutstanding, suppliersOutstanding: Array.from(supplierMap.values()) };
}

export async function getDashboardReceivablesData() {
  const session = await requirePermissionForAction('dashboard');
  const organizationId = session.organizationId;

  const salesInvoices = await prisma.salesInvoice.findMany({
    where: { organizationId, saleType: 'distribution', status: { in: ['UNPAID', 'PARTIAL'] } },
    include: { customer: true }
  });

  let totalReceivables = 0;
  const customerMap = new Map();
  for (const inv of salesInvoices) {
    const due = inv.netAmount - inv.paidAmount;
    if (due > 0) {
      totalReceivables += due;
      const key = inv.customerId;
      if (!customerMap.has(key)) {
        customerMap.set(key, { customerId: key, customerName: inv.customer.name, phone: inv.customer.phone || '', address: inv.customer.address || '', totalDue: 0, invoiceCount: 0 });
      }
      const data = customerMap.get(key);
      data.totalDue += due;
      data.invoiceCount += 1;
    }
  }
  return { totalReceivables, customersReceivables: Array.from(customerMap.values()) };
}
