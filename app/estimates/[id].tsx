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
import type { Estimate, LineItem } from '@/lib/types';
import { COLORS } from '@/lib/theme';

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadEstimate();
  }, [id]);

  const loadEstimate = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setEstimate(data);
      if (data.line_items) {
        setLineItems(typeof data.line_items === 'string'
          ? JSON.parse(data.line_items)
          : data.line_items);
      }
    } catch (error) {
      console.error('Error loading estimate:', error);
      Alert.alert('Error', 'Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!estimate || !user) return;

    Alert.alert(
      'Convert to Invoice',
      'This will create a new invoice from this estimate. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            setConverting(true);
            try {
              // Generate new invoice number
              const { data: lastInvoice } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

              let invoiceNumber = 'INV-0001';
              if (lastInvoice && lastInvoice.length > 0) {
                const lastNumber = parseInt(lastInvoice[0].invoice_number.replace(/\D/g, '')) || 0;
                invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;
              }

              // Create invoice from estimate
              const { data: newInvoice, error } = await supabase
                .from('invoices')
                .insert({
                  user_id: user.id,
                  client_id: estimate.client_id,
                  invoice_number: invoiceNumber,
                  date: new Date().toISOString().split('T')[0],
                  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                  terms: 'Net 30',
                  status: 'draft',
                  bill_to_name: estimate.bill_to_name,
                  bill_to_email: estimate.bill_to_email,
                  bill_to_address: estimate.bill_to_address,
                  bill_to_phone: estimate.bill_to_phone,
                  line_items: estimate.line_items,
                  subtotal: estimate.subtotal,
                  tax: estimate.tax,
                  discount: estimate.discount,
                  total: estimate.total,
                  balance_due: estimate.total,
                  notes: estimate.notes,
                })
                .select()
                .single();

              if (error) throw error;

              // Update estimate status
              await supabase
                .from('estimates')
                .update({
                  status: 'accepted',
                  converted_to_invoice_id: newInvoice.id,
                })
                .eq('id', estimate.id);

              Alert.alert('Success', 'Invoice created successfully', [
                {
                  text: 'View Invoice',
                  onPress: () => router.push(`/invoices/${newInvoice.id}`),
                },
              ]);
            } catch (error: any) {
              console.error('Error converting to invoice:', error);
              Alert.alert('Error', error.message || 'Failed to convert to invoice');
            } finally {
              setConverting(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Estimate',
      'Are you sure you want to delete this estimate? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('estimates')
                .delete()
                .eq('id', estimate?.id);

              if (error) throw error;

              Alert.alert('Success', 'Estimate deleted', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error deleting estimate:', error);
              Alert.alert('Error', error.message || 'Failed to delete estimate');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!estimate) return;

    try {
      await Share.share({
        message: `Estimate ${estimate.estimate_number}\nClient: ${estimate.bill_to_name}\nTotal: ${formatCurrency(estimate.total || 0)}\nExpires: ${formatDate(estimate.expiry_date || '', 'short')}`,
        title: `Estimate ${estimate.estimate_number}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return COLORS.success;
      case 'expired':
        return COLORS.muted;
      case 'rejected':
        return COLORS.destructive;
      case 'pending':
        return COLORS.info;
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
        <Stack.Screen options={{ title: 'Estimate Details', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent[400]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!estimate) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Estimate Details', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Estimate not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: estimate.estimate_number,
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowActions(!showActions)}>
              <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.gray[900]} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: getStatusColor(estimate.status || 'pending') }]}>
            <Text style={styles.statusText}>{getStatusText(estimate.status || 'pending')}</Text>
          </View>

          {/* Estimate Header */}
          <View style={styles.section}>
            <Text style={styles.estimateNumber}>{estimate.estimate_number}</Text>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{formatDate(estimate.date, 'long')}</Text>
              </View>
              <View>
                <Text style={styles.label}>Expires</Text>
                <Text style={styles.value}>{formatDate(estimate.expiry_date || '', 'long')}</Text>
              </View>
            </View>
          </View>

          {/* Bill To Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{estimate.bill_to_name}</Text>
            {estimate.bill_to_email && <Text style={styles.detail}>{estimate.bill_to_email}</Text>}
            {estimate.bill_to_phone && <Text style={styles.detail}>{estimate.bill_to_phone}</Text>}
            {estimate.bill_to_address && <Text style={styles.detail}>{estimate.bill_to_address}</Text>}
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {lineItems.map((item, index) => (
              <View key={item.id || index} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
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
              <Text style={styles.totalValue}>{formatCurrency(estimate.subtotal || 0)}</Text>
            </View>
            {estimate.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(estimate.tax || 0)}</Text>
              </View>
            )}
            {estimate.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>-{formatCurrency(estimate.discount || 0)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(estimate.total || 0)}</Text>
            </View>
          </View>

          {/* Notes */}
          {estimate.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{estimate.notes}</Text>
            </View>
          )}
        </ScrollView>

        {/* Actions Menu */}
        {showActions && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={COLORS.gray[900]} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            {estimate.status !== 'accepted' && !estimate.converted_to_invoice_id && (
              <TouchableOpacity style={styles.actionItem} onPress={handleConvertToInvoice}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.accent[400]} />
                <Text style={[styles.actionText, { color: COLORS.accent[400] }]}>Convert to Invoice</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Primary Action Button */}
        {estimate.status !== 'accepted' && !estimate.converted_to_invoice_id && (
          <View style={styles.primaryActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConvertToInvoice}
              disabled={converting}
            >
              {converting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Convert to Invoice</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: COLORS.gray[500] },
  scrollView: { flex: 1 },
  statusBanner: { paddingVertical: 12, alignItems: 'center' },
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
  estimateNumber: { fontSize: 24, fontWeight: '700', color: COLORS.gray[900], marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: { fontSize: 13, color: COLORS.gray[500], marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '500', color: COLORS.gray[900] },
  clientName: { fontSize: 18, fontWeight: '600', color: COLORS.gray[900], marginBottom: 4 },
  detail: { fontSize: 15, color: COLORS.gray[500], marginBottom: 2 },
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
  itemDescription: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.gray[900] },
  itemAmount: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  itemDetails: { fontSize: 14, color: COLORS.gray[500] },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: { fontSize: 15, color: COLORS.gray[900] },
  totalValue: { fontSize: 15, fontWeight: '600', color: COLORS.gray[900] },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: COLORS.gray[200],
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  grandTotalValue: { fontSize: 20, fontWeight: '700', color: COLORS.accent[400] },
  notesText: { fontSize: 15, color: COLORS.gray[900], lineHeight: 22 },
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
  actionText: { fontSize: 16, fontWeight: '500', color: COLORS.gray[900] },
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
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
