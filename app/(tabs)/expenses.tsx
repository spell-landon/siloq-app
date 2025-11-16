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
import type { Expense } from '@/lib/types';

type TabType = 'all' | 'deductible' | 'personal';

export default function ExpensesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [activeTab]);

  const loadExpenses = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (activeTab === 'deductible') {
        query = query.eq('is_tax_deductible', true);
      } else if (activeTab === 'personal') {
        query = query.eq('is_tax_deductible', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesMerchant = expense.merchant?.toLowerCase().includes(query);
    const matchesCategory = expense.category?.toLowerCase().includes(query);
    const matchesAmount = expense.total?.toString().includes(query);

    return matchesMerchant || matchesCategory || matchesAmount;
  });

  // Group expenses by month
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    if (!acc[monthKey]) {
      acc[monthKey] = { label: monthLabel, expenses: [] };
    }
    acc[monthKey].expenses.push(expense);
    return acc;
  }, {} as Record<string, { label: string; expenses: Expense[] }>);

  const getMonthTotal = (expenses: Expense[]) => {
    return expenses.reduce((sum, exp) => sum + (exp.total || 0), 0);
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'meals':
        return 'restaurant-outline';
      case 'travel':
        return 'airplane-outline';
      case 'office':
        return 'briefcase-outline';
      case 'supplies':
        return 'cube-outline';
      case 'utilities':
        return 'flash-outline';
      default:
        return 'receipt-outline';
    }
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
            <Text style={styles.headerTitle}>Expenses</Text>
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
                placeholder='Search expenses...'
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
                activeTab === 'deductible' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('deductible')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'deductible' && styles.tabTextActive,
                ]}>
                Deductible
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

        {/* Expense List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {Object.keys(groupedExpenses).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='receipt-outline'
                size={64}
                color={COLORS.gray[400]}
              />
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to track your first expense
              </Text>
            </View>
          ) : (
            Object.keys(groupedExpenses)
              .sort((a, b) => b.localeCompare(a))
              .map((monthKey) => {
                const { label, expenses: monthExpenses } =
                  groupedExpenses[monthKey];
                return (
                  <View key={monthKey} style={styles.monthGroup}>
                    {/* Month Header */}
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthText}>
                        {label} - {formatCurrency(getMonthTotal(monthExpenses))}
                      </Text>
                    </View>

                    {/* Expenses */}
                    {monthExpenses.map((expense) => (
                      <TouchableOpacity
                        key={expense.id}
                        style={styles.expenseCard}
                        onPress={() => router.push(`/expenses/${expense.id}`)}>
                        <View style={styles.expenseHeader}>
                          <View style={styles.expenseIcon}>
                            <Ionicons
                              name={getCategoryIcon(expense.category) as any}
                              size={24}
                              color={COLORS.primary[600]}
                            />
                          </View>
                          <View style={styles.expenseInfo}>
                            <Text style={styles.merchantName}>
                              {expense.merchant}
                            </Text>
                            <View style={styles.expenseDetails}>
                              {expense.category && (
                                <Text style={styles.categoryText}>
                                  {expense.category}
                                </Text>
                              )}
                              <Text style={styles.dateText}>
                                {formatDate(expense.date, 'short')}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.expenseAmount}>
                            <Text style={styles.amountText}>
                              {formatCurrency(expense.total)}
                            </Text>
                            {expense.is_tax_deductible && (
                              <View style={styles.deductibleBadge}>
                                <Text style={styles.deductibleText}>
                                  Tax Deductible
                                </Text>
                              </View>
                            )}
                          </View>
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
          onPress={() => router.push('/expenses/new')}>
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
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  expenseCard: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  dateText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  deductibleBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deductibleText: {
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
