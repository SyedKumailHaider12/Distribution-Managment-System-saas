'use client';

import { useEffect } from 'react';

interface RetailThermalSlipProps {
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    totalAmount: number;
    discount: number;
    netAmount: number;
    paidAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      salePrice: number;
      subtotal: number;
    }>;
  };
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  settings: {
    invoiceHeader?: string;
    invoiceFooter?: string;
    currency?: string;
  };
  cashier: string;
  autoPrint?: boolean;
}

export default function RetailThermalSlip({
  invoice,
  organization,
  settings,
  cashier,
  autoPrint = false,
}: RetailThermalSlipProps) {
  const currency = settings.currency || 'PKR';
  const change = invoice.paidAmount - invoice.netAmount;

  useEffect(() => {
    if (autoPrint) {
      setTimeout(() => window.print(), 500);
    }
  }, [autoPrint]);

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-slip,
          .thermal-slip * {
            visibility: visible;
          }
          .thermal-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 72mm;
            margin: 0;
            padding: 0;
          }
          @page {
            size: 72mm auto;
            margin: 0;
          }
        }
      `}</style>

      <div className="thermal-slip" style={{ 
        width: '72mm', 
        fontFamily: 'monospace', 
        fontSize: '11px', 
        padding: '4mm',
        lineHeight: '1.4'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            {organization.name}
          </div>
          {organization.address && (
            <div style={{ fontSize: '9px' }}>{organization.address}</div>
          )}
          {organization.phone && (
            <div style={{ fontSize: '9px' }}>Tel: {organization.phone}</div>
          )}
          {organization.email && (
            <div style={{ fontSize: '9px' }}>{organization.email}</div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Invoice Type */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '4px 0' }}>
          RETAIL INVOICE
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Invoice Info */}
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>
          <div>Invoice: {invoice.invoiceNumber}</div>
          <div>
            Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')} {' '}
            {new Date(invoice.invoiceDate).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          <div>Cashier: {cashier}</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Items Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontWeight: 'bold',
          fontSize: '10px',
          marginBottom: '2px'
        }}>
          <span style={{ flex: '2' }}>Item</span>
          <span style={{ width: '20px', textAlign: 'center' }}>Qty</span>
          <span style={{ width: '40px', textAlign: 'right' }}>Amt</span>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '2px 0' }}></div>

        {/* Items */}
        {invoice.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '4px', fontSize: '10px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <span style={{ 
                flex: '2', 
                wordWrap: 'break-word',
                paddingRight: '4px'
              }}>
                {item.productName}
              </span>
              <span style={{ width: '20px', textAlign: 'center' }}>
                {item.quantity}
              </span>
              <span style={{ width: '40px', textAlign: 'right' }}>
                {item.subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Totals */}
        <div style={{ fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Gross Total:</span>
            <span>{currency} {invoice.totalAmount.toFixed(2)}</span>
          </div>
          {invoice.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Discount:</span>
              <span>-{currency} {invoice.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontWeight: 'bold',
            fontSize: '12px',
            marginTop: '4px',
            marginBottom: '2px'
          }}>
            <span>NET TOTAL:</span>
            <span>{currency} {invoice.netAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Paid:</span>
            <span>{currency} {invoice.paidAmount.toFixed(2)}</span>
          </div>
          {change > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Change:</span>
              <span>{currency} {change.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Footer */}
        {settings.invoiceHeader && (
          <div style={{ fontSize: '9px', textAlign: 'center', marginBottom: '4px' }}>
            {settings.invoiceHeader}
          </div>
        )}

        {settings.invoiceFooter && (
          <div style={{ fontSize: '8px', marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Return Policy:</div>
            <div>{settings.invoiceFooter}</div>
          </div>
        )}

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px' }}>
          <div style={{ fontWeight: 'bold' }}>Thank you for shopping!</div>
          <div style={{ fontSize: '8px', marginTop: '2px' }}>Powered by AzanTech DMS</div>
        </div>
      </div>
    </>
  );
}
