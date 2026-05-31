'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function getDashboardOutstandingData() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const organizationId = session.organizationId;

  // Fetch all partial or unpaid invoices
  const invoices = await prisma.purchaseInvoice.findMany({
    where: {
      organizationId,
      status: { in: ['UNPAID', 'PARTIAL', 'RECEIVED'] }
    },
    include: {
      supplier: {
        include: {
          supplierCompany: true
        }
      }
    }
  });

  let totalOutstanding = 0;
  const supplierMap = new Map();

  for (const inv of invoices) {
    const due = inv.netAmount - inv.paidAmount;
    if (due > 0) {
      totalOutstanding += due;
      const key = inv.supplierId;
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          supplierId: key,
          supplierName: inv.supplier.name,
          companyName: (inv.supplier as any).supplierCompany?.name || 'N/A',
          phone: inv.supplier.phone || '',
          totalDue: 0,
          invoiceCount: 0
        });
      }
      const data = supplierMap.get(key);
      data.totalDue += due;
      data.invoiceCount += 1;
    }
  }

  return {
    totalOutstanding,
    suppliersOutstanding: Array.from(supplierMap.values())
  };
}
