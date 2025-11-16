import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COLORS } from '@/lib/theme';
import type { Invoice, Expense } from '@/lib/types';

interface DashboardStats {
  thisMonthIncome: number;
  thisMonthExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  totalInvoices: number;
  totalIncome: number;
  totalExpenses: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    totalInvoices: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      // Get current month date range
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      // Fetch all invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Fetch all expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Calculate stats
      const thisMonthInvoices =
        invoices?.filter(
          (inv) => inv.date >= firstDayOfMonth && inv.date <= lastDayOfMonth
        ) || [];
      const thisMonthExpensesList =
        expenses?.filter(
          (exp) => exp.date >= firstDayOfMonth && exp.date <= lastDayOfMonth
        ) || [];

      const thisMonthIncome = thisMonthInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const thisMonthExpenses = thisMonthExpensesList.reduce(
        (sum, exp) => sum + (exp.total || 0),
        0
      );

      const pendingInvoices =
        invoices?.filter(
          (inv) => inv.status === 'sent' || inv.status === 'overdue'
        ).length || 0;

      const totalIncome =
        invoices
          ?.filter((inv) => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      const totalExpenses =
        expenses?.reduce((sum, exp) => sum + (exp.total || 0), 0) || 0;

      setStats({
        thisMonthIncome,
        thisMonthExpenses,
        netProfit: thisMonthIncome - thisMonthExpenses,
        pendingInvoices,
        totalInvoices: invoices?.length || 0,
        totalIncome,
        totalExpenses,
      });

      // Set recent activity
      setRecentInvoices(invoices?.slice(0, 5) || []);
      setRecentExpenses(expenses?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    loadDashboard();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
      case 'overdue':
        return COLORS.error;
      case 'sent':
        return COLORS.info;
      case 'draft':
        return COLORS.gray[500];
      default:
        return COLORS.gray[500];
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
            <Text style={styles.headerTitle}>Dashboard</Text>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/settings/account')}>
              <Ionicons
                name='person-circle-outline'
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/invoices/new')}>
              <Ionicons
                name='document-text-outline'
                size={20}
                color={COLORS.primary[600]}
              />
              <Text style={styles.quickActionText}>New Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/estimates/new')}>
              <Ionicons
                name='calculator-outline'
                size={20}
                color={COLORS.accent[400]}
              />
              <Text style={styles.quickActionText}>New Estimate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/expenses/new')}>
              <Ionicons name='receipt-outline' size={20} color={COLORS.error} />
              <Text style={styles.quickActionText}>Track Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/mileage/new')}>
              <Ionicons name='car-outline' size={20} color={COLORS.warning} />
              <Text style={styles.quickActionText}>Log Mileage</Text>
            </TouchableOpacity>
          </View>

          {/* This Month Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.incomeCard]}>
                <Ionicons name='trending-up' size={24} color={COLORS.success} />
                <Text style={styles.statLabel}>Income</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.thisMonthIncome)}
                </Text>
              </View>
              <View style={[styles.statCard, styles.expenseCard]}>
                <Ionicons name='trending-down' size={24} color={COLORS.error} />
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.thisMonthExpenses)}
                </Text>
              </View>
              <View style={[styles.statCard, styles.profitCard]}>
                <Ionicons
                  name='wallet-outline'
                  size={24}
                  color={COLORS.primary[600]}
                />
                <Text style={styles.statLabel}>Net Profit</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.netProfit)}
                </Text>
              </View>
              <View style={[styles.statCard, styles.pendingCard]}>
                <Ionicons
                  name='time-outline'
                  size={24}
                  color={COLORS.warning}
                />
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>{stats.pendingInvoices}</Text>
                <Text style={styles.statSubtext}>Invoices</Text>
              </View>
            </View>
          </View>

          {/* All Time Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Time</Text>
            <View style={styles.allTimeStats}>
              <View style={styles.allTimeStat}>
                <Text style={styles.allTimeLabel}>Total Invoices</Text>
                <Text style={styles.allTimeValue}>{stats.totalInvoices}</Text>
              </View>
              <View style={styles.allTimeStat}>
                <Text style={styles.allTimeLabel}>Total Income</Text>
                <Text style={styles.allTimeValue}>
                  {formatCurrency(stats.totalIncome)}
                </Text>
              </View>
              <View
                style={{
                  ...styles.allTimeStat,
                  borderBottomWidth: 0,
                  paddingBottom: 0,
                }}>
                <Text style={styles.allTimeLabel}>Total Expenses</Text>
                <Text style={styles.allTimeValue}>
                  {formatCurrency(stats.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Invoices */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Invoices</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentInvoices.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name='document-text-outline'
                  size={48}
                  color={COLORS.gray[400]}
                />
                <Text style={styles.emptyText}>No invoices yet</Text>
              </View>
            ) : (
              recentInvoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.activityItem}
                  onPress={() => router.push(`/invoices/${invoice.id}`)}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityTitle}>
                      {invoice.bill_to_name || 'No Client'}
                    </Text>
                    <Text style={styles.activitySubtitle}>
                      {invoice.invoice_number}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>
                      {formatCurrency(invoice.total)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(
                            invoice.status || 'draft'
                          ),
                        },
                      ]}>
                      <Text style={styles.statusText}>
                        {invoice.status?.charAt(0).toUpperCase() +
                          invoice.status?.slice(1) || 'Draft'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Recent Expenses */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name='receipt-outline'
                  size={48}
                  color={COLORS.gray[400]}
                />
                <Text style={styles.emptyText}>No expenses yet</Text>
              </View>
            ) : (
              recentExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.activityItem}
                  onPress={() => router.push(`/expenses/${expense.id}`)}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityTitle}>{expense.merchant}</Text>
                    <Text style={styles.activitySubtitle}>
                      {expense.category} • {formatDate(expense.date, 'short')}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>
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
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
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
    paddingBottom: 16,
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
  profileButton: {
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 6,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  quickActionText: {
    fontSize: 8,
    fontWeight: '500',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[600],
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  allTimeStats: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  allTimeStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  allTimeLabel: {
    fontSize: 15,
    color: COLORS.gray[600],
  },
  allTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  activityLeft: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
});
