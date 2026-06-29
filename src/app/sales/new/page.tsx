'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Calculator, CreditCard, Banknote, Wallet, Save, Printer, FolderOpen } from 'lucide-react';
import { createSalesInvoice, getCustomersForSale, getWalkInCustomer, getSalesmen, getWarehouses, getProductsWithStock, saveDraftSale, getDraftSales, getDraftSaleById, deleteDraftSale, getSalesInvoiceById } from '../actions';
import { useAuth } from '@/components/AuthProvider';
import { useCurrency } from '@/contexts/CurrencyContext';
import ProductAutocomplete from '@/components/ProductAutocomplete';
import BarcodeInput from '@/components/BarcodeInput';
import RetailThermalSlip from '@/components/print/RetailThermalSlip';
import DistributionInvoicePDF from '@/components/print/DistributionInvoicePDF';
import { pdf } from '@react-pdf/renderer';
import ReactDOM from 'react-dom';

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  salePriceRetail: number;
  salePriceDistribution: number;
  reorderLevel: number;
  brand?: { name: string } | null;
  category?: { name: string } | null;
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
  discount: number;
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

interface DraftSale {
  id: number;
  customerId?: number;
  salesmanId?: number;
  warehouseId?: number;
  saleType: string;
  items: SaleItem[];
  discount: number;
  discountType: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}



