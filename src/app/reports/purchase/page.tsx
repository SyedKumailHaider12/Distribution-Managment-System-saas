import { prisma } from '@/lib/prisma';

export default async function PurchaseReportPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [todayPurchases, monthPurchases, yearPurchases] = await Promise.all([
    prisma.purchaseInvoice.aggregate({
      where: {
        invoiceDate: { gte: today },
        status: { not: 'CANCELLED' },
      },
      _sum: { netAmount: true },
      _count: true,
    }),
    prisma.purchaseInvoice.aggregate({
      where: {
        invoiceDate: { gte: startOfMonth },
        status: { not: 'CANCELLED' },
      },
      _sum: { netAmount: true },
      _count: true,
    }),
    prisma.purchaseInvoice.aggregate({
      where: {
        invoiceDate: { gte: startOfYear },
        status: { not: 'CANCELLED' },
      },
      _sum: { netAmount: true },
      _count: true,
    }),
  ]);

  // Get purchases by supplier
  const suppliers = await prisma.supplier.findMany({
    include: {
      purchaseInvoices: {
        where: {
          invoiceDate: { gte: startOfMonth },
          status: { not: 'CANCELLED' },
        },
        select: { netAmount: true },
      },
    },
  });

  const supplierPurchases = suppliers
    .map((s) => ({
      name: s.name,
      amount: s.purchaseInvoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0),
    }))
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Get total stock value
  const stocks = await prisma.stock.findMany({
    include: {
      product: true,
      batch: true,
    },
  });

  let totalStockValue = 0;
  for (const stock of stocks) {
    totalStockValue += stock.quantity * (stock.batch.purchasePrice || stock.product.purchasePrice);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Purchase Reports</h1>
        <p className="text-slate-400 mt-1">Analyze purchase and inventory costs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl">
          <p className="text-sm text-amber-400">Today</p>
          <p className="text-3xl font-bold text-white mt-1">
            ${(todayPurchases._sum.netAmount || 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">{todayPurchases._count || 0} invoices</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl">
          <p className="text-sm text-orange-400">This Month</p>
          <p className="text-3xl font-bold text-white mt-1">
            ${(monthPurchases._sum.netAmount || 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">{monthPurchases._count || 0} invoices</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl">
          <p className="text-sm text-red-400">This Year</p>
          <p className="text-3xl font-bold text-white mt-1">
            ${(yearPurchases._sum.netAmount || 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">{yearPurchases._count || 0} invoices</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl">
          <p className="text-sm text-blue-400">Stock Value</p>
          <p className="text-3xl font-bold text-white mt-1">${totalStockValue.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Current inventory</p>
        </div>
      </div>

      {/* Purchases by Supplier */}
      <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Top Suppliers (This Month)</h3>
        <div className="space-y-3">
          {supplierPurchases.length === 0 ? (
            <p className="text-slate-400">No purchases this month</p>
          ) : (
            supplierPurchases.map((supplier, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">{supplier.name}</span>
                </div>
                <span className="text-white font-medium">${supplier.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}