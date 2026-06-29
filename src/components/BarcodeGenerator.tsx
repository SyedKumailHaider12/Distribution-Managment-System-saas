'use client';

import { useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, Barcode as BarcodeIcon } from 'lucide-react';

interface BarcodeGeneratorProps {
  value: string;
  productName: string;
  price?: number;
  showPrint?: boolean;
}

export default function BarcodeGenerator({ value, productName, price, showPrint = true }: BarcodeGeneratorProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const renderBarcode = (el: SVGSVGElement | null) => {
    if (el && value) {
      try {
        JsBarcode(el, value, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.error('Barcode generation failed:', e);
      }
    }
  };

  const handlePrint = () => {
    if (!svgRef.current) return;
    const svgHtml = svgRef.current.outerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${productName}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
            .barcode-label { text-align: center; padding: 12px; border: 1px dashed #ccc; }
            .product-name { font-size: 11px; font-weight: bold; margin-bottom: 4px; max-width: 200px; word-wrap: break-word; }
            .price { font-size: 14px; font-weight: 900; margin-top: 4px; }
            @media print { .barcode-label { border: none; } }
          </style>
        </head>
        <body>
          <div class="barcode-label">
            <div class="product-name">${productName}</div>
            ${svgHtml}
            ${price ? `<div class="price">Rs. ${price.toLocaleString()}</div>` : ''}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!value) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
        <BarcodeIcon className="w-4 h-4" />
        No barcode assigned
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-white rounded-lg p-1 border border-slate-200 dark:border-slate-700">
        <svg ref={(el) => { svgRef.current = el; renderBarcode(el); }} />
      </div>
      {showPrint && (
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          title="Print Barcode Label"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      )}
    </div>
  );
}
