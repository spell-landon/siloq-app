import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COLORS } from '@/lib/theme';
import type { Invoice } from '@/lib/types';

type TabType = 'all' | 'outstanding' | 'paid';

export default function InvoicesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [activeTab]);

  const loadInvoices = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (activeTab === 'outstanding') {
        query = query.in('status', ['sent', 'overdue', 'partial', 'draft']);
      } else if (activeTab === 'paid') {
        query = query.eq('status', 'paid');
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
      case 'partial':
        return COLORS.accent[400];
      case 'overdue':
        return COLORS.error;
      case 'sent':
        return COLORS.warning;
      default:
        return COLORS.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesClient = invoice.bill_to_name?.toLowerCase().includes(query);
    const matchesNumber = invoice.invoice_number?.toLowerCase().includes(query);
    const matchesAmount = invoice.total?.toString().includes(query);

    return matchesClient || matchesNumber || matchesAmount;
  });

  // Group invoices by year
  const groupedInvoices = filteredInvoices.reduce((acc, invoice) => {
    const year = new Date(invoice.date).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(invoice);
    return acc;
  }, {} as Record<string, Invoice[]>);

  const getYearTotal = (invoices: Invoice[]) => {
    return invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary[600] }}>
        <SafeAreaView style={styles.container}>
          <StatusBar style='light' />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={COLORS.primary[600]} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary[600] }}>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 0, backgroundColor: COLORS.primary[600] }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar style='light' />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Invoices</Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                setSearchVisible(!searchVisible);
                if (searchVisible) {
                  setSearchQuery(''); // Clear search when closing
                }
              }}>
              <Ionicons
                name={searchVisible ? 'close-outline' : 'search-outline'}
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          {searchVisible && (
            <View style={styles.searchContainer}>
              <Ionicons
                name='search-outline'
                size={20}
                color={COLORS.gray[400]}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder='Search invoices...'
                placeholderTextColor={COLORS.gray[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name='close-circle'
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'all' && styles.tabTextActive,
                ]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'outstanding' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('outstanding')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'outstanding' && styles.tabTextActive,
                ]}>
                Outstanding
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'paid' && styles.tabActive]}
              onPress={() => setActiveTab('paid')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'paid' && styles.tabTextActive,
                ]}>
                Paid
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invoice List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {Object.keys(groupedInvoices).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='document-text-outline'
                size={64}
                color={COLORS.gray[400]}
              />
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to create your first invoice
              </Text>
            </View>
          ) : (
            Object.keys(groupedInvoices)
              .sort((a, b) => parseInt(b) - parseInt(a))
              .map((year) => (
                <View key={year} style={styles.yearGroup}>
                  {/* Year Header */}
                  <View style={styles.yearHeader}>
                    <Text style={styles.yearText}>{year}</Text>
                    <Text style={styles.yearText}>
                      {formatCurrency(getYearTotal(groupedInvoices[year]))}
                    </Text>
                  </View>

                  {/* Invoices */}
                  {groupedInvoices[year].map((invoice) => (
                    <TouchableOpacity
                      key={invoice.id}
                      style={styles.invoiceCard}
                      onPress={() => router.push(`/invoices/${invoice.id}`)}>
                      <View style={styles.invoiceHeader}>
                        <View style={styles.invoiceHeaderLeft}>
                          <Text style={styles.clientName}>
                            {invoice.bill_to_name || 'No Client'}
                          </Text>
                          <Text style={styles.invoiceNumber}>
                            {invoice.invoice_number}
                          </Text>
                        </View>
                        <View style={styles.invoiceHeaderRight}>
                          <Text style={styles.invoiceAmount}>
                            {formatCurrency(invoice.total)}
                          </Text>
                          {invoice.status === 'paid' ? (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: COLORS.success },
                              ]}>
                              <Text style={styles.statusText}>Paid</Text>
                            </View>
                          ) : (
                            <Text
                              style={[
                                styles.dueDate,
                                { color: getStatusColor(invoice.status || '') },
                              ]}>
                              {invoice.due_date
                                ? `Due ${formatDate(invoice.due_date, 'short')}`
                                : getStatusText(invoice.status || 'draft')}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/invoices/new')}>
          <Ionicons name='add' size={28} color={COLORS.white} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
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
  header: {
    backgroundColor: COLORS.primary[600],
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    paddingVertical: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.white,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  yearGroup: {
    marginBottom: 24,
  },
  yearHeader: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  invoiceCard: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  invoiceHeaderLeft: {
    flex: 1,
  },
  invoiceHeaderRight: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent[400],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
