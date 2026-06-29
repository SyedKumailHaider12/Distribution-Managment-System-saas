'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Eye, FileText, Printer, Download, CreditCard, RotateCcw, X, Trash2, Package, CheckCircle2, ShoppingCart, User as UserIcon, Save, Receipt } from 'lucide-react';
import { createSalesInvoice, getProductsWithStock, deleteSalesInvoice, recordSalesPayment } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SearchableProductDropdown } from '@/components/SearchableProductDropdown';

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  saleType: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  status: string;
  customer: {
    id: number;
    name: string;
    isWalkIn: boolean;
  };
  salesman?: { name: string } | null;
}

interface Salesman { id: number; name: string; employee: { name: string } }
interface Customer { id: number; name: string; type: string; isWalkIn: boolean }
interface Warehouse { id: number; name: string }
interface Product { 
  id: number; 
  name: string;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  salePriceRetail: number;
  salePriceDistribution: number;
  totalStock?: number;
  batches?: any[];
}

export function SalesClient({
  initialInvoices,
  salesmen = [],
  customers = [],
  warehouses = [],
  products: initialProducts = []
}: {
  initialInvoices: Invoice[];
  salesmen?: Salesman[];
  customers?: Customer[];
  warehouses?: Warehouse[];
  products?: any[];
  settings?: any;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const { symbol } = useCurrency();
  const router = useRouter();

  // New Sale Form State
  const [saleData, setSaleData] = useState({
    saleType: 'retail' as 'retail' | 'distribution',
    customerId: '',
    warehouseId: warehouses[0]?.id?.toString() || '',
    salesmanId: '',
    paymentMethod: 'CASH',
    isCredit: false,
    discount: '0',
    discountType: 'flat' as 'flat' | 'percentage'
  });
  
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [items, setItems] = useState<any[]>([]);
  const [paidAmount, setPaidAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    invoiceId: 0,
    invoiceNumber: '',
    maxAmount: 0,
    amount: '',
    method: 'CASH',
    isSubmitting: false
  });

  // Auto-select Walk-in Customer for Retail
  useEffect(() => {
    if (saleData.saleType === 'retail' && viewMode === 'form') {
      const walkIn = customers.find(c => c.isWalkIn);
      if (walkIn) {
        setSaleData(prev => ({ ...prev, customerId: walkIn.id.toString() }));
      }
    } else if (saleData.saleType === 'distribution' && viewMode === 'form') {
      const currentCust = customers.find(c => c.id.toString() === saleData.customerId);
      if (currentCust?.isWalkIn) {
        setSaleData(prev => ({ ...prev, customerId: '' }));
      }
    }
  }, [saleData.saleType, viewMode, customers]);

  // Fetch stock when warehouse changes
  useEffect(() => {
    async function fetchStock() {
      if (!saleData.warehouseId || viewMode !== 'form') return;
      setIsLoadingStock(true);
      try {
        const data = await getProductsWithStock(parseInt(saleData.warehouseId));
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch stock:", err);
      } finally {
        setIsLoadingStock(false);
      }
    }
    fetchStock();
  }, [saleData.warehouseId, viewMode]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = !searchTerm ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = !customerFilter || inv.customer.name === customerFilter;
    const matchesType = !saleTypeFilter || inv.saleType === saleTypeFilter;
    return matchesSearch && matchesCustomer && matchesType;
  });

  const formatDate = (date: Date) => new Date(date).toLocaleDateString();

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED' || status === 'PAID') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Paid</span>;
    if (status === 'PARTIAL') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Partial</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Pending</span>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'retail') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Retail</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Distribution</span>;
  };

  const calculateItemSubtotal = (item: any) => {
    const qty = Number(item.quantity) || 0;
    return qty * (Number(item.salePrice) || 0);
  };

  const calculateGrossTotal = () => items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const calculateNetAmount = () => {
    const gross = calculateGrossTotal();
    const discValue = parseFloat(saleData.discount) || 0;
    const disc = saleData.discountType === 'percentage' ? (gross * discValue) / 100 : discValue;
    return gross - disc;
  };

  // Keep paid amount locked to net amount in retail mode
  useEffect(() => {
    if (saleData.saleType === 'retail') {
      setPaidAmount(calculateNetAmount().toString());
    }
  }, [items, saleData.discount, saleData.saleType]);

  const addItemRow = () => {
    setItems([...items, { id: Date.now(), productId: '', batchId: '', quantity: 1, salePrice: 0, availableStock: 0 }]);
  };

  const removeItemRow = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const prod = products.find(p => p.id.toString() === value);
          
          // FEFO: Sort batches by expiry date
          const sortedBatches = prod?.batches ? [...prod.batches].sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          }) : [];

          const defaultBatch = sortedBatches[0];
          const price = saleData.saleType === 'retail' 
            ? prod?.salePriceRetail 
            : prod?.salePriceDistribution;

          return { 
            ...item, 
            [field]: value, 
            batchId: defaultBatch?.id?.toString() || '',
            salePrice: price || 0,
            availableStock: defaultBatch?.quantity || 0,
            batches: sortedBatches
          };
        }
        
        if (field === 'batchId') {
          const selectedBatch = item.batches?.find((b: any) => b.id.toString() === value);
          return { ...item, [field]: value, availableStock: selectedBatch?.quantity || 0 };
        }

        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleNewSale = () => {
    router.push('/sales/new');
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!window.confirm('Delete this invoice? This will restore stock and reverse ledger entries.')) return;
    try {
      const result = await deleteSalesInvoice(invoiceId);
      if (result.success) {
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
        alert('Invoice deleted successfully');
      } else {
        alert('Failed to delete invoice: ' + result.error);
      }
    } catch (error) {
      alert('Error deleting invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModal.amount || Number(paymentModal.amount) <= 0) return alert('Invalid amount');
    if (Number(paymentModal.amount) > paymentModal.maxAmount) return alert('Amount exceeds outstanding balance');
    
    setPaymentModal(p => ({ ...p, isSubmitting: true }));
    const res = await recordSalesPayment(paymentModal.invoiceId, Number(paymentModal.amount), paymentModal.method);
    
    if (res.success) {
      alert('Payment recorded successfully');
      setInvoices(invoices.map(inv => inv.id === paymentModal.invoiceId ? { ...inv, paidAmount: res.result?.newPaidAmount || inv.paidAmount, status: res.result?.newStatus || inv.status } : inv));
      setPaymentModal(p => ({ ...p, isOpen: false, isSubmitting: false, amount: '' }));
    } else {
      alert(res.error || 'Failed to record payment');
      setPaymentModal(p => ({ ...p, isSubmitting: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    if (!saleData.customerId && saleData.saleType === 'distribution') {
      alert("Please select a customer.");
      return;
    }
    if (items.some(it => !it.productId || !it.batchId || it.quantity <= 0)) {
      alert("Please ensure all items have a product, batch, and valid quantity.");
      return;
    }

    if (items.some(it => it.quantity > it.availableStock)) {
      alert("Some items exceed available stock!");
      return;
    }

    setIsSubmitting(true);
    try {
      const grossTotal = calculateGrossTotal();
      const discValue = parseFloat(saleData.discount) || 0;
      const discountAmount = saleData.discountType === 'percentage' ? (grossTotal * discValue) / 100 : discValue;
      
      const result = await createSalesInvoice({
        customerId: parseInt(saleData.customerId),
        salesmanId: saleData.salesmanId ? parseInt(saleData.salesmanId) : 0,
        warehouseId: parseInt(saleData.warehouseId),
        branchId: 1, 
        saleType: saleData.saleType,
        items: items.map(it => ({
          productId: parseInt(it.productId),
          batchId: parseInt(it.batchId),
          quantity: parseInt(it.quantity),
          salePrice: parseFloat(it.salePrice)
        })),
        discount: discountAmount,
        paymentMethod: saleData.paymentMethod,
        amountTendered: parseFloat(paidAmount)
      });

      setSuccess(true);
      
      if (saleData.saleType === 'retail') {
        setPrintData({
          invoiceNumber: result.invoice?.invoiceNumber || 'N/A',
          date: new Date().toLocaleString(),
          items: items.map(it => {
            const prod = products.find(p => p.id.toString() === it.productId);
            return { name: prod?.name || 'Product', qty: it.quantity, price: it.salePrice, subtotal: calculateItemSubtotal(it) };
          }),
          grossTotal: calculateGrossTotal(),
          discount: parseFloat(saleData.discount),
          netTotal: calculateNetAmount(),
          paidAmount: calculateNetAmount(),
          settings: {}
        });
        
        setTimeout(() => {
          window.print();
          setSuccess(false);
          setViewMode('list');
          window.location.reload();
        }, 500);
      } else {
        setTimeout(() => { 
          setSuccess(false); 
          setViewMode('list');
          window.location.reload(); 
        }, 2000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCustomerFilter('');
    setSaleTypeFilter('');
  };

  const availableCustomers = useMemo(() => {
    if (saleData.saleType === 'retail') {
      return customers; // Shows Walk-in too
    }
    return customers.filter(c => !c.isWalkIn);
  }, [customers, saleData.saleType]);

  // ===== FORM VIEW =====
  if (viewMode === 'form') {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-indigo-600" /> New Sale Invoice
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {saleData.saleType === 'retail' ? 'POS style retail sale' : 'Wholesale distribution order'}
            </p>
          </div>
          <button onClick={() => setViewMode('list')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors">
            ← Back to List
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSaleData({ ...saleData, saleType: 'retail' })}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${saleData.saleType === 'retail' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <UserIcon className="w-4 h-4" /> Retail (POS)
          </button>
          <button
            onClick={() => setSaleData({ ...saleData, saleType: 'distribution' })}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${saleData.saleType === 'distribution' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Package className="w-4 h-4" /> Distribution
          </button>
        </div>

        {success && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Sale Invoice saved successfully!</p>
          </motion.div>
        )}

        {/* Sale Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Customer *</label>
              <select
                value={saleData.customerId}
                onChange={e => setSaleData({ ...saleData, customerId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                disabled={saleData.saleType === 'retail'}
              >
                <option value="">Select Customer</option>
                {availableCustomers.map(c => <option key={c.id} value={c.id}>{c.name} {c.isWalkIn ? '(Walk-in)' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Warehouse *</label>
              <select
                value={saleData.warehouseId}
                onChange={e => setSaleData({ ...saleData, warehouseId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Salesman</label>
              <select
                value={saleData.salesmanId}
                onChange={e => setSaleData({ ...saleData, salesmanId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Salesman</option>
                {salesmen.map(s => <option key={s.id} value={s.id}>{s.employee?.name || s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Payment Method</label>
              <select
                value={saleData.paymentMethod}
                onChange={e => setSaleData({ ...saleData, paymentMethod: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CARD">Card Payment</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Invoice Items</h2>
            </div>
            <button 
              onClick={addItemRow} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Batch Selection (FEFO)</th>
                  <th className="px-6 py-4 w-28">Quantity</th>
                  <th className="px-6 py-4 w-32">Unit Price</th>
                  <th className="px-6 py-4 w-32 text-right">Subtotal</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-base font-medium">Your cart is empty</p>
                        <p className="text-sm mt-1">Start by adding products to this sale</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <SearchableProductDropdown
                            products={products}
                            value={item.productId}
                            onChange={(value) => handleItemChange(item.id, 'productId', value)}
                            placeholder="Search product..."
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                            value={item.batchId}
                            disabled={!item.productId}
                            onChange={(e) => handleItemChange(item.id, 'batchId', e.target.value)}
                          >
                            <option value="">Select Batch...</option>
                            {item.batches?.map((b: any) => (
                              <option key={b.id} value={b.id}>
                                {b.batchNumber} (Exp: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'No Exp'}) - Qty: {b.quantity}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input 
                              type="number" 
                              min="1" 
                              max={item.availableStock}
                              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 ${item.quantity > item.availableStock ? 'text-red-500 border-red-500' : ''}`} 
                              value={item.quantity} 
                              onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} 
                            />
                            {item.productId && (
                              <span className="absolute -top-5 left-0 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Max: {item.availableStock}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                            value={item.salePrice} 
                            onChange={(e) => handleItemChange(item.id, 'salePrice', e.target.value)} 
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white text-base">
                          {symbol}{calculateItemSubtotal(item).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => removeItemRow(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-col lg:flex-row gap-8 lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Gross Total</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{symbol}{calculateGrossTotal().toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Discount</p>
                  <div className="flex gap-2">
                    <select 
                      value={saleData.discountType} 
                      onChange={(e) => setSaleData({ ...saleData, discountType: e.target.value as 'flat' | 'percentage' })}
                      className="w-20 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="flat">{symbol}</option>
                      <option value="percentage">%</option>
                    </select>
                    <input 
                      type="number" 
                      className="w-24 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" 
                      value={saleData.discount} 
                      onChange={(e) => setSaleData({ ...saleData, discount: e.target.value })} 
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Payable</p>
                  <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{symbol}{calculateNetAmount().toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                    <input 
                      type="number" 
                      disabled={saleData.saleType === 'retail'}
                      className={`w-full sm:w-44 pl-8 pr-4 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl text-lg font-black transition-colors ${saleData.saleType === 'retail' ? 'border-slate-200 text-slate-400 cursor-not-allowed opacity-70' : 'border-indigo-500/20 dark:border-indigo-500/10 text-emerald-600'}`} 
                      value={paidAmount} 
                      onChange={(e) => setPaidAmount(e.target.value)} 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || items.length === 0} 
                  className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <RotateCcw className="w-6 h-6 animate-spin" /> : (saleData.saleType === 'retail' ? <Printer className="w-6 h-6" /> : <Save className="w-6 h-6" />)}
                  {isSubmitting ? 'Processing...' : (saleData.saleType === 'retail' ? 'Complete & Print' : 'Complete Sale')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 80mm Thermal Receipt (Hidden except during print) */}
        {printData && (
          <div className="hidden print:block fixed inset-0 bg-white text-black z-50 p-2" style={{ width: '80mm', fontSize: '12px', fontFamily: 'monospace' }}>
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">{printData.settings?.companyName || 'AzanTech DMS'}</h1>
              <p className="text-xs">{printData.settings?.companyAddress || ''}</p>
              <p className="text-xs">{printData.settings?.companyPhone || ''}</p>
              <p className="text-xs mt-2 border-b border-black pb-2 border-dashed">RETAIL INVOICE</p>
            </div>
            
            <div className="mb-4">
              <p>Invoice: {printData.invoiceNumber}</p>
              <p>Date: {printData.date}</p>
            </div>

            <table className="w-full mb-4 text-left">
              <thead>
                <tr className="border-b border-black border-dashed">
                  <th className="py-1 w-1/2">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {printData.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-1 pr-1 truncate">{item.name}</td>
                    <td className="py-1 text-center">{item.qty}</td>
                    <td className="py-1 text-right">{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-black border-dashed pt-2 space-y-1 text-sm font-bold">
              <div className="flex justify-between">
                <span>Gross Total:</span>
                <span>{symbol} {printData.grossTotal.toFixed(2)}</span>
              </div>
              {printData.discount > 0 && (
                <div className="flex justify-between font-normal text-xs">
                  <span>Discount:</span>
                  <span>- {symbol} {printData.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base">
                <span>Net Total:</span>
                <span>{symbol} {printData.netTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 text-center border-t border-black border-dashed pt-4">
              <p>Thank you for your business!</p>
              <p className="text-[10px] mt-2">Powered by AzanTech DMS</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" /> Sales Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">History of all retail and distribution transactions</p>
        </div>
        <button onClick={handleNewSale} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
          <Plus className="w-4 h-4" /> New Sale Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by invoice #, customer name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
          <div>
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <select value={saleTypeFilter} onChange={(e) => setSaleTypeFilter(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="">All Sale Types</option>
              <option value="retail">Retail</option>
              <option value="distribution">Distribution</option>
            </select>
          </div>
          <button onClick={clearFilters} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg">Clear Filters</button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Salesman</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Net Amount</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No sales records found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(inv.invoiceDate)}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {inv.customer.name} {inv.customer.isWalkIn && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-1">Walk-in</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{inv.salesman?.name || '-'}</td>
                      <td className="px-6 py-4">{getTypeBadge(inv.saleType)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">{symbol}{inv.netAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">{symbol}{inv.paidAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {inv.paidAmount < inv.netAmount && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentModal({
                                  isOpen: true,
                                  invoiceId: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  maxAmount: inv.netAmount - inv.paidAmount,
                                  amount: '',
                                  method: 'CASH',
                                  isSubmitting: false
                                });
                              }}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Record Payment"
                            >
                              <Receipt size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                handleDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {paymentModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => !paymentModal.isSubmitting && setPaymentModal(p => ({ ...p, isOpen: false }))}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500" /> Record Payment</h2>
                <button onClick={() => !paymentModal.isSubmitting && setPaymentModal(p => ({ ...p, isOpen: false }))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-xl text-sm border border-indigo-100 dark:border-indigo-800/50">
                  Recording payment for Invoice <b>#{paymentModal.invoiceNumber}</b>. <br/>
                  Outstanding balance: <b className="text-emerald-600 dark:text-emerald-400">{symbol}{(paymentModal.maxAmount).toFixed(2)}</b>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                    <input 
                      type="number" 
                      max={paymentModal.maxAmount} 
                      className="w-full pl-8 pr-4 py-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 font-bold" 
                      value={paymentModal.amount} 
                      onChange={e => setPaymentModal({...paymentModal, amount: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 font-medium" 
                    value={paymentModal.method} 
                    onChange={e => setPaymentModal({...paymentModal, method: e.target.value})}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CARD">Card Payment</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button 
                  onClick={() => setPaymentModal({...paymentModal, isOpen: false})} 
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  disabled={paymentModal.isSubmitting} 
                  onClick={handleRecordPayment} 
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {paymentModal.isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}