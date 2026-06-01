import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  infoBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
    border: '1 solid #ddd',
    padding: 10,
    borderRadius: 4,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  infoBoxText: {
    fontSize: 9,
    marginBottom: 3,
  },
  customerSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eee',
    padding: 8,
    fontSize: 9,
  },
  col1: { width: '5%' },
  col2: { width: '35%' },
  col3: { width: '15%' },
  col4: { width: '10%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '20%', textAlign: 'right' },
  summary: {
    marginLeft: 'auto',
    width: '40%',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 20,
  },
  signatureBox: {
    width: '30%',
    borderTop: '1 solid #333',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
});

interface DistributionInvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    status: string;
    totalAmount: number;
    discount: number;
    netAmount: number;
    paidAmount: number;
    customer: {
      name: string;
      address?: string;
      phone?: string;
    };
    salesman?: {
      name: string;
    };
    items: Array<{
      product: { name: string };
      batch: { batchNumber: string };
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
    website?: string;
    taxId?: string;
    logoUrl?: string;
  };
  settings: {
    currency?: string;
    invoiceShowLogo?: boolean;
  };
}

export default function DistributionInvoicePDF({
  invoice,
  organization,
  settings,
}: DistributionInvoicePDFProps) {
  const currency = settings.currency || 'PKR';
  const balanceDue = invoice.netAmount - invoice.paidAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {settings.invoiceShowLogo && organization.logoUrl && (
            <Image src={organization.logoUrl} style={{ width: 60, height: 60, marginBottom: 10 }} />
          )}
          <Text style={styles.companyName}>{organization.name}</Text>
          {organization.address && (
            <Text style={styles.companyInfo}>{organization.address}</Text>
          )}
          <Text style={styles.companyInfo}>
            {organization.phone && `Phone: ${organization.phone}`}
            {organization.email && ` | Email: ${organization.email}`}
            {organization.website && ` | ${organization.website}`}
          </Text>
          {organization.taxId && (
            <Text style={styles.companyInfo}>Tax ID: {organization.taxId}</Text>
          )}
        </View>

        {/* Info Boxes */}
        <View style={styles.infoBoxes}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>INVOICE INFO</Text>
            <Text style={styles.infoBoxText}>Invoice: {invoice.invoiceNumber}</Text>
            <Text style={styles.infoBoxText}>Status: {invoice.status}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>DATE & NUMBER</Text>
            <Text style={styles.infoBoxText}>
              Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}
            </Text>
            <Text style={styles.infoBoxText}>
              Time: {new Date(invoice.invoiceDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>TO:</Text>
          <Text style={styles.infoBoxText}>{invoice.customer.name}</Text>
          {invoice.customer.address && (
            <Text style={styles.infoBoxText}>{invoice.customer.address}</Text>
          )}
          {invoice.customer.phone && (
            <Text style={styles.infoBoxText}>Phone: {invoice.customer.phone}</Text>
          )}
          {invoice.salesman && (
            <Text style={styles.infoBoxText}>Salesman: {invoice.salesman.name}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Product</Text>
            <Text style={styles.col3}>Batch</Text>
            <Text style={styles.col4}>Qty</Text>
            <Text style={styles.col5}>Rate</Text>
            <Text style={styles.col6}>Subtotal</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.product.name}</Text>
              <Text style={styles.col3}>{item.batch.batchNumber}</Text>
              <Text style={styles.col4}>{item.quantity}</Text>
              <Text style={styles.col5}>{currency} {item.salePrice.toFixed(2)}</Text>
              <Text style={styles.col6}>{currency} {item.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Gross Total:</Text>
            <Text>{currency} {invoice.totalAmount.toFixed(2)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Discount:</Text>
              <Text>-{currency} {invoice.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text>NET TOTAL:</Text>
            <Text>{currency} {invoice.netAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Paid:</Text>
            <Text>{currency} {invoice.paidAmount.toFixed(2)}</Text>
          </View>
          {balanceDue > 0 && (
            <View style={styles.summaryRow}>
              <Text>Balance Due:</Text>
              <Text>{currency} {balanceDue.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Prepared By</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Checked By</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Stamp</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Powered by AzanTech DMS • Software Excellence</Text>
        </View>
      </Page>
    </Document>
  );
}
