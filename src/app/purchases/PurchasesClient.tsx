"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, PackagePlus, CheckCircle2, Edit, Eye, CreditCard, FileDown, RotateCcw, Search, X, Lock, Unlock, Beaker, Calendar, DollarSign, Percent, Tag, Hash, ShoppingCart, Box, Layers, Phone, Loader2, Filter, ChevronDown, ChevronUp, Printer, Download, Receipt } from 'lucide-react';
import { createPurchaseInvoice, deletePurchaseInvoice, updatePurchaseInvoice, recordPurchasePayment } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { pdf } from '@react-pdf/renderer';
import PurchaseInvoicePDF from './PurchaseInvoicePDF';
import { useCurrency } from '@/contexts/CurrencyContext';

// Utility for file downloads
const saveAs = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  status: string;
  notes?: string | null;
  supplier: { 
    id: number;
    name: string; 
    phone: string | null; 
    address: string | null;
    supplierCompany?: { id: number; name: string } | null;
    organizationId: number;
    organization: { name: string } 
  };
  warehouse: { id: number; name: string };
  branch: { id: number; name: string };
  items: any[];
}

type SupplierCompany = { id: number; name: string }
type Supplier = { id: number; name: string; phone: string | null; address: string | null; contactPerson: string | null; supplierCompany?: { id: number; name: string } | null; organization: { id: number; name: string } }
type Warehouse = { id: number; name: string }
type Branch = { id: number; name: string; organization: { id: number; name: string } }
type Category = { id: number; name: string }
type Product = { id: number; name: string; genericName?: string | null; categoryId: number | null; category: { name: string }; brand: { name: string } }

interface PurchasesClientProps {
  initialInvoices: Invoice[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  branches: Branch[];
  categories: Category[];
  products: Product[];
  supplierCompanies: SupplierCompany[];
  session: any;
  appSettings: any;
}

export default function PurchasesClient({
  initialInvoices,
  suppliers,
  warehouses,
  branches,
  categories,
  products,
  supplierCompanies,
  session,
  appSettings
}: PurchasesClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const isAdmin = session?.role?.toLowerCase() === 'admin';
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isStepLocked, setIsStepLocked] = useState(false);
  const { symbol: currency } = useCurrency();

