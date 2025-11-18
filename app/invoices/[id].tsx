import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, LineItem } from '@/lib/types';
import { COLORS } from '@/lib/theme';
import {
  generateInvoicePDF,
  shareInvoicePDF,
  printInvoicePDF,
} from '@/lib/pdf-generator';
import { RecordPaymentModal, type PaymentData } from '@/components/RecordPaymentModal';
import type { Payment } from '@/lib/types';

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

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [businessSettings, setBusinessSettings] =
    useState<BusinessSettings | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!user || !id) return;

    try {
      // Load invoice
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setInvoice(data);
      if (data.line_items) {
        setLineItems(
          typeof data.line_items === 'string'
            ? JSON.parse(data.line_items)
            : data.line_items
        );
      }

      // Load business settings for PDF generation
      const { data: settings } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setBusinessSettings(settings);
      }

      // Load payments for this invoice
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', id)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          balance_due: 0,
        })
        .eq('id', invoice.id);

      if (error) throw error;

      Alert.alert('Success', 'Invoice marked as paid');
      loadInvoice();
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      Alert.alert('Error', error.message || 'Failed to update invoice');
    }
  };

  const handleMarkAsSent = async () => {
    if (!invoice) return;

    Alert.alert(
      'Mark as Sent',
      'This will update the invoice status to "Sent". Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sent',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('invoices')
                .update({
                  status: 'sent',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', invoice.id);

              if (error) throw error;

              Alert.alert('Success', 'Invoice marked as sent');
              loadInvoice();
            } catch (error: any) {
              console.error('Error marking as sent:', error);
              Alert.alert('Error', error.message || 'Failed to update invoice');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', invoice?.id);

              if (error) throw error;

              Alert.alert('Success', 'Invoice deleted', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error deleting invoice:', error);
              Alert.alert('Error', error.message || 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    if (!user || !invoice) return;

    Alert.alert(
      'Duplicate Invoice',
      'This will create a copy of this invoice with today\'s date.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              // Generate new invoice number
              const { data: existingInvoices } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

              let newInvoiceNumber = 'INV-0001';
              if (existingInvoices && existingInvoices.length > 0) {
                const lastNumber = existingInvoices[0].invoice_number;
                const match = lastNumber.match(/INV-(\d+)/);
                if (match) {
                  const nextNum = parseInt(match[1]) + 1;
                  newInvoiceNumber = `INV-${nextNum.toString().padStart(4, '0')}`;
                }
              }

              // Create duplicate invoice
              const today = new Date().toISOString().split('T')[0];
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 30);
              const dueDateStr = dueDate.toISOString().split('T')[0];

              const { data: newInvoice, error } = await supabase
                .from('invoices')
                .insert({
                  user_id: user.id,
                  client_id: invoice.client_id,
                  invoice_number: newInvoiceNumber,
                  date: today,
                  due_date: dueDateStr,
                  status: 'draft',
                  from_name: invoice.from_name,
                  from_email: invoice.from_email,
                  from_address: invoice.from_address,
                  from_phone: invoice.from_phone,
                  from_business_number: invoice.from_business_number,
                  from_website: invoice.from_website,
                  from_owner: invoice.from_owner,
                  bill_to_name: invoice.bill_to_name,
                  bill_to_email: invoice.bill_to_email,
                  bill_to_address: invoice.bill_to_address,
                  bill_to_phone: invoice.bill_to_phone,
                  bill_to_mobile: invoice.bill_to_mobile,
                  bill_to_fax: invoice.bill_to_fax,
                  line_items: invoice.line_items,
                  subtotal: invoice.subtotal,
                  discount: invoice.discount,
                  tax: invoice.tax,
                  total: invoice.total,
                  balance_due: invoice.total,
                  notes: invoice.notes,
                  payment_instructions: invoice.payment_instructions,
                })
                .select()
                .single();

              if (error) throw error;

              Alert.alert('Success', 'Invoice duplicated successfully', [
                {
                  text: 'View',
                  onPress: () => router.push(`/invoices/${newInvoice.id}`),
                },
                { text: 'OK' },
              ]);
            } catch (error: any) {
              console.error('Error duplicating invoice:', error);
              Alert.alert('Error', error.message || 'Failed to duplicate invoice');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!invoice) return;

    try {
      await Share.share({
        message: `Invoice ${invoice.invoice_number}\nClient: ${
          invoice.bill_to_name
        }\nTotal: ${formatCurrency(invoice.total || 0)}\nDue: ${formatDate(
          invoice.due_date || '',
          'short'
        )}`,
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    setGeneratingPDF(true);
    setShowActions(false);

    try {
      const pdfUri = await generateInvoicePDF({
        invoice,
        lineItems,
        businessSettings: businessSettings || undefined,
      });

      Alert.alert(
        'PDF Generated',
        'Invoice PDF has been created successfully.',
        [
          {
            text: 'Share',
            onPress: () => handleSharePDF(),
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', error.message || 'Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSharePDF = async () => {
    if (!invoice) return;

    setGeneratingPDF(true);
    setShowActions(false);

    try {
      await shareInvoicePDF({
        invoice,
        lineItems,
        businessSettings: businessSettings || undefined,
      });
    } catch (error: any) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', error.message || 'Failed to share PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!invoice) return;

    setGeneratingPDF(true);
    setShowActions(false);

    try {
      await printInvoicePDF({
        invoice,
        lineItems,
        businessSettings: businessSettings || undefined,
      });
    } catch (error: any) {
      console.error('Error printing PDF:', error);
      Alert.alert('Error', error.message || 'Failed to print invoice');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleRecordPayment = async (paymentData: PaymentData) => {
    if (!user || !invoice) return;

    try {
      // Insert payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: user.id,
        invoice_id: invoice.id,
        amount: paymentData.amount,
        date: paymentData.date,
        payment_method: paymentData.payment_method,
        reference: paymentData.reference || null,
        notes: paymentData.notes || null,
      });

      if (paymentError) throw paymentError;

      // Calculate total payments
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + paymentData.amount;
      const newBalanceDue = (invoice.total || 0) - totalPaid;

      // Determine new status
      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          balance_due: Math.max(0, newBalanceDue),
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      Alert.alert('Success', 'Payment recorded successfully');
      loadInvoice(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error recording payment:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
      case 'partial':
        return COLORS.accent[400];
      case 'overdue':
        return COLORS.destructive;
      case 'sent':
        return COLORS.warning;
      default:
        return COLORS.muted;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{ title: 'Invoice Details', headerShown: true }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.accent[400]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{ title: 'Invoice Details', headerShown: true }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Invoice not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: invoice.invoice_number,
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowActions(!showActions)}>
              <Ionicons
                name='ellipsis-horizontal'
                size={24}
                style={{ marginLeft: 6 }}
                color={COLORS.gray[900]}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          {/* Status Banner */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: getStatusColor(invoice.status || 'draft') },
            ]}>
            <Text style={styles.statusText}>
              {getStatusText(invoice.status || 'draft')}
            </Text>
          </View>

          {/* Invoice Header */}
          <View style={styles.section}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>
                  {formatDate(invoice.date, 'long')}
                </Text>
              </View>
              <View>
                <Text style={styles.label}>Due Date</Text>
                <Text style={styles.value}>
                  {formatDate(invoice.due_date || '', 'long')}
                </Text>
              </View>
            </View>
          </View>

          {/* Bill To Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{invoice.bill_to_name}</Text>
            {invoice.bill_to_email && (
              <Text style={styles.detail}>{invoice.bill_to_email}</Text>
            )}
            {invoice.bill_to_phone && (
              <Text style={styles.detail}>{invoice.bill_to_phone}</Text>
            )}
            {invoice.bill_to_address && (
              <Text style={styles.detail}>{invoice.bill_to_address}</Text>
            )}
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {lineItems.map((item, index) => (
              <View key={item.id || index} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                <Text style={styles.itemDetails}>
                  {item.quantity} × {formatCurrency(item.rate)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.section}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.subtotal || 0)}
              </Text>
            </View>
            {invoice.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.tax || 0)}
                </Text>
              </View>
            )}
            {invoice.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(invoice.discount || 0)}
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.total || 0)}
              </Text>
            </View>
            {invoice.status !== 'paid' && invoice.balance_due > 0 && (
              <View style={[styles.totalRow, styles.balanceRow]}>
                <Text style={styles.balanceLabel}>Balance Due</Text>
                <Text style={styles.balanceValue}>
                  {formatCurrency(invoice.balance_due || 0)}
                </Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              {payments.map((payment, index) => (
                <View
                  key={payment.id}
                  style={[
                    styles.paymentItem,
                    index < payments.length - 1 && styles.paymentItemBorder,
                  ]}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentLeft}>
                      <Ionicons
                        name='checkmark-circle'
                        size={20}
                        color={COLORS.success}
                      />
                      <Text style={styles.paymentMethod}>
                        {payment.payment_method
                          ?.split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ') || 'Payment'}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.date, 'long')}
                    </Text>
                    {payment.reference && (
                      <Text style={styles.paymentReference}>
                        Ref: {payment.reference}
                      </Text>
                    )}
                  </View>
                  {payment.notes && (
                    <Text style={styles.paymentNotes}>{payment.notes}</Text>
                  )}
                </View>
              ))}
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
                <Text style={styles.paymentSummaryValue}>
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions Menu */}
        {showActions && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleDownloadPDF}
              disabled={generatingPDF}>
              <Ionicons
                name='download-outline'
                size={20}
                color={COLORS.primary[600]}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: COLORS.primary[600] },
                  generatingPDF && { opacity: 0.5 },
                ]}>
                {generatingPDF ? 'Generating...' : 'Download PDF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleSharePDF}
              disabled={generatingPDF}>
              <Ionicons
                name='share-outline'
                size={20}
                color={COLORS.primary[600]}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: COLORS.primary[600] },
                  generatingPDF && { opacity: 0.5 },
                ]}>
                Share PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handlePrintPDF}
              disabled={generatingPDF}>
              <Ionicons
                name='print-outline'
                size={20}
                color={COLORS.gray[900]}
              />
              <Text
                style={[styles.actionText, generatingPDF && { opacity: 0.5 }]}>
                Print
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <Ionicons
                name='text-outline'
                size={20}
                color={COLORS.gray[900]}
              />
              <Text style={styles.actionText}>Share Text</Text>
            </TouchableOpacity>
            {invoice.status === 'draft' && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleMarkAsSent}>
                <Ionicons
                  name='send-outline'
                  size={20}
                  color={COLORS.warning}
                />
                <Text style={[styles.actionText, { color: COLORS.warning }]}>
                  Mark as Sent
                </Text>
              </TouchableOpacity>
            )}
            {invoice.status !== 'paid' && (
              <>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    setShowActions(false);
                    setShowPaymentModal(true);
                  }}>
                  <Ionicons
                    name='cash-outline'
                    size={20}
                    color={COLORS.accent[400]}
                  />
                  <Text style={[styles.actionText, { color: COLORS.accent[400] }]}>
                    Record Payment
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleMarkAsPaid}>
                  <Ionicons
                    name='checkmark-circle-outline'
                    size={20}
                    color={COLORS.success}
                  />
                  <Text style={[styles.actionText, { color: COLORS.success }]}>
                    Mark as Paid
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
              <Ionicons name='copy-outline' size={20} color={COLORS.gray[900]} />
              <Text style={styles.actionText}>Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name='trash-outline' size={20} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Primary Action Button */}
        {invoice.status !== 'paid' && (
          <View style={styles.primaryActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.primaryButtonText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        visible={showPaymentModal}
        invoiceId={invoice.id}
        invoiceTotal={invoice.total || 0}
        balanceDue={invoice.balance_due || invoice.total || 0}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleRecordPayment}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  scrollView: {
    flex: 1,
  },
  statusBanner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  detail: {
    fontSize: 15,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  lineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemDescription: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: COLORS.gray[900],
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: COLORS.gray[200],
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent[400],
  },
  balanceRow: {
    backgroundColor: COLORS.warning + '20',
    marginHorizontal: -16,
    marginBottom: -16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.warning,
  },
  notesText: {
    fontSize: 15,
    color: COLORS.gray[900],
    lineHeight: 22,
  },
  actionsMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  primaryActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  primaryButton: {
    backgroundColor: COLORS.accent[400],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  paymentItem: {
    paddingVertical: 12,
  },
  paymentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethod: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  paymentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 28,
  },
  paymentDate: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  paymentReference: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
  paymentNotes: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 4,
    marginLeft: 28,
    fontStyle: 'italic',
  },
  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.gray[300],
  },
  paymentSummaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  paymentSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
});
