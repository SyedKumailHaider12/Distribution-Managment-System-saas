'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Calculator, CreditCard, Banknote, Wallet, X, Save, Printer } from 'lucide-react';
import { createSalesInvoice, getCustomersForSale, getWalkInCustomer, getSalesmen, getWarehouses, getProductsWithStock } from '../actions';
import { useAuth } from '@/components/AuthProvider';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Product {
  id: number;
  name: string;
  barcode: string;
  salePriceRetail: number;
  salePriceDistribution: number;
  reorderLevel: number;
  brand?: { name: string };
  category?: { name: string };
  totalStock: number;
  batches: Batch[];
}

interface Batch {
  id: number;
  batchNumber: string;
  expiryDate: Date | null;
  quantity: number;
}

interface SaleItem {
  productId: number;
  productName: string;
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  salePrice: number;
  availableStock: number;
}

interface Customer {
  id: number;
  name: string;
  isWalkIn: boolean;
}

interface Salesman {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { symbol } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [saleType, setSaleType] = useState<'retail' | 'distribution'>('retail');

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState(0);

  // Search
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<{ product: Product; batch: Batch } | null>(null);

  const loadProducts = async (warehouseId: number) => {
    const prods = await getProductsWithStock(warehouseId);
    setProducts(prods);
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [custData, walkIn, salesData, warehouseData] = await Promise.all([
        getCustomersForSale(),
        getWalkInCustomer(),
        getSalesmen(),
        getWarehouses(1), // Default branch
      ]);

      setCustomers([...(walkIn ? [walkIn] : []), ...custData]);
      setSalesmen(salesData);

      if (warehouseData.length > 0) {
        setSelectedWarehouseId(warehouseData[0].id);
        loadProducts(warehouseData[0].id);
      }

      // Set default customer to walk-in
      if (walkIn) {
        setSelectedCustomerId(walkIn.id);
      }
    }

    loadData();
  }, []);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.salePrice, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const total = subtotal - discountAmount;
  const change = amountTendered - total;

  // Add item to sale
  const addItem = useCallback(() => {
    if (!selectedBatch || !selectedWarehouseId) return;

    const { product, batch } = selectedBatch;

    // Check if already added
    const existingIndex = items.findIndex(
      (item) => item.productId === product.id && item.batchId === batch.id
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      const maxQty = newItems[existingIndex].availableStock - newItems[existingIndex].quantity;
      if (maxQty > 0) {
        newItems[existingIndex].quantity += 1;
        setItems(newItems);
      }
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A',
        quantity: 1,
        salePrice: saleType === 'retail' ? product.salePriceRetail : product.salePriceDistribution,
        availableStock: batch.quantity,
      };
      setItems([...items, newItem]);
    }

    setSelectedBatch(null);
    setProductSearch('');
    setShowProductSearch(false);
  }, [selectedBatch, items, saleType, selectedWarehouseId]);

  // Update quantity
  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    const maxQty = items[index].availableStock;
    if (qty > maxQty) qty = maxQty;

    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit sale
  const handleSubmit = async () => {
    if (!selectedCustomerId || !selectedWarehouseId || items.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const saleItems = items.map((item) => ({
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        salePrice: item.salePrice,
      }));

      await createSalesInvoice({
        customerId: selectedCustomerId,
        salesmanId: selectedSalesmanId || undefined,
        warehouseId: selectedWarehouseId,
        branchId: 1, // Default branch
        saleType,
        items: saleItems,
        discount: discountAmount,
        paymentMethod,
        amountTendered: total > 0 ? amountTendered : 0,
      });

      router.push('/sales');
    } catch (error: any) {
      alert(error.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  // Filter products for search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">New Sale</h1>
          <p className="text-slate-400 mt-1">Create a new sales invoice</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSaleType('retail')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              saleType === 'retail'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Retail
          </button>
          <button
            onClick={() => setSaleType('distribution')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              saleType === 'distribution'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Distribution
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Salesman Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Customer</label>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isWalkIn ? '(Walk-in)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Salesman (Optional)</label>
              <select
                value={selectedSalesmanId || ''}
                onChange={(e) => setSelectedSalesmanId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
              >
                <option value="">No Salesman</option>
                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Warehouse</label>
              <select
                value={selectedWarehouseId || ''}
                onChange={(e) => {
                  setSelectedWarehouseId(Number(e.target.value));
                  loadProducts(Number(e.target.value));
                }}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Search */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name or barcode..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setShowProductSearch(!showProductSearch)}
                className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white hover:bg-slate-700"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Product Search Results */}
            {showProductSearch && productSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl max-h-80 overflow-y-auto z-50">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No products found</div>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="p-3 border-b border-slate-700 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-xs text-slate-400">
                            {product.brand?.name} • {product.category?.name}
                          </p>
                          <p className="text-xs text-slate-500">Stock: {product.totalStock}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-medium">
                            {symbol}{saleType === 'retail' ? product.salePriceRetail : product.salePriceDistribution}
                          </p>
                          {product.totalStock > 0 ? (
                            <button
                              onClick={() => {
                                if (product.batches.length > 0) {
                                  setSelectedBatch({ product, batch: product.batches[0] });
                                  addItem();
                                }
                              }}
                              className="mt-1 px-2 py-1 bg-indigo-500 text-white text-xs rounded"
                            >
                              Add
                            </button>
                          ) : (
                            <span className="text-xs text-red-400">Out of stock</span>
                          )}
                        </div>
                      </div>
                      {product.batches.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {product.batches.map((batch) => (
                            <button
                              key={batch.id}
                              onClick={() => {
                                setSelectedBatch({ product, batch });
                                addItem();
                              }}
                              className="px-2 py-0.5 bg-slate-700 text-xs text-slate-300 rounded hover:bg-indigo-500 hover:text-white"
                            >
                              {batch.batchNumber} ({batch.quantity})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sale Items Table */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Expiry</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Add products to start a sale
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={`${item.productId}-${item.batchId}`}>
                      <td className="px-4 py-3">
                        <p className="text-white">{item.productName}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{item.batchNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{item.expiryDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-7 h-7 bg-slate-700 rounded text-white hover:bg-slate-600"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= item.availableStock}
                            className="w-7 h-7 bg-slate-700 rounded text-white hover:bg-slate-600 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-white">{symbol}{item.salePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {symbol}{(item.quantity * item.salePrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Summary */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-6 sticky top-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator size={24} />
              Sale Summary
            </h2>

            {/* Subtotal */}
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white">{symbol}{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Discount</label>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">{symbol}</option>
                </select>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                />
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-400 mt-2">
                  <span>Discount Amount</span>
                  <span className="text-red-400">-{symbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between text-xl font-bold">
              <span className="text-white">Total</span>
              <span className="text-emerald-400">{symbol}{total.toFixed(2)}</span>
            </div>

            {/* Payment */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CARD', 'BANK'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === method
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method === 'CASH' && <Banknote size={20} />}
                    {method === 'CARD' && <CreditCard size={20} />}
                    {method === 'BANK' && <Wallet size={20} />}
                    <span className="text-xs">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Tendered */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Amount Tendered</label>
              <input
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-lg font-medium"
                min="0"
                step="0.01"
              />
              {amountTendered > 0 && (
                <div className="flex justify-between mt-2">
                  <span className="text-slate-400">Change</span>
                  <span className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {symbol}{change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={loading || items.length === 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </button>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 flex items-center justify-center gap-2">
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}