  // Form state
  const [items, setItems] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    supplierCompanyId: '',
    supplierId: '',
    warehouseId: '',
    categoryId: '',
    supplierPhone: '',
    supplierAddress: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    editInvoiceId: null as number | null,
    paymentMethod: 'CASH',
  });

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

  // Performance Optimized Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Individual Item Entry State
  const initialItemState = {
    productId: '',
    productName: '',
    genericName: '',
    categoryId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '1',
    bonus: '0',
    purchasePrice: '0',
    salePriceRetail: '0',
    salePriceDistribution: '0',
    discount: '0',
    isNewProduct: false
  };
  const [currentItem, setCurrentItem] = useState(initialItemState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filter States
  const [filterOrganization, setFilterOrganization] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterItemName, setFilterItemName] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // View Details Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Financial Panel State
  const [payAmount, setPayAmount] = useState('0');


  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = !filterOrganization || inv.supplier.supplierCompany?.id?.toString() === filterOrganization;
      const matchesSupplier = !filterSupplier || inv.supplier.name === suppliers.find(s => s.id.toString() === filterSupplier)?.name;
      
      const invDate = new Date(inv.invoiceDate);
      const matchesStartDate = !filterStartDate || invDate >= new Date(filterStartDate);
      const matchesEndDate = !filterEndDate || invDate <= new Date(filterEndDate + 'T23:59:59');
      
      const matchesItemName = !filterItemName || inv.items.some((item: any) => 
        item.product.name.toLowerCase().includes(filterItemName.toLowerCase())
      );
      
      const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;

      return matchesSearch && matchesCompany && matchesSupplier && matchesStartDate && matchesEndDate && matchesItemName && matchesStatus;
    });
  }, [invoices, searchTerm, filterOrganization, filterSupplier, filterStartDate, filterEndDate, filterItemName, filterStatus, suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!invoiceData.supplierCompanyId) return suppliers
    return suppliers.filter(s => s.supplierCompany?.id.toString() === invoiceData.supplierCompanyId)
  }, [invoiceData.supplierCompanyId, suppliers])

  const selectedCategoryName = useMemo(() => {
    return categories.find(c => c.id.toString() === invoiceData.categoryId)?.name || '';
  }, [invoiceData.categoryId, categories]);

  const isMedicine = selectedCategoryName.toLowerCase().includes('medicine');
  const needsBatch = isMedicine || selectedCategoryName.toLowerCase().includes('tablet') || selectedCategoryName.toLowerCase().includes('capsule');

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id.toString() === supplierId)
    setInvoiceData({
      ...invoiceData,
      supplierId,
      supplierPhone: supplier?.phone || '',
      supplierAddress: supplier?.address || ''
    })
  }

  // Optimized Search with Debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (currentItem.productName.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/products/search?q=${encodeURIComponent(currentItem.productName)}`);
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [currentItem.productName]);

  const selectSuggestion = (s: any) => {
    const matchedCat = categories.find(c => c.name.toLowerCase() === (s.categoryName || '').toLowerCase());
    
    setCurrentItem({
      ...currentItem,
      productName: s.name,
      productId: s.id?.toString() || '',
      genericName: s.genericName || '',
      categoryId: matchedCat ? matchedCat.id.toString() : (s.categoryId?.toString() || invoiceData.categoryId),
      isNewProduct: s.source === 'excel'
    });
    setShowSuggestions(false);
  };

  const addItemToTable = () => {
    if (!currentItem.productName) {
      alert("Please enter product name");
      return;
    }
    const newItem = {
      ...currentItem,
      id: Date.now(),
      categoryId: currentItem.categoryId || invoiceData.categoryId,
      subtotal: calculateItemSubtotal(currentItem)
    };
    setItems([...items, newItem]);
    setCurrentItem({ ...initialItemState, categoryId: invoiceData.categoryId });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const calculateItemSubtotal = (item: any) => {
    const qty = Number(item.quantity) + Number(item.bonus);
    const disc = Number(item.discount) || 0;
    const price = Number(item.purchasePrice) || 0;
    return (qty * price) - (qty * price * disc / 100);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const grandTotal = calculateTotal();
  const remainingBalance = grandTotal - Number(payAmount);

  const isEditMode = !!invoiceData.editInvoiceId;

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    
    let result;
    if (isEditMode) {
      // Edit mode: do NOT send paidAmount — payments are separate
      const editPayload = {
        supplierId: parseInt(invoiceData.supplierId),
        supplierPhone: invoiceData.supplierPhone,
        warehouseId: parseInt(invoiceData.warehouseId),
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        totalAmount: grandTotal,
        discount: 0,
        netAmount: grandTotal,
        items: items
      };
      result = await updatePurchaseInvoice(invoiceData.editInvoiceId!, editPayload);
    } else {
      // Create mode: include payment details
      const createPayload = {
        supplierId: parseInt(invoiceData.supplierId),
        supplierPhone: invoiceData.supplierPhone,
        warehouseId: parseInt(invoiceData.warehouseId),
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        totalAmount: grandTotal,
        discount: 0,
        netAmount: grandTotal,
        paidAmount: Number(payAmount),
        paymentMethod: invoiceData.paymentMethod,
        items: items
      };
      result = await createPurchaseInvoice(createPayload);
    }

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setViewMode('list');
        setItems([]);
        window.location.reload();
      }, 2000);
    } else {
      alert("Error: " + result.error);
    }
    setIsSubmitting(false);
  };

  const handleEdit = (inv: Invoice) => {
    setInvoiceData({
      supplierCompanyId: inv.supplier.supplierCompany?.id?.toString() || '',
      supplierId: inv.supplier.id.toString(),
      warehouseId: inv.warehouse.id.toString(),
      categoryId: inv.items[0]?.product.categoryId?.toString() || '',
      supplierPhone: inv.supplier.phone || '',
      supplierAddress: inv.supplier.address || '',
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: new Date(inv.invoiceDate).toISOString().split('T')[0],
      editInvoiceId: inv.id,
      paymentMethod: 'CASH'
    });
    
    setItems(inv.items.map((item: any) => ({
      id: Date.now() + Math.random(),
      productId: item.productId.toString(),
      productName: item.product.name,
      genericName: item.product.genericName || '',
      categoryId: item.product.categoryId?.toString() || '',
      batchNumber: item.batch?.batchNumber || '',
      expiryDate: item.batch?.expiryDate ? new Date(item.batch.expiryDate).toISOString().split('T')[0] : '',
      quantity: item.quantity.toString(),
      bonus: item.bonus.toString(),
      purchasePrice: item.purchasePrice.toString(),
      salePriceRetail: item.product.salePriceRetail?.toString() || '0',
      salePriceDistribution: item.product.salePriceDistribution?.toString() || '0',
      discount: '0', 
      subtotal: item.subtotal,
      isNewProduct: false
    })));
    
    setPayAmount(inv.paidAmount?.toString() || '0');
    setViewMode('form');
  };

  const handleRecordPayment = async () => {
    if (!paymentModal.amount || Number(paymentModal.amount) <= 0) return alert('Invalid amount');
    if (Number(paymentModal.amount) > paymentModal.maxAmount) return alert('Amount exceeds outstanding balance');
    
    setPaymentModal(p => ({ ...p, isSubmitting: true }));
    const res = await recordPurchasePayment(paymentModal.invoiceId, Number(paymentModal.amount), paymentModal.method);
    if (res.success) {
      alert('Payment recorded successfully');
      window.location.reload();
    } else {
      alert(res.error);
      setPaymentModal(p => ({ ...p, isSubmitting: false }));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This will reverse stock and ledger entries.')) return;
    const res = await deletePurchaseInvoice(id);
    if (res.success) {
      setInvoices(invoices.filter(i => i.id !== id));
      alert('Invoice deleted successfully');
    } else {
      alert(res.error);
    }
  };

  const exportToPDF = async () => {
    if (!selectedInvoice) return;

    try {
      const blob = await pdf(
        <PurchaseInvoicePDF 
          invoice={selectedInvoice} 
          appSettings={appSettings} 
          currency={currency} 
        />
      ).toBlob();
      
      saveAs(blob, `Invoice_${selectedInvoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const exportToCSV = (invoice: Invoice) => {
    const headers = ["Product", "Generic Name", "Batch", "Expiry", "Quantity", "Bonus", "Purchase Price", "Subtotal"];
    const rows = invoice.items.map((item: any) => [
      item.product.name,
      item.product.genericName || "",
      item.batch.batchNumber,
      item.batch.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString() : "",
      item.quantity,
      item.bonus,
      item.purchasePrice,
      item.subtotal
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Invoice_${invoice.invoiceNumber}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6 pb-40">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <PackagePlus className="w-8 h-8 text-indigo-600" /> {invoiceData.editInvoiceId ? 'Edit Purchase Invoice' : 'New Purchase'}
          </h1>
          <button onClick={() => {
            setViewMode('list');
            setInvoiceData(prev => ({ ...prev, editInvoiceId: null }));
            setItems([]);
          }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg">← Back</button>
        </div>

        {/* Step 1: Header Information */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            {isStepLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />} Header Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Company</label>
              <select disabled={isStepLocked} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.supplierCompanyId} onChange={e => setInvoiceData({ ...invoiceData, supplierCompanyId: e.target.value, supplierId: '' })}>
                <option value="">Select Company</option>
                {supplierCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Supplier</label>
              <select disabled={isStepLocked || !invoiceData.supplierCompanyId} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.supplierId} onChange={e => handleSupplierChange(e.target.value)}>
                <option value="">Select Supplier</option>
                {filteredSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Supplier Contact</label>
              <input disabled={isStepLocked} type="text" placeholder="Phone Number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.supplierPhone} onChange={e => setInvoiceData({ ...invoiceData, supplierPhone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Category (Primary)</label>
              <select disabled={isStepLocked} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.categoryId} onChange={e => setInvoiceData({ ...invoiceData, categoryId: e.target.value })}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Warehouse</label>
              <select disabled={isStepLocked} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.warehouseId} onChange={e => setInvoiceData({ ...invoiceData, warehouseId: e.target.value })}>
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Invoice Number</label>
              <input disabled={isStepLocked} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Date</label>
              <input disabled={isStepLocked} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={invoiceData.invoiceDate} onChange={e => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })} />
            </div>
            <div className="flex items-end lg:col-span-3">
              <button onClick={() => setIsStepLocked(!isStepLocked)} className={`px-8 py-2 rounded-lg font-bold text-sm transition-all ${isStepLocked ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white'}`}>{isStepLocked ? 'Unlock Header' : 'Lock & Add Items'}</button>
            </div>
          </div>
        </div>

        {/* Step 2: Item Details Entry */}
        {isStepLocked && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-indigo-500/20 p-6 space-y-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Item Details Entry
            </h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 relative" ref={searchRef}>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Tag className="w-4 h-4 text-indigo-500" /> Product Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type at least 2 chars..." 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium" 
                      value={currentItem.productName} 
                      onChange={(e) => setCurrentItem({...currentItem, productName: e.target.value})} 
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
                  </div>
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{s.name}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] text-slate-500 truncate max-w-[70%]">{s.genericName || 'No Generic Name'}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${s.source === 'db' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {s.source}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Layers className="w-4 h-4 text-violet-500" /> Category</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={currentItem.categoryId || invoiceData.categoryId} onChange={(e) => setCurrentItem({...currentItem, categoryId: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {isMedicine && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Beaker className="w-4 h-4 text-pink-500" /> Generic Name / Formula</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={currentItem.genericName} onChange={(e) => setCurrentItem({...currentItem, genericName: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Hash className="w-4 h-4 text-blue-500" /> Batch Number</label>
                  <input disabled={!needsBatch} type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm disabled:opacity-30" value={currentItem.batchNumber} onChange={(e) => setCurrentItem({...currentItem, batchNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Calendar className="w-4 h-4 text-orange-500" /> Expiry Date</label>
                  <input disabled={!needsBatch} type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm disabled:opacity-30" value={currentItem.expiryDate} onChange={(e) => setCurrentItem({...currentItem, expiryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><ShoppingCart className="w-4 h-4 text-emerald-500" /> Quantity</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Plus className="w-4 h-4 text-emerald-400" /> Bonus Quantity</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" value={currentItem.bonus} onChange={(e) => setCurrentItem({...currentItem, bonus: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><DollarSign className="w-4 h-4 text-indigo-500" /> Purchase Price ({currency})</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" value={currentItem.purchasePrice} onChange={(e) => setCurrentItem({...currentItem, purchasePrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><DollarSign className="w-4 h-4 text-emerald-600" /> Retail Price ({currency})</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" value={currentItem.salePriceRetail} onChange={(e) => setCurrentItem({...currentItem, salePriceRetail: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><DollarSign className="w-4 h-4 text-amber-600" /> Distribution Price ({currency})</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" value={currentItem.salePriceDistribution} onChange={(e) => setCurrentItem({...currentItem, salePriceDistribution: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Percent className="w-4 h-4 text-red-500" /> Discount (%)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" value={currentItem.discount} onChange={(e) => setCurrentItem({...currentItem, discount: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-700">
              <button onClick={addItemToTable} className="inline-flex items-center gap-3 px-16 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 transform hover:-translate-y-1"><Plus className="w-6 h-6" /> ADD ITEM TO TABLE</button>
            </div>
          </div>
        )}

        {/* Item Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Product / Batch</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Qty/Bonus</th>
                  <th className="px-4 py-3">P. Price</th>
                  <th className="px-4 py-3">Sale (R/D)</th>
                  <th className="px-4 py-3">Disc%</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.length === 0 ? (<tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Add items above to see them in the table</td></tr>) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 font-medium">{it.productName}<div className="text-[10px] text-slate-400 font-normal">Batch: {it.batchNumber || 'N/A'}</div></td>
                      <td className="px-4 py-3 text-slate-500">{it.expiryDate || '-'}</td>
                      <td className="px-4 py-3">{it.quantity} <span className="text-emerald-500 font-bold">+{it.bonus}</span></td>
                      <td className="px-4 py-3">{currency}{it.purchasePrice}</td>
                      <td className="px-4 py-3"><span className="text-emerald-600">{currency}{it.salePriceRetail}</span> / <span className="text-amber-600">{currency}{it.salePriceDistribution}</span></td>
                      <td className="px-4 py-3">{it.discount}%</td>
                      <td className="px-4 py-3 text-right font-bold">{currency}{it.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button 
                            onClick={() => {
                              setCurrentItem({
                                productId: it.productId,
                                productName: it.productName,
                                genericName: it.genericName,
                                categoryId: it.categoryId,
                                batchNumber: it.batchNumber,
                                expiryDate: it.expiryDate,
                                quantity: it.quantity,
                                bonus: it.bonus,
                                purchasePrice: it.purchasePrice,
                                salePriceRetail: it.salePriceRetail,
                                salePriceDistribution: it.salePriceDistribution,
                                discount: it.discount,
                                subtotal: it.subtotal,
                                isNewProduct: it.isNewProduct
                              });
                              setItems(items.filter(i => i.id !== it.id));
                            }} 
                            className="text-amber-500 p-1 hover:bg-amber-50 rounded"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setItems(items.filter(i => i.id !== it.id))} 
                            className="text-red-500 p-1 hover:bg-red-50 rounded"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FINANCIAL SUMMARY PANEL */}
        {items.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Items</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{items.length}</p>
              </div>
              <div className="space-y-1 border-l pl-8 border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payable</p>
                <p className="text-3xl font-black text-indigo-600">{currency}{grandTotal.toFixed(2)}</p>
              </div>
              <div className="space-y-2 border-l pl-8 border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isEditMode ? 'Already Paid' : 'Paid Amount'}</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                  <input 
                    type="number" 
                    disabled={isEditMode}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 rounded-xl text-xl font-black focus:ring-0 outline-none transition-all ${isEditMode ? 'border-slate-200 text-slate-400 cursor-not-allowed opacity-60' : 'border-indigo-500/20 text-emerald-600 focus:border-indigo-500'}`}
                    value={payAmount} 
                    onChange={e => setPayAmount(e.target.value)} 
                  />
                </div>
                {isEditMode && <p className="text-[10px] text-amber-500 font-semibold">Use "Record Payment" button to add payments</p>}
              </div>
              <div className="space-y-2 border-l pl-8 border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-indigo-500/20 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 outline-none transition-all" 
                  value={invoiceData.paymentMethod} 
                  onChange={e => setInvoiceData({...invoiceData, paymentMethod: e.target.value})}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div className="space-y-1 border-l pl-8 border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Remaining Balance</p>
                <p className={`text-3xl font-black ${remainingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {currency}{remainingBalance.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                disabled={isSubmitting} 
                onClick={handleSubmit} 
                className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg flex items-center gap-3 disabled:opacity-50 text-xl tracking-tighter uppercase transition-transform active:scale-95"
              >
                <Save className="w-6 h-6" />
                {isSubmitting ? 'SAVING...' : (isEditMode ? 'UPDATE INVOICE' : 'SAVE INVOICE TO DATABASE')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3"><PackagePlus className="w-8 h-8 text-indigo-600" /> Purchases</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPaymentModal({ isOpen: true, invoiceId: 0, invoiceNumber: '', maxAmount: 0, amount: '', method: 'CASH', isSubmitting: false })}
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold text-sm transition-all bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100`}
          >
            <Receipt className="w-4 h-4" /> Record Payment
          </button>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold text-sm transition-all ${showAdvancedFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <Filter className="w-4 h-4" /> 
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
          <button onClick={() => setViewMode('form')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 uppercase tracking-wider text-sm flex items-center gap-2">
            <Plus className="w-5 h-5" /> NEW PURCHASE
          </button>
        </div>
      </div>

      {success && (<div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><p className="font-medium">Invoice saved successfully!</p></div>)}

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company</label>
                  <select 
                    value={filterOrganization} 
                    onChange={e => setFilterOrganization(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">All Companies</option>
                    {supplierCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
                  <select 
                    value={filterSupplier} 
                    onChange={e => setFilterSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by item..." 
                      value={filterItemName}
                      onChange={e => setFilterItemName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="ALL">All Status</option>
                    <option value="RECEIVED">Received</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                  <input 
                    type="date" 
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                  <input 
                    type="date" 
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-end gap-2 lg:col-span-2">
                  <button 
                    onClick={() => {
                      setFilterOrganization('');
                      setFilterSupplier('');
                      setFilterItemName('');
                      setFilterStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by Invoice # or Supplier..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all" 
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInvoices.length === 0 ? (<tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No invoices found matching your criteria</td></tr>) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4 font-black text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{new Date(inv.invoiceDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white">{inv.supplier.name}</div>
                      <div className="text-[10px] text-slate-400">{(inv.supplier as any).supplierCompany?.name || inv.supplier.organization?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {inv.items.length} {inv.items.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">{currency}{inv.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {inv.status}
                      </span>
                      {inv.status !== 'PAID' && (
                        <div className="text-[9px] text-slate-500 font-bold mt-1 tracking-wider">
                          DUE: {currency}{(inv.netAmount - inv.paidAmount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleEdit(inv)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Edit Invoice"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(inv.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {paymentModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500" /> Record Payment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Select Invoice</label>
                  <select 
                    className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" 
                    value={paymentModal.invoiceId || ''} 
                    onChange={e => {
                      const id = Number(e.target.value);
                      const inv = invoices.find(i => i.id === id);
                      if (inv) {
                        if (inv.status === 'PAID') {
                          alert('Purchase already paid full');
                          setPaymentModal({...paymentModal, invoiceId: 0, invoiceNumber: '', maxAmount: 0, amount: ''});
                          return;
                        }
                        const maxAmt = inv.netAmount - (inv.paidAmount || 0);
                        setPaymentModal({
                          ...paymentModal, 
                          invoiceId: id, 
                          invoiceNumber: inv.invoiceNumber, 
                          maxAmount: maxAmt, 
                          amount: maxAmt.toString()
                        });
                      } else {
                        setPaymentModal({...paymentModal, invoiceId: 0, invoiceNumber: '', maxAmount: 0, amount: ''});
                      }
                    }}
                  >
                    <option value="">Select an Invoice...</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.supplier.name} ({currency}{inv.netAmount})
                      </option>
                    ))}
                  </select>
                </div>

                {paymentModal.invoiceId > 0 && (
                  <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    Recording payment for Invoice <b>#{paymentModal.invoiceNumber}</b>. <br/>
                    Outstanding balance: <b className="text-emerald-500">{currency}{paymentModal.maxAmount.toFixed(2)}</b>
                  </p>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                    <input type="number" disabled={!paymentModal.invoiceId} max={paymentModal.maxAmount} className="w-full pl-8 pr-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 disabled:opacity-50" value={paymentModal.amount} onChange={e => setPaymentModal({...paymentModal, amount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
                  <select className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={paymentModal.method} onChange={e => setPaymentModal({...paymentModal, method: e.target.value})}>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setPaymentModal({...paymentModal, isOpen: false})} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                <button disabled={paymentModal.isSubmitting} onClick={handleRecordPayment} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                  {paymentModal.isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-indigo-600" />
                    Purchase Invoice Details
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">#{selectedInvoice.invoiceNumber} • {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div id="invoice-print-area" className="flex-1 overflow-y-auto p-8 space-y-8 print:p-0">
                {/* BRANDED HEADER FOR PRINT/PDF */}
                <div className="text-center space-y-2 mb-10 pb-6 border-b-2 border-slate-100">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                    {appSettings?.company_name || "AzanTech DMS"}
                  </h1>
                  <p className="text-sm font-bold text-slate-500">
                    {appSettings?.company_address || "Your Business Address Goes Here"}
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {appSettings?.company_phone && `Phone: ${appSettings.company_phone}`} | {appSettings?.company_email && `Email: ${appSettings.company_email}`}
                  </p>
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                    <h2 className="text-xl font-black text-indigo-600 uppercase tracking-widest">
                      Purchase Invoice Report
                    </h2>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 group-hover:bg-indigo-500/10 transition-colors" />
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Invoice Metadata</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice Number</p>
                        <p className="font-black text-slate-800 dark:text-white">#{selectedInvoice.invoiceNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Issue Date</p>
                        <p className="font-black text-slate-800 dark:text-white">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Warehouse</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{selectedInvoice.warehouse.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Branch</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{selectedInvoice.branch.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors" />
                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Supplier Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{selectedInvoice.supplier.name}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase">{selectedInvoice.supplier.organization?.name}</p>
                      </div>
                      <div className="flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {selectedInvoice.supplier.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{selectedInvoice.supplier.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-2xl shadow-indigo-200 dark:shadow-none mb-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-1">Total Net Amount Payable</p>
                      <p className="text-5xl font-black tracking-tighter">{currency}{selectedInvoice.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      {selectedInvoice.paidAmount > 0 && (
                        <p className="text-sm font-bold opacity-90 mt-2 bg-white/10 inline-block px-3 py-1 rounded-lg">
                          Paid: {currency}{selectedInvoice.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          <span className="mx-2">|</span>
                          Due: {currency}{(selectedInvoice.netAmount - selectedInvoice.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-2">Invoice Status</p>
                      <span className={`px-4 py-1.5 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest ring-1 ring-white/30 ${selectedInvoice.status === 'PAID' ? 'bg-emerald-500/80' : selectedInvoice.status === 'PARTIAL' ? 'bg-amber-500/80' : 'bg-white/20'}`}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Purchase Itemization</h3>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                        <tr>
                          <th className="px-6 py-5">Product Details</th>
                          <th className="px-6 py-5">Batch & Expiry</th>
                          <th className="px-6 py-5 text-center">Qty</th>
                          <th className="px-6 py-5 text-center">Bonus</th>
                          <th className="px-6 py-5 text-right">Rate</th>
                          <th className="px-6 py-5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {selectedInvoice.items.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 dark:text-white">{item.product.name}</div>
                              <div className="text-[10px] text-slate-400">{item.product.genericName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium">{item.batch.batchNumber}</div>
                              {item.batch.expiryDate && (
                                <div className="text-[10px] text-red-500 font-bold">Exp: {new Date(item.batch.expiryDate).toLocaleDateString()}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                            <td className="px-6 py-4 text-center text-emerald-500 font-black">+{item.bonus}</td>
                            <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">{currency}{item.purchasePrice.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-black text-indigo-600">{currency}{item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SUMMARY SECTION BELOW TABLE */}
                <div className="flex justify-end pt-4">
                  <div className="w-full md:w-1/3 space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Total</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currency}{selectedInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount</span>
                      <span className="font-bold text-red-500">-{currency}{selectedInvoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-indigo-600 p-4 rounded-2xl text-white flex justify-between items-center shadow-lg">
                      <span className="text-xs font-black uppercase tracking-widest">Net Amount</span>
                      <span className="text-xl font-black">{currency}{selectedInvoice.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Notes & Signs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                  <div>
                    {selectedInvoice.notes && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Internal Remarks</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl text-sm text-slate-600 dark:text-slate-300 italic">
                          "{selectedInvoice.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-end gap-12">
                    <div className="flex justify-between items-end px-4">
                      <div className="text-center space-y-2">
                        <div className="w-40 border-b-2 border-slate-200" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized Signature</p>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="w-40 border-b-2 border-slate-200" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Receiver's Stamp</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BRANDING FOOTER */}
                <div className="pt-20 pb-4 text-center border-t border-slate-100 mt-20">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                    Generated by AzanTech DMS • Software Excellence
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4 print:hidden">
                <button 
                  onClick={() => exportToCSV(selectedInvoice)}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button 
                  onClick={exportToPDF}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <FileDown className="w-4 h-4" /> Export PDF
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  <Printer className="w-4 h-4" /> Print Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
