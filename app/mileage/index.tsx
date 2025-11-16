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
import type { Mileage } from '@/lib/types';

type TabType = 'all' | 'business' | 'personal';

export default function MileageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [mileageTrips, setMileageTrips] = useState<Mileage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    loadMileage();
  }, [activeTab]);

  const loadMileage = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('mileage')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (activeTab === 'business') {
        query = query.eq('is_business', true);
      } else if (activeTab === 'personal') {
        query = query.eq('is_business', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMileageTrips(data || []);
    } catch (error) {
      console.error('Error loading mileage:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMileage();
  };

  // Filter mileage based on search query
  const filteredMileage = mileageTrips.filter((trip) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesStart = trip.start_location?.toLowerCase().includes(query);
    const matchesEnd = trip.end_location?.toLowerCase().includes(query);
    const matchesPurpose = trip.purpose?.toLowerCase().includes(query);

    return matchesStart || matchesEnd || matchesPurpose;
  });

  // Group mileage by month
  const groupedMileage = filteredMileage.reduce((acc, trip) => {
    const date = new Date(trip.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    if (!acc[monthKey]) {
      acc[monthKey] = { label: monthLabel, trips: [] };
    }
    acc[monthKey].trips.push(trip);
    return acc;
  }, {} as Record<string, { label: string; trips: Mileage[] }>);

  const getMonthTotals = (trips: Mileage[]) => {
    const totalMiles = trips.reduce((sum, trip) => sum + (trip.miles || 0), 0);
    const totalAmount = trips.reduce(
      (sum, trip) => sum + (trip.total_amount || 0),
      0
    );
    return { totalMiles, totalAmount };
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary[600] }}>
        <SafeAreaView
          edges={['top']}
          style={{ flex: 0, backgroundColor: COLORS.primary[600] }}
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
            <Text style={styles.headerTitle}>Mileage</Text>
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
                placeholder='Search by location or purpose...'
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
                activeTab === 'business' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('business')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'business' && styles.tabTextActive,
                ]}>
                Business
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
              onPress={() => setActiveTab('personal')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'personal' && styles.tabTextActive,
                ]}>
                Personal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mileage List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {Object.keys(groupedMileage).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='car-outline'
                size={64}
                color={COLORS.gray[400]}
              />
              <Text style={styles.emptyTitle}>No mileage tracked yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to track your first trip
              </Text>
            </View>
          ) : (
            Object.keys(groupedMileage)
              .sort((a, b) => b.localeCompare(a))
              .map((monthKey) => {
                const { label, trips } = groupedMileage[monthKey];
                const { totalMiles, totalAmount } = getMonthTotals(trips);
                return (
                  <View key={monthKey} style={styles.monthGroup}>
                    {/* Month Header */}
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthText}>{label}</Text>
                      <View style={styles.monthTotals}>
                        <Text style={styles.monthMiles}>
                          {totalMiles.toFixed(1)} mi
                        </Text>
                        <Text style={styles.monthAmount}>
                          {formatCurrency(totalAmount)}
                        </Text>
                      </View>
                    </View>

                    {/* Trips */}
                    {trips.map((trip) => (
                      <TouchableOpacity
                        key={trip.id}
                        style={styles.tripCard}
                        onPress={() => router.push(`/mileage/${trip.id}`)}>
                        <View style={styles.tripHeader}>
                          <View style={styles.tripIcon}>
                            <Ionicons
                              name='car-outline'
                              size={24}
                              color={COLORS.primary[600]}
                            />
                          </View>
                          <View style={styles.tripInfo}>
                            <View style={styles.locationRow}>
                              <Text style={styles.locationText}>
                                {trip.start_location}
                              </Text>
                              <Ionicons
                                name='arrow-forward'
                                size={16}
                                color={COLORS.gray[400]}
                                style={styles.arrowIcon}
                              />
                              <Text style={styles.locationText}>
                                {trip.end_location}
                              </Text>
                            </View>
                            <View style={styles.tripDetails}>
                              <Text style={styles.purposeText}>
                                {trip.purpose}
                              </Text>
                              <Text style={styles.dateText}>
                                {formatDate(trip.date, 'short')}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.tripAmount}>
                          <Text style={styles.milesText}>
                            {trip.miles} mi
                          </Text>
                          <Text style={styles.amountText}>
                            {formatCurrency(trip.total_amount || 0)}
                          </Text>
                          {trip.is_business && (
                            <View style={styles.businessBadge}>
                              <Text style={styles.businessText}>
                                Deductible
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/mileage/new')}>
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
  monthGroup: {
    marginBottom: 24,
  },
  monthHeader: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  monthTotals: {
    alignItems: 'flex-end',
  },
  monthMiles: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent[400],
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  arrowIcon: {
    marginHorizontal: 6,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  purposeText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  dateText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  tripAmount: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  milesText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  businessBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  businessText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
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
