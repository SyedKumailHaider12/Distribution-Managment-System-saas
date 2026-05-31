import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
    textTransform: 'uppercase',
    marginTop: 10,
    letterSpacing: 2,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  infoBox: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  netAmountBox: {
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 8,
    color: 'white',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netAmountLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  netAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 30,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  col1: { width: '30%', paddingLeft: 10 },
  col2: { width: '20%', textAlign: 'center' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '10%', textAlign: 'center' },
  col5: { width: '15%', textAlign: 'right', paddingRight: 10 },
  col6: { width: '15%', textAlign: 'right', paddingRight: 10 },
  
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  summaryBox: {
    width: '35%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  netTotalRow: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  
  notesSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#b45309',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#d97706',
    fontStyle: 'italic',
  },
  
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: 150,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  branding: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 4,
  }
});

interface Props {
  invoice: any;
  appSettings: any;
  currency: string;
}

const PurchaseInvoicePDF = ({ invoice, appSettings, currency }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{appSettings?.company_name || 'AZANTECH DMS'}</Text>
        <Text style={styles.companyDetails}>{appSettings?.company_address || 'Business Address'}</Text>
        <Text style={styles.companyDetails}>
          {appSettings?.company_phone ? `Phone: ${appSettings.company_phone}` : ''} 
          {appSettings?.company_email ? ` | Email: ${appSettings.company_email}` : ''}
        </Text>
        <Text style={styles.reportTitle}>Purchase Invoice Report</Text>
      </View>

      {/* Info Boxes */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Invoice Metadata</Text>
          <Text style={styles.infoText}>Invoice #: {invoice.invoiceNumber}</Text>
          <Text style={styles.infoText}>Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</Text>
          <Text style={styles.infoText}>Warehouse: {invoice.warehouse.name}</Text>
          <Text style={styles.infoText}>Branch: {invoice.branch.name}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Supplier Information</Text>
          <Text style={styles.infoText}>{invoice.supplier.name}</Text>
          <Text style={styles.companyDetails}>{invoice.supplier.company?.name}</Text>
          {invoice.supplier.phone && (
            <Text style={[styles.companyDetails, { marginTop: 4 }]}>Phone: {invoice.supplier.phone}</Text>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>Product Details</Text>
          <Text style={styles.col2}>Batch & Expiry</Text>
          <Text style={styles.col3}>Qty</Text>
          <Text style={styles.col4}>Bonus</Text>
          <Text style={styles.col5}>Rate</Text>
          <Text style={styles.col6}>Subtotal</Text>
        </View>
        {invoice.items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={{ fontWeight: 'bold' }}>{item.product.name}</Text>
              <Text style={{ fontSize: 7, color: '#94a3b8' }}>{item.product.genericName}</Text>
            </View>
            <View style={styles.col2}>
              <Text>{item.batch.batchNumber}</Text>
              {item.batch.expiryDate && (
                <Text style={{ fontSize: 7, color: '#ef4444' }}>Exp: {new Date(item.batch.expiryDate).toLocaleDateString()}</Text>
              )}
            </View>
            <Text style={[styles.col3, { fontWeight: 'bold' }]}>{item.quantity}</Text>
            <Text style={[styles.col4, { color: '#10b981', fontWeight: 'bold' }]}>+{item.bonus}</Text>
            <Text style={styles.col5}>{currency}{item.purchasePrice.toFixed(2)}</Text>
            <Text style={[styles.col6, { fontWeight: 'bold', color: '#4f46e5' }]}>{currency}{item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Financial Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Total</Text>
            <Text style={styles.summaryValue}>{currency}{invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>-{currency}{invoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.summaryRow, styles.netTotalRow]}>
            <Text style={[styles.summaryLabel, { color: 'white' }]}>Net Total</Text>
            <Text style={[styles.summaryValue, { color: 'white' }]}>{currency}{invoice.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Internal Remarks</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Authorized Signature</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Receiver's Stamp</Text>
        </View>
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.branding}>Generated by AzanTech DMS • Software Excellence</Text>
      </View>
    </Page>
  </Document>
);

export default PurchaseInvoicePDF;
