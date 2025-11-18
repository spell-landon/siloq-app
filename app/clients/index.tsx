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
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency } from '@/lib/utils';
import type { Client } from '@/lib/types/database';
import { COLORS } from '@/lib/theme';

type TabType = 'all' | 'active';

interface ClientWithTotal extends Client {
  totalBilled?: number;
  invoiceCount?: number;
}

export default function ClientsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [clients, setClients] = useState<ClientWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    loadClients();
  }, [activeTab]);

  const loadClients = async () => {
    if (!user) return;

    try {
      // Build query for clients
      let query = supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (activeTab === 'active') {
        query = query.eq('is_active', true);
      }

      const { data: clientsData, error: clientsError } = await query;

      if (clientsError) throw clientsError;

      // Get invoice totals for each client
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('client_id, total')
        .eq('user_id', user.id);

      if (invoicesError) throw invoicesError;

      // Calculate totals per client
      const clientTotals = (invoicesData || []).reduce((acc, invoice) => {
        if (invoice.client_id) {
          if (!acc[invoice.client_id]) {
            acc[invoice.client_id] = { total: 0, count: 0 };
          }
          acc[invoice.client_id].total += invoice.total || 0;
          acc[invoice.client_id].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      // Merge client data with totals
      const clientsWithTotals = (clientsData || []).map((client) => ({
        ...client,
        totalBilled: clientTotals[client.id]?.total || 0,
        invoiceCount: clientTotals[client.id]?.count || 0,
      }));

      setClients(clientsWithTotals);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  // Filter clients based on search query
  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = client.name?.toLowerCase().includes(query);
    const matchesEmail = client.email?.toLowerCase().includes(query);
    const matchesPhone = client.phone?.toLowerCase().includes(query);
    const matchesContact = client.contact_person?.toLowerCase().includes(query);

    return matchesName || matchesEmail || matchesPhone || matchesContact;
  });

  // Group clients alphabetically
  const groupedClients = filteredClients.reduce((acc, client) => {
    const firstLetter = client.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(client);
    return acc;
  }, {} as Record<string, ClientWithTotal[]>);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.accent[400] }}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          edges={['top']}
          style={{ flex: 0, backgroundColor: COLORS.accent[400] }}
        />
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={COLORS.primary[600]} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.accent[400] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        edges={['top']}
        style={{ flex: 0, backgroundColor: COLORS.accent[400] }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Clients</Text>
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
                placeholder='Search clients...'
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
              style={[styles.tab, activeTab === 'active' && styles.tabActive]}
              onPress={() => setActiveTab('active')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'active' && styles.tabTextActive,
                ]}>
                Active
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Client List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {Object.keys(groupedClients).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='people-outline'
                size={64}
                color={COLORS.gray[500]}
              />
              <Text style={styles.emptyTitle}>No clients yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add your first client
              </Text>
            </View>
          ) : (
            Object.keys(groupedClients)
              .sort()
              .map((letter) => (
                <View key={letter} style={styles.letterGroup}>
                  {/* Letter Header */}
                  <View style={styles.letterHeader}>
                    <Text style={styles.letterText}>{letter}</Text>
                  </View>

                  {/* Clients */}
                  {groupedClients[letter].map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.clientCard}
                      onPress={() => router.push(`/clients/${client.id}`)}>
                      <View style={styles.clientContent}>
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName}>{client.name}</Text>
                          {client.contact_person && (
                            <Text style={styles.clientContact}>
                              {client.contact_person}
                            </Text>
                          )}
                          <View style={styles.clientMeta}>
                            {client.email && (
                              <View style={styles.metaItem}>
                                <Ionicons
                                  name='mail-outline'
                                  size={14}
                                  color={COLORS.gray[500]}
                                />
                                <Text style={styles.metaText}>
                                  {client.email}
                                </Text>
                              </View>
                            )}
                            {client.phone && (
                              <View style={styles.metaItem}>
                                <Ionicons
                                  name='call-outline'
                                  size={14}
                                  color={COLORS.gray[500]}
                                />
                                <Text style={styles.metaText}>
                                  {client.phone}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.clientStats}>
                          <Text style={styles.totalBilled}>
                            {formatCurrency(client.totalBilled || 0)}
                          </Text>
                          <Text style={styles.invoiceCount}>
                            {client.invoiceCount || 0}{' '}
                            {client.invoiceCount === 1 ? 'invoice' : 'invoices'}
                          </Text>
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
          onPress={() => router.push('/clients/new')}>
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
    backgroundColor: COLORS.accent[400],
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
    paddingHorizontal: 12,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.white,
  },
  tabText: {
    fontSize: 15,
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
  letterGroup: {
    marginBottom: 0,
  },
  letterHeader: {
    backgroundColor: COLORS.gray[100],
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  letterText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[700],
    textTransform: 'uppercase',
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  clientContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  clientInfo: {
    flex: 1,
    marginRight: 16,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  clientContact: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 6,
  },
  clientMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  clientStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalBilled: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent[400],
    marginBottom: 2,
  },
  invoiceCount: {
    fontSize: 12,
    color: COLORS.gray[500],
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