export default function NewSalePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { symbol } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [saleType, setSaleType] = useState<'retail' | 'distribution'>('retail');

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [walkInCustomer, setWalkInCustomer] = useState<Customer | null>(null);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<DraftSale[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState(0);

  // Product entry form state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [entryQuantity, setEntryQuantity] = useState(1);
  const [entryDiscount, setEntryDiscount] = useState(0);

  // Print state
  const [printInvoice, setPrintInvoice] = useState<any>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const loadProducts = async (warehouseId: number) => {
    const prods = await getProductsWithStock(warehouseId);
    setProducts(prods);
  };

  const loadDrafts = async () => {
    const draftList = await getDraftSales();
    setDrafts(draftList as any);
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [custData, walkIn, salesData, warehouseData] = await Promise.all([
        getCustomersForSale(),
        getWalkInCustomer(),
        getSalesmen(),
        getWarehouses(),
      ]);

      // Distribution customers only (no walk-in)
      setCustomers(custData);
      // Keep walk-in separate for retail auto-select
      setWalkInCustomer(walkIn || null);
      setSalesmen(salesData);
      setWarehouses(warehouseData);
      
      console.log('Loaded salesmen:', salesData);
      console.log('Loaded customers:', custData);
      console.log('Loaded warehouses:', warehouseData);

      if (warehouseData.length > 0) {
        setSelectedWarehouseId(warehouseData[0].id);
        loadProducts(warehouseData[0].id);
      }

      // Retail: auto-select walk-in customer
      if (walkIn) {
        setSelectedCustomerId(walkIn.id);
      }
    }

    loadData();
    loadDrafts();
  }, []);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.salePrice - item.discount), 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const total = subtotal - discountAmount;
  const change = amountTendered - total;

  // Calculate entry subtotal
  const entrySubtotal = selectedProduct && selectedBatchId
    ? entryQuantity * (saleType === 'retail' ? selectedProduct.salePriceRetail : selectedProduct.salePriceDistribution) - entryDiscount
    : 0;



  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    if (product.batches.length > 0) {
      setSelectedBatchId(product.batches[0].id);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      handleProductSelect(product);
    }
  };

  // Add item to cart
  const addItemToCart = useCallback(() => {
    if (!selectedProduct || !selectedBatchId || !selectedWarehouseId) return;

    const batch = selectedProduct.batches.find((b) => b.id === selectedBatchId);
    if (!batch) return;

    // Check if already added
    const existingIndex = items.findIndex(
      (item) => item.productId === selectedProduct.id && item.batchId === selectedBatchId
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      const maxQty = newItems[existingIndex].availableStock - newItems[existingIndex].quantity;
      if (maxQty >= entryQuantity) {
        newItems[existingIndex].quantity += entryQuantity;
        newItems[existingIndex].discount += entryDiscount;
        setItems(newItems);
      } else {
        alert('Insufficient stock');
        return;
      }
    } else {
      if (entryQuantity > batch.quantity) {
        alert('Insufficient stock');
        return;
      }

      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        batchId: selectedBatchId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A',
        quantity: entryQuantity,
        salePrice: saleType === 'retail' ? selectedProduct.salePriceRetail : selectedProduct.salePriceDistribution,
        discount: entryDiscount,
        availableStock: batch.quantity,
      };
      setItems([...items, newItem]);
    }

    // Reset form
    setSelectedProduct(null);
    setSelectedBatchId(null);
    setProductSearch('');
    setEntryQuantity(1);
    setEntryDiscount(0);
  }, [selectedProduct, selectedBatchId, entryQuantity, entryDiscount, items, saleType, selectedWarehouseId]);

  // Update item quantity
  const updateItemQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    const maxQty = items[index].availableStock;
    if (qty > maxQty) qty = maxQty;

    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  // Update item discount
  const updateItemDiscount = (index: number, discount: number) => {
    if (discount < 0) return;
    const newItems = [...items];
    newItems[index].discount = discount;
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (items.length === 0) {
      alert('Add items before saving draft');
      return;
    }

    try {
      await saveDraftSale({
        customerId: selectedCustomerId || undefined,
        salesmanId: selectedSalesmanId || undefined,
        warehouseId: selectedWarehouseId || undefined,
        saleType,
        items,
        discount: discountValue,
        discountType,
      });
      alert('Draft saved successfully');
      loadDrafts();
    } catch (error: any) {
      alert(error.message || 'Failed to save draft');
    }
  };

  // Load draft
  const handleLoadDraft = async (draftId: number) => {
    try {
      const draft = await getDraftSaleById(draftId);
      if (!draft) return;

      setSelectedCustomerId(draft.customerId || null);
      setSelectedSalesmanId(draft.salesmanId || null);
      setSelectedWarehouseId(draft.warehouseId || null);
      setSaleType(draft.saleType as 'retail' | 'distribution');
      setItems(draft.items);
      setDiscountValue(draft.discount);
      setDiscountType(draft.discountType as 'percentage' | 'fixed');
      setShowDrafts(false);

      if (draft.warehouseId) {
        loadProducts(draft.warehouseId);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to load draft');
    }
  };

  // Delete draft
  const handleDeleteDraft = async (draftId: number) => {
    if (!confirm('Delete this draft?')) return;
    try {
      await deleteDraftSale(draftId);
      loadDrafts();
    } catch (error: any) {
      alert(error.message || 'Failed to delete draft');
    }
  };

  // Print invoice
  const handlePrint = async (invoiceId: number, saleType: 'retail' | 'distribution') => {
    try {
      const fullInvoice = await getSalesInvoiceById(invoiceId);
      if (!fullInvoice) return;

      if (saleType === 'retail') {
        // Thermal slip print
        setPrintInvoice(fullInvoice);
        setShowPrintPreview(true);
        setTimeout(() => {
          window.print();
          setShowPrintPreview(false);
        }, 500);
      } else {
        // PDF generation for distribution
        const pdfDoc = <DistributionInvoicePDF
          invoice={fullInvoice as any}
          organization={{
            name: fullInvoice.branch?.organization?.name ?? 'AzanTech DMS',
            address: fullInvoice.branch?.organization?.address ?? undefined,
            phone: fullInvoice.branch?.organization?.phone ?? undefined,
            email: fullInvoice.branch?.organization?.email ?? undefined,
            website: (fullInvoice.branch?.organization as any)?.website ?? undefined,
            taxId: (fullInvoice.branch?.organization as any)?.taxId ?? undefined,
            logoUrl: (fullInvoice.branch?.organization as any)?.logoUrl ?? undefined,
          }}
          settings={{ currency: symbol }}
        />;
        const blob = await pdf(pdfDoc).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to print invoice');
    }
  };

  // Print estimate (without saving to DB)
  const handlePrintEstimate = async () => {
    if (items.length === 0) {
      alert('Add items to print estimate');
      return;
    }

    const estimateData = {
      invoiceNumber: 'ESTIMATE',
      invoiceDate: new Date(),
      totalAmount: subtotal,
      discount: discountAmount,
      netAmount: total,
      paidAmount: 0,
      items: items.map((item) => ({
        productName: item.productName,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        salePrice: item.salePrice,
        subtotal: item.quantity * item.salePrice - item.discount,
      })),
    };

    if (saleType === 'retail') {
      setPrintInvoice({ ...estimateData, branch: { organization: {} } });
      setShowPrintPreview(true);
      setTimeout(() => {
        window.print();
        setShowPrintPreview(false);
      }, 500);
    } else {
      // Distribution estimate — build a quick PDF
      try {
        const pdfDoc = <DistributionInvoicePDF
          invoice={{
            ...estimateData,
            status: 'ESTIMATE',
            customer: { name: 'Estimate', address: '', phone: '' },
            salesman: undefined,
          } as any}
          organization={{ name: 'AzanTech DMS' }}
          settings={{ currency: symbol }}
        />;
        const blob = await pdf(pdfDoc).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (err) {
        alert('Failed to generate estimate PDF');
      }
    }
  };

  // Submit sale
  const handleSubmit = async () => {
    if (!selectedWarehouseId || items.length === 0) {
      alert('Please fill in all required fields (Warehouse, Items)');
      return;
    }

    // For distribution, customer and salesman are required
    if (saleType === 'distribution') {
      if (!selectedCustomerId) {
        alert('Please select a customer for distribution sale');
        return;
      }
      if (!selectedSalesmanId) {
        alert('Please select a salesman for distribution sale');
        return;
      }
    }

    setLoading(true);
    try {
      const saleItems = items.map((item) => ({
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        salePrice: item.salePrice,
      }));

      const result = await createSalesInvoice({
        customerId: saleType === 'distribution' ? selectedCustomerId! : undefined,
        salesmanId: selectedSalesmanId || 1, // retail can proceed without salesman
        warehouseId: selectedWarehouseId,
        branchId: 1,
        saleType,
        items: saleItems,
        discount: discountAmount,
        paymentMethod,
        amountTendered: total > 0 ? amountTendered : 0,
      });

      // Auto-print after sale
      if (result.invoice) {
        await handlePrint(result.invoice.id, saleType);
      }

      // Clear cart
      setItems([]);
      setDiscountValue(0);
      setAmountTendered(0);
      setSelectedProduct(null);
      setProductSearch('');
      setSelectedBatchId(null);
      setEntryQuantity(1);
      setEntryDiscount(0);
      if (saleType === 'distribution') {
        setSelectedCustomerId(null);
        setSelectedSalesmanId(null);
      }

      router.push('/sales');
    } catch (error: any) {
      alert(error.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter to add to cart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addItemToCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addItemToCart]);



  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">New Sale</h1>
          <p className="text-slate-400 mt-1">Create a new sales invoice</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDrafts(!showDrafts)}
            className="px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 flex items-center gap-2"
          >
            <FolderOpen size={18} />
            Drafts ({drafts.length})
          </button>
          <button
            onClick={() => {
              setSaleType('retail');
              // Auto-select walk-in for retail
              if (walkInCustomer) setSelectedCustomerId(walkInCustomer.id);
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              saleType === 'retail'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Retail
          </button>
          <button
            onClick={() => {
              setSaleType('distribution');
              // Clear customer when switching to distribution (no walk-in)
              setSelectedCustomerId(null);
            }}
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

      {/* Drafts Modal */}
      {showDrafts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Draft Sales</h2>
              <button onClick={() => setShowDrafts(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            {drafts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No drafts saved</p>
            ) : (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <div key={draft.id} className="bg-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">
                        {draft.saleType === 'retail' ? 'Retail' : 'Distribution'} Sale
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(draft.updatedAt).toLocaleString()} • {JSON.parse(draft.items as any).length} items
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadDraft(draft.id)}
                        className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer & Salesman Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Customer</label>
          {saleType === 'retail' ? (
            <div className="w-full px-4 py-2.5 bg-slate-800/30 border border-slate-700 rounded-xl text-slate-300 flex items-center gap-2">
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-medium">Walk-in</span>
              {walkInCustomer?.name || 'Walk-in Customer'}
            </div>
          ) : (
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Salesman *</label>
          <select
            value={selectedSalesmanId || ''}
            onChange={(e) => setSelectedSalesmanId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
            required
          >
            <option value="">Select Salesman</option>
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



      {/* Product Entry Form - NEW HORIZONTAL LAYOUT */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Product</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Product Name with Autocomplete & Barcode */}
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">Product Name / Barcode</label>
            <ProductAutocomplete
              products={products}
              value={productSearch}
              onChange={setProductSearch}
              onSelect={handleProductSelect}
              saleType={saleType}
              symbol={symbol}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          {/* Quantity */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-400 mb-2">Qty</label>
            <input
              type="number"
              value={entryQuantity}
              onChange={(e) => setEntryQuantity(Number(e.target.value))}
              min="1"
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          {/* Unit Price */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">Unit Price</label>
            <input
              type="text"
              value={
                selectedProduct
                  ? `${symbol}${saleType === 'retail' ? selectedProduct.salePriceRetail : selectedProduct.salePriceDistribution}`
                  : ''
              }
              readOnly
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            />
          </div>

          {/* Batch Info */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">Batch</label>
            <select
              value={selectedBatchId || ''}
              onChange={(e) => setSelectedBatchId(Number(e.target.value))}
              disabled={!selectedProduct || selectedProduct.batches.length === 0}
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white disabled:opacity-50"
            >
              <option value="">Select Batch</option>
              {selectedProduct?.batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber} | Qty: {batch.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Discount */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-400 mb-2">Discount</label>
            <input
              type="number"
              value={entryDiscount}
              onChange={(e) => setEntryDiscount(Number(e.target.value))}
              min="0"
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          {/* Subtotal */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-400 mb-2">Subtotal</label>
            <input
              type="text"
              value={`${symbol}${entrySubtotal.toFixed(2)}`}
              readOnly
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-emerald-400 font-medium"
            />
          </div>

          {/* Add to Cart Button */}
          <div className="lg:col-span-1 flex items-end">
            <button
              onClick={addItemToCart}
              disabled={!selectedProduct || !selectedBatchId}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Tip: Press <kbd className="px-2 py-0.5 bg-slate-700 rounded">Ctrl+Enter</kbd> to quickly add item to cart
        </p>
      </div>



      {/* Cart Table - WITH PROPER SPACING */}
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Expiry</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Discount</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Add products to start a sale
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={`${item.productId}-${item.batchId}`} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <p className="text-white">{item.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.batchNumber}</td>
                  <td className="px-4 py-3 text-slate-400">{item.expiryDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        className="w-7 h-7 bg-slate-700 rounded text-white hover:bg-slate-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
                        className="w-7 h-7 bg-slate-700 rounded text-white hover:bg-slate-600 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white">{symbol}{item.salePrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateItemDiscount(index, Number(e.target.value))}
                      min="0"
                      className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-right"
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {symbol}{(item.quantity * item.salePrice - item.discount).toFixed(2)}
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



      {/* Summary Panel - HORIZONTAL LAYOUT */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Calculator size={24} />
          Sale Summary
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Totals */}
          <div className="space-y-4">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-medium">{symbol}{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Overall Discount</label>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">{symbol}</option>
                </select>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  min="0"
                />
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-400 mt-2 text-sm">
                  <span>Discount Amount</span>
                  <span className="text-red-400">-{symbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-700">
              <span className="text-white">Total</span>
              <span className="text-emerald-400">{symbol}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Middle: Payment Method */}
          <div className="space-y-4">
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
                  <span className={change >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                    {symbol}{change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={items.length === 0}
                className="py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <Save size={16} />
                Save Draft
              </button>
              <button 
                onClick={handlePrintEstimate}
                disabled={items.length === 0}
                className="py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Printer size={16} />
                Estimate
              </button>
            </div>
            <button
              onClick={() => router.back()}
              className="w-full py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Thermal Slip Preview (hidden, only for printing) */}
      {showPrintPreview && printInvoice && saleType === 'retail' && (
        <div className="hidden print:block absolute left-0 top-0 w-full bg-white z-50">
          <RetailThermalSlip
            invoice={{
              invoiceNumber: printInvoice.invoiceNumber,
              invoiceDate: printInvoice.invoiceDate,
              totalAmount: printInvoice.totalAmount,
              discount: printInvoice.discount,
              netAmount: printInvoice.netAmount,
              paidAmount: printInvoice.paidAmount,
              items: printInvoice.items.map((item: any) => ({
                // Saved invoice has item.product.name; estimate has item.productName directly
                productName: item.product?.name ?? item.productName ?? 'Product',
                quantity: item.quantity,
                salePrice: item.salePrice,
                subtotal: item.subtotal,
              })),
            }}
            organization={{
              name: printInvoice.branch?.organization?.name ?? 'AzanTech DMS',
              address: printInvoice.branch?.organization?.address ?? '',
              phone: printInvoice.branch?.organization?.phone ?? '',
              email: printInvoice.branch?.organization?.email ?? '',
            }}
            settings={{
              currency: symbol,
            }}
            cashier={user?.fullName || 'Cashier'}
            autoPrint={false}
          />
        </div>
      )}
    </div>
  );
}
