import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency, formatDate } from './utils';
import type { Invoice, LineItem } from './types';
import { COLORS } from './theme';

interface BusinessSettings {
  business_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

interface InvoicePDFData {
  invoice: Invoice;
  lineItems: LineItem[];
  businessSettings?: BusinessSettings;
}

/**
 * Generate professional invoice PDF HTML template (Ledgerly style)
 */
export const generateInvoiceHTML = ({
  invoice,
  lineItems,
  businessSettings,
}: InvoicePDFData): string => {

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1f2937;
            padding: 40px;
          }

          .page {
            max-width: 800px;
            margin: 0 auto;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
          }

          .title {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .invoice-number {
            font-size: 10pt;
            color: #666;
          }

          .date-section {
            text-align: right;
          }

          .date-line {
            font-size: 10pt;
            margin-bottom: 3px;
          }

          /* Address Section */
          .address-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }

          .address-block {
            width: 45%;
          }

          .section-title {
            font-size: 9pt;
            font-weight: bold;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .address-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .address-line {
            font-size: 10pt;
            margin-bottom: 3px;
          }

          /* Table */
          .table {
            margin-bottom: 30px;
          }

          .table-header {
            display: flex;
            background-color: #f3f4f6;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 5px;
          }

          .table-header-cell {
            font-size: 9pt;
            font-weight: bold;
            color: #374151;
          }

          .table-row {
            display: flex;
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }

          .table-cell {
            font-size: 10pt;
            color: #1f2937;
          }

          .description-col {
            width: 45%;
          }

          .rate-col {
            width: 20%;
            text-align: right;
          }

          .qty-col {
            width: 15%;
            text-align: right;
          }

          .amount-col {
            width: 20%;
            text-align: right;
          }

          .item-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .item-description {
            font-size: 9pt;
            color: #6b7280;
            line-height: 1.4;
          }

          /* Totals */
          .totals-section {
            margin-left: auto;
            width: 40%;
            margin-bottom: 30px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .total-label {
            font-size: 10pt;
            color: #666;
          }

          .total-value {
            font-size: 10pt;
            font-weight: bold;
          }

          .grand-total-row {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            margin-top: 8px;
          }

          .grand-total-label {
            font-size: 12pt;
            font-weight: bold;
          }

          .grand-total-value {
            font-size: 12pt;
            font-weight: bold;
          }

          .balance-due-row {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
          }

          .balance-due-label {
            font-size: 12pt;
            font-weight: bold;
            color: #059669;
          }

          .balance-due-value {
            font-size: 12pt;
            font-weight: bold;
            color: #059669;
          }

          /* Notes */
          .notes-section {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-bottom: 30px;
          }

          .notes-text {
            font-size: 9pt;
            color: #666;
            line-height: 1.5;
          }

          /* Footer */
          .footer {
            text-align: center;
            font-size: 8pt;
            color: #999;
            margin-top: 60px;
          }

          @media print {
            body {
              padding: 40px;
            }

            @page {
              margin: 0.5in;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div>
              <div class="title">INVOICE</div>
              <div class="invoice-number">${invoice.invoice_number || ''}</div>
            </div>
            <div class="date-section">
              <div class="date-line"><strong>Date:</strong> ${formatDate(invoice.date, 'short')}</div>
              ${
                invoice.due_date
                  ? `<div class="date-line"><strong>Due Date:</strong> ${formatDate(invoice.due_date, 'short')}</div>`
                  : ''
              }
            </div>
          </div>

          <!-- From and Bill To -->
          <div class="address-section">
            <!-- From -->
            <div class="address-block">
              <div class="section-title">From</div>
              ${businessSettings?.business_name ? `<div class="address-name">${businessSettings.business_name}</div>` : ''}
              ${businessSettings?.address ? `<div class="address-line">${businessSettings.address}</div>` : ''}
              ${
                businessSettings?.city || businessSettings?.state || businessSettings?.zip
                  ? `<div class="address-line">${businessSettings?.city || ''} ${businessSettings?.state || ''} ${businessSettings?.zip || ''}</div>`
                  : ''
              }
              ${businessSettings?.email ? `<div class="address-line">${businessSettings.email}</div>` : ''}
              ${businessSettings?.phone ? `<div class="address-line">${businessSettings.phone}</div>` : ''}
              ${businessSettings?.tax_id ? `<div class="address-line">Tax ID: ${businessSettings.tax_id}</div>` : ''}
            </div>

            <!-- Bill To -->
            <div class="address-block">
              <div class="section-title">Bill To</div>
              ${invoice.bill_to_name ? `<div class="address-name">${invoice.bill_to_name}</div>` : ''}
              ${invoice.bill_to_address ? `<div class="address-line">${invoice.bill_to_address}</div>` : ''}
              ${invoice.bill_to_email ? `<div class="address-line">${invoice.bill_to_email}</div>` : ''}
              ${invoice.bill_to_phone ? `<div class="address-line">Phone: ${invoice.bill_to_phone}</div>` : ''}
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="table">
            <!-- Table Header -->
            <div class="table-header">
              <div class="table-header-cell description-col">Description</div>
              <div class="table-header-cell rate-col">Rate</div>
              <div class="table-header-cell qty-col">Qty</div>
              <div class="table-header-cell amount-col">Amount</div>
            </div>

            <!-- Table Rows -->
            ${lineItems
              .map(
                (item) => `
              <div class="table-row">
                <div class="description-col">
                  <div class="item-name">${item.description || ''}</div>
                </div>
                <div class="table-cell rate-col">${formatCurrency(item.rate || 0)}</div>
                <div class="table-cell qty-col">${item.quantity || 0}</div>
                <div class="table-cell amount-col">${formatCurrency(item.amount || 0)}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <!-- Totals -->
          <div class="totals-section">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div class="total-value">${formatCurrency(invoice.subtotal || 0)}</div>
            </div>
            ${
              invoice.tax > 0
                ? `
            <div class="total-row">
              <div class="total-label">Tax:</div>
              <div class="total-value">${formatCurrency(invoice.tax || 0)}</div>
            </div>
            `
                : ''
            }
            ${
              invoice.discount > 0
                ? `
            <div class="total-row">
              <div class="total-label">Discount:</div>
              <div class="total-value">-${formatCurrency(invoice.discount || 0)}</div>
            </div>
            `
                : ''
            }
            <div class="grand-total-row">
              <div class="grand-total-label">Total:</div>
              <div class="grand-total-value">${formatCurrency(invoice.total || 0)}</div>
            </div>
            ${
              invoice.balance_due > 0
                ? `
            <div class="balance-due-row">
              <div class="balance-due-label">Balance Due:</div>
              <div class="balance-due-value">${formatCurrency(invoice.balance_due || 0)}</div>
            </div>
            `
                : ''
            }
          </div>

          <!-- Notes -->
          ${
            invoice.notes
              ? `
          <div class="notes-section">
            <div class="section-title">Notes</div>
            <div class="notes-text">${invoice.notes}</div>
          </div>
          `
              : ''
          }

          <!-- Footer -->
          <div class="footer">
            Generated by Siloq • ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate and download invoice PDF
 */
export const generateInvoicePDF = async (
  data: InvoicePDFData
): Promise<string> => {
  try {
    const html = generateInvoiceHTML(data);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Generate and share invoice PDF
 */
export const shareInvoicePDF = async (data: InvoicePDFData): Promise<void> => {
  try {
    const pdfUri = await generateInvoicePDF(data);
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice ${data.invoice.invoice_number}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};

/**
 * Print invoice PDF (native print dialog)
 */
export const printInvoicePDF = async (data: InvoicePDFData): Promise<void> => {
  try {
    const html = generateInvoiceHTML(data);
    await Print.printAsync({
      html,
    });
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw new Error('Failed to print invoice');
  }
};
