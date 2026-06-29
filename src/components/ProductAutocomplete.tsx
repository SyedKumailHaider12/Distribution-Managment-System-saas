'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  salePriceRetail: number;
  salePriceDistribution: number;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  reorderLevel: number;
  totalStock: number;
  batches: Batch[];
}

interface Batch {
  id: number;
  batchNumber: string;
  expiryDate: Date | null;
  quantity: number;
}

interface ProductAutocompleteProps {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: Product) => void;
  saleType: 'retail' | 'distribution';
  symbol: string;
  placeholder?: string;
  className?: string;
}

export default function ProductAutocomplete({
  products,
  value,
  onChange,
  onSelect,
  saleType,
  symbol,
  placeholder = 'Search product by name or barcode...',
  className = '',
}: ProductAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(value.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredProducts.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          onSelect(filteredProducts[selectedIndex]);
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
        />
      </div>

      {showDropdown && value && filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl max-h-80 overflow-y-auto z-50 shadow-xl">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              onClick={() => {
                onSelect(product);
                setShowDropdown(false);
              }}
              className={`p-3 border-b border-slate-700 last:border-0 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-indigo-500/20' : 'hover:bg-slate-700/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{product.name}</p>
                  <p className="text-xs text-slate-400">
                    {product.brand?.name} • {product.category?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Stock: {product.totalStock} | Barcode: {product.barcode || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-medium">
                    {symbol}
                    {saleType === 'retail' ? product.salePriceRetail : product.salePriceDistribution}
                  </p>
                  {product.totalStock === 0 && (
                    <span className="text-xs text-red-400">Out of stock</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && value && filteredProducts.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl p-4 text-center text-slate-400 z-50">
          No products found
        </div>
      )}
    </div>
  );
}
