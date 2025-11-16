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

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!user || !id) return;

    try {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
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
        </ScrollView>

        {/* Actions Menu */}
        {showActions && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <Ionicons
                name='share-outline'
                size={20}
                color={COLORS.gray[900]}
              />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            {invoice.status !== 'paid' && (
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
            )}
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
              onPress={handleMarkAsPaid}>
              <Text style={styles.primaryButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
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
});
