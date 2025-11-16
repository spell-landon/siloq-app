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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency } from '@/lib/utils';
import { COLORS, SHADOWS } from '@/lib/theme';
import type { Invoice, Expense, Client } from '@/lib/types';

type TimePeriod = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'all_time';

interface ReportMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  outstandingInvoices: number;
  periodIncome: number;
  periodExpenses: number;
  periodNetProfit: number;
}

interface ClientRevenue {
  name: string;
  revenue: number;
}

interface ExpenseByCategory {
  category: string;
  total: number;
}

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingInvoices: 0,
    periodIncome: 0,
    periodExpenses: 0,
    periodNetProfit: 0,
  });
  const [topClients, setTopClients] = useState<ClientRevenue[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);

  useEffect(() => {
    loadReportData();
  }, [timePeriod]);

  const getDateRange = (): { start: Date; end: Date } | null => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (timePeriod) {
      case 'this_month':
        return {
          start: new Date(currentYear, currentMonth, 1),
          end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59),
        };
      case 'last_month':
        return {
          start: new Date(currentYear, currentMonth - 1, 1),
          end: new Date(currentYear, currentMonth, 0, 23, 59, 59),
        };
      case 'this_year':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31, 23, 59, 59),
        };
      case 'last_year':
        return {
          start: new Date(currentYear - 1, 0, 1),
          end: new Date(currentYear - 1, 11, 31, 23, 59, 59),
        };
      case 'all_time':
        return null;
      default:
        return null;
    }
  };

  const loadReportData = async () => {
    if (!user) return;

    try {
      const dateRange = getDateRange();

      // Fetch all invoices
      let invoiceQuery = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id);

      const { data: allInvoices, error: invoiceError } = await invoiceQuery;
      if (invoiceError) throw invoiceError;

      // Fetch all expenses
      let expenseQuery = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);

      const { data: allExpenses, error: expenseError } = await expenseQuery;
      if (expenseError) throw expenseError;

      // Fetch clients for revenue calculation
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      if (clientsError) throw clientsError;

      // Calculate all-time metrics
      const totalIncome = (allInvoices || [])
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const totalExpenses = (allExpenses || []).reduce(
        (sum, exp) => sum + (exp.total || 0),
        0
      );

      const outstandingInvoices = (allInvoices || [])
        .filter((inv) => ['sent', 'overdue'].includes(inv.status || ''))
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Calculate period metrics
      let periodInvoices = allInvoices || [];
      let periodExpenses = allExpenses || [];

      if (dateRange) {
        periodInvoices = periodInvoices.filter((inv) => {
          const invDate = new Date(inv.date);
          return invDate >= dateRange.start && invDate <= dateRange.end;
        });

        periodExpenses = periodExpenses.filter((exp) => {
          const expDate = new Date(exp.date);
          return expDate >= dateRange.start && expDate <= dateRange.end;
        });
      }

      const periodIncome = periodInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const periodExpensesTotal = periodExpenses.reduce(
        (sum, exp) => sum + (exp.total || 0),
        0
      );

      setMetrics({
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        outstandingInvoices,
        periodIncome,
        periodExpenses: periodExpensesTotal,
        periodNetProfit: periodIncome - periodExpensesTotal,
      });

      // Calculate top clients by revenue
      const clientRevenueMap = new Map<string, number>();
      (allInvoices || [])
        .filter((inv) => inv.status === 'paid' && inv.client_id)
        .forEach((inv) => {
          const current = clientRevenueMap.get(inv.client_id!) || 0;
          clientRevenueMap.set(inv.client_id!, current + (inv.total || 0));
        });

      const clientsMap = new Map((clients || []).map((c) => [c.id, c.name]));
      const topClientsData = Array.from(clientRevenueMap.entries())
        .map(([clientId, revenue]) => ({
          name: clientsMap.get(clientId) || 'Unknown Client',
          revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopClients(topClientsData);

      // Calculate expenses by category
      const categoryMap = new Map<string, number>();
      (allExpenses || []).forEach((exp) => {
        const category = exp.category || 'Uncategorized';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + (exp.total || 0));
      });

      const expensesByCategoryData = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      setExpensesByCategory(expensesByCategoryData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'this_year':
        return 'This Year';
      case 'last_year':
        return 'Last Year';
      case 'all_time':
        return 'All Time';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Reports', headerShown: true }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Reports & Analytics', headerShown: true }} />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Time Period Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Period</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.periodScroll}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  timePeriod === 'this_month' && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod('this_month')}>
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === 'this_month' && styles.periodButtonTextActive,
                  ]}>
                  This Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  timePeriod === 'last_month' && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod('last_month')}>
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === 'last_month' && styles.periodButtonTextActive,
                  ]}>
                  Last Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  timePeriod === 'this_year' && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod('this_year')}>
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === 'this_year' && styles.periodButtonTextActive,
                  ]}>
                  This Year
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  timePeriod === 'last_year' && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod('last_year')}>
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === 'last_year' && styles.periodButtonTextActive,
                  ]}>
                  Last Year
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  timePeriod === 'all_time' && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod('all_time')}>
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === 'all_time' && styles.periodButtonTextActive,
                  ]}>
                  All Time
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Overview Metrics - Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getPeriodLabel()} Overview</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name="trending-up" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.metricLabel}>Income</Text>
                <Text style={[styles.metricValue, { color: COLORS.success }]}>
                  {formatCurrency(metrics.periodIncome)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.error + '20' }]}>
                  <Ionicons name="trending-down" size={24} color={COLORS.error} />
                </View>
                <Text style={styles.metricLabel}>Expenses</Text>
                <Text style={[styles.metricValue, { color: COLORS.error }]}>
                  {formatCurrency(metrics.periodExpenses)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View
                  style={[
                    styles.metricIcon,
                    {
                      backgroundColor:
                        metrics.periodNetProfit >= 0
                          ? COLORS.primary[600] + '20'
                          : COLORS.error + '20',
                    },
                  ]}>
                  <Ionicons
                    name="analytics"
                    size={24}
                    color={
                      metrics.periodNetProfit >= 0 ? COLORS.primary[600] : COLORS.error
                    }
                  />
                </View>
                <Text style={styles.metricLabel}>Net Profit</Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color:
                        metrics.periodNetProfit >= 0 ? COLORS.primary[600] : COLORS.error,
                    },
                  ]}>
                  {formatCurrency(metrics.periodNetProfit)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="time" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.metricLabel}>Outstanding</Text>
                <Text style={[styles.metricValue, { color: COLORS.warning }]}>
                  {formatCurrency(metrics.outstandingInvoices)}
                </Text>
              </View>
            </View>
          </View>

          {/* All-Time Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All-Time Totals</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  {formatCurrency(metrics.totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                  {formatCurrency(metrics.totalExpenses)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: '600' }]}>
                  Net Profit
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      fontWeight: '700',
                      color: metrics.netProfit >= 0 ? COLORS.success : COLORS.error,
                    },
                  ]}>
                  {formatCurrency(metrics.netProfit)}
                </Text>
              </View>
            </View>
          </View>

          {/* Income vs Expenses Chart Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income vs Expenses</Text>
            <View style={styles.placeholderCard}>
              <Ionicons name="bar-chart-outline" size={48} color={COLORS.gray[400]} />
              <Text style={styles.placeholderText}>Chart Coming Soon</Text>
              <Text style={styles.placeholderSubtext}>
                Visual representation of income vs expenses over time
              </Text>
            </View>
          </View>

          {/* Top Clients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Clients by Revenue</Text>
            {topClients.length > 0 ? (
              <View style={styles.listCard}>
                {topClients.map((client, index) => (
                  <View key={index}>
                    <View style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.listItemText}>{client.name}</Text>
                      </View>
                      <Text style={styles.listItemValue}>
                        {formatCurrency(client.revenue)}
                      </Text>
                    </View>
                    {index < topClients.length - 1 && <View style={styles.listDivider} />}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={32} color={COLORS.gray[400]} />
                <Text style={styles.emptyText}>No client data yet</Text>
              </View>
            )}
          </View>

          {/* Expense Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expenses by Category</Text>
            {expensesByCategory.length > 0 ? (
              <View style={styles.listCard}>
                {expensesByCategory.map((item, index) => (
                  <View key={index}>
                    <View style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <Ionicons
                          name="ellipse"
                          size={12}
                          color={COLORS.primary[600]}
                          style={{ marginRight: 12 }}
                        />
                        <Text style={styles.listItemText}>{item.category}</Text>
                      </View>
                      <Text style={styles.listItemValue}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                    {index < expensesByCategory.length - 1 && (
                      <View style={styles.listDivider} />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="pie-chart-outline" size={32} color={COLORS.gray[400]} />
                <Text style={styles.emptyText}>No expense data yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  periodScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  periodButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '50%',
    padding: 6,
  },
  metricCardInner: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 4,
    marginTop: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.gray[700],
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  placeholderCard: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
    textAlign: 'center',
  },
  listCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  listItemText: {
    fontSize: 15,
    color: COLORS.gray[900],
    flex: 1,
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginLeft: 12,
  },
  listDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
});
