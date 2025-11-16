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
import type { Estimate } from '@/lib/types';
import { COLORS } from '@/lib/theme';

type TabType = 'all' | 'pending' | 'accepted' | 'expired';

export default function EstimatesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    loadEstimates();
  }, [activeTab]);

  const loadEstimates = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('estimates')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      } else if (activeTab === 'accepted') {
        query = query.eq('status', 'accepted');
      } else if (activeTab === 'expired') {
        query = query.eq('status', 'expired');
      }

      const { data, error } = await query;

      if (error) throw error;
      setEstimates(data || []);
    } catch (error) {
      console.error('Error loading estimates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEstimates();
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

  // Filter estimates based on search query
  const filteredEstimates = estimates.filter((estimate) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesClient = estimate.bill_to_name?.toLowerCase().includes(query);
    const matchesNumber = estimate.estimate_number?.toLowerCase().includes(query);
    const matchesAmount = estimate.total?.toString().includes(query);

    return matchesClient || matchesNumber || matchesAmount;
  });

  // Group estimates by year
  const groupedEstimates = filteredEstimates.reduce((acc, estimate) => {
    const year = new Date(estimate.date).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(estimate);
    return acc;
  }, {} as Record<string, Estimate[]>);

  const getYearTotal = (estimates: Estimate[]) => {
    return estimates.reduce((sum, est) => sum + (est.total || 0), 0);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.accent[400] }}>
        <SafeAreaView
          edges={['top']}
          style={{ flex: 0, backgroundColor: COLORS.accent[400] }}
        />
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          <StatusBar style='light' />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={COLORS.primary[600]} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.accent[400] }}>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 0, backgroundColor: COLORS.accent[400] }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar style='light' />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Estimates</Text>
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
                placeholder='Search estimates...'
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
              style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
              onPress={() => setActiveTab('pending')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'pending' && styles.tabTextActive,
                ]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'accepted' && styles.tabActive]}
              onPress={() => setActiveTab('accepted')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'accepted' && styles.tabTextActive,
                ]}>
                Accepted
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'expired' && styles.tabActive]}
              onPress={() => setActiveTab('expired')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'expired' && styles.tabTextActive,
                ]}>
                Expired
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estimate List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {Object.keys(groupedEstimates).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='calculator-outline'
                size={64}
                color={COLORS.gray[500]}
              />
              <Text style={styles.emptyTitle}>No estimates yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to create your first estimate
              </Text>
            </View>
          ) : (
            Object.keys(groupedEstimates)
              .sort((a, b) => parseInt(b) - parseInt(a))
              .map((year) => (
                <View key={year} style={styles.yearGroup}>
                  {/* Year Header */}
                  <View style={styles.yearHeader}>
                    <Text style={styles.yearText}>
                      {year} -{' '}
                      {formatCurrency(getYearTotal(groupedEstimates[year]))}
                    </Text>
                  </View>

                  {/* Estimates */}
                  {groupedEstimates[year].map((estimate) => (
                    <TouchableOpacity
                      key={estimate.id}
                      style={styles.estimateCard}
                      onPress={() => router.push(`/estimates/${estimate.id}`)}>
                      <View style={styles.estimateHeader}>
                        <View style={styles.estimateHeaderLeft}>
                          <Text style={styles.clientName}>
                            {estimate.bill_to_name || 'No Client'}
                          </Text>
                          <Text style={styles.estimateNumber}>
                            {estimate.estimate_number}
                          </Text>
                        </View>
                        <View style={styles.estimateHeaderRight}>
                          <Text style={styles.estimateAmount}>
                            {formatCurrency(estimate.total)}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: getStatusColor(
                                  estimate.status || ''
                                ),
                              },
                            ]}>
                            <Text style={styles.statusText}>
                              {getStatusText(estimate.status || 'pending')}
                            </Text>
                          </View>
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
          onPress={() => router.push('/estimates/new')}>
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
  yearGroup: {
    marginBottom: 24,
  },
  yearHeader: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  estimateCard: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  estimateHeaderLeft: {
    flex: 1,
  },
  estimateHeaderRight: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  estimateNumber: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  estimateAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
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
