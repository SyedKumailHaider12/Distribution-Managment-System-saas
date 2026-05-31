import { prisma } from '@/lib/prisma';

export default async function StockReportPage() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get all stock with values
  const stocks = await prisma.stock.findMany({
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
  });

  // Calculate stock value by warehouse
  const warehouseStock: Record<number, { name: string; value: number; quantity: number }> = {};
  let totalValue = 0;
  let totalQuantity = 0;

  for (const stock of stocks) {
    const value = stock.quantity * (stock.batch.purchasePrice || stock.product.purchasePrice);
    totalValue += value;
    totalQuantity += stock.quantity;

    if (!warehouseStock[stock.warehouseId]) {
      warehouseStock[stock.warehouseId] = { name: stock.warehouse.name, value: 0, quantity: 0 };
    }
    warehouseStock[stock.warehouseId].value += value;
    warehouseStock[stock.warehouseId].quantity += stock.quantity;
  }

  // Get low stock products
  const products = await prisma.product.findMany({
    include: { stocks: true },
  });

  const lowStock = products
    .map((p) => ({
      name: p.name,
      category: p.category?.name,
      brand: p.brand?.name,
      currentStock: p.stocks.reduce((sum, s) => sum + s.quantity, 0),
      reorderLevel: p.reorderLevel,
    }))
    .filter((p) => p.currentStock < p.reorderLevel);

  // Get expiring batches
  const expiringBatches = await prisma.batch.findMany({
    where: {
      expiryDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    include: {
      product: true,
      stocks: {
        include: { warehouse: true },
      },
    },
  });

  // Get expired batches
  const expiredBatches = await prisma.batch.findMany({
    where: {
      expiryDate: { lt: now },
    },
    include: {
      product: true,
      stocks: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Stock Reports</h1>
        <p className="text-slate-400 mt-1">Inventory analysis and alerts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl">
          <p className="text-sm text-emerald-400">Total Stock Value</p>
          <p className="text-3xl font-bold text-white mt-1">${totalValue.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl">
          <p className="text-sm text-blue-400">Total Units</p>
          <p className="text-3xl font-bold text-white mt-1">{totalQuantity.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl">
          <p className="text-sm text-amber-400">Low Stock Items</p>
          <p className="text-3xl font-bold text-white mt-1">{lowStock.length}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl">
          <p className="text-sm text-red-400">Expiring Soon</p>
          <p className="text-3xl font-bold text-white mt-1">{expiringBatches.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Warehouse */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Stock by Warehouse</h3>
          <div className="space-y-3">
            {Object.values(warehouseStock).map((warehouse, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-slate-300">{warehouse.name}</span>
                <div className="text-right">
                  <p className="text-white font-medium">${warehouse.value.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{warehouse.quantity} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-slate-400">All products are well stocked</p>
            ) : (
              lowStock.slice(0, 10).map((product, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-xs text-slate-400">
                      {product.brand} • {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">{product.currentStock}</p>
                    <p className="text-xs text-slate-400">Min: {product.reorderLevel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiring Batches */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Expiring Soon (30 days)</h3>
          <div className="space-y-3">
            {expiringBatches.length === 0 ? (
              <p className="text-slate-400">No batches expiring soon</p>
            ) : (
              expiringBatches.slice(0, 10).map((batch, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{batch.product.name}</p>
                    <p className="text-xs text-slate-400">
                      {batch.batchNumber} •{' '}
                      {batch.expiryDate
                        ? new Date(batch.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">
                      {batch.stocks.reduce((sum, s) => sum + s.quantity, 0)}
                    </p>
                    <p className="text-xs text-slate-400">units</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expired Batches */}
        <div className="p-6 bg-slate-800/50 border border-red-500/30 rounded-2xl">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Expired Batches</h3>
          <div className="space-y-3">
            {expiredBatches.length === 0 ? (
              <p className="text-slate-400">No expired batches</p>
            ) : (
              expiredBatches.slice(0, 10).map((batch, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{batch.product.name}</p>
                    <p className="text-xs text-slate-400">{batch.batchNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold">
                      {batch.stocks.reduce((sum, s) => sum + s.quantity, 0)}
                    </p>
                    <p className="text-xs text-slate-400">units</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}