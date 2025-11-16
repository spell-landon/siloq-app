import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency } from '@/lib/utils';
import { COLORS, SHADOWS } from '@/lib/theme';
import { IRS_MILEAGE_RATE } from '@/lib/constants';
import type { Invoice, Expense, Mileage } from '@/lib/types';

interface MonthlyIncome {
  month: string;
  amount: number;
}

interface ExpenseByCategory {
  category: string;
  amount: number;
}

interface TaxSummary {
  totalIncome: number;
  totalExpenses: number;
  mileageDeduction: number;
  netTaxableIncome: number;
  totalMiles: number;
}

export default function TaxReportScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [summary, setSummary] = useState<TaxSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    mileageDeduction: 0,
    netTaxableIncome: 0,
    totalMiles: 0,
  });
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    loadTaxData();
  }, [selectedYear]);

  const loadTaxData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Define date range for selected year
      const startDate = new Date(selectedYear, 0, 1).toISOString();
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

      // Fetch all invoices for the year
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'paid'); // Only count paid invoices for tax purposes

      if (invoiceError) throw invoiceError;

      // Fetch all tax-deductible expenses for the year
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_tax_deductible', true)
        .gte('date', startDate)
        .lte('date', endDate);

      if (expenseError) throw expenseError;

      // Fetch business mileage for the year
      const { data: mileage, error: mileageError } = await supabase
        .from('mileage')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_business', true)
        .gte('date', startDate)
        .lte('date', endDate);

      if (mileageError) throw mileageError;

      // Calculate total income
      const totalIncome = (invoices || []).reduce(
        (sum, inv) => sum + (inv.total || 0),
        0
      );

      // Calculate total expenses
      const totalExpenses = (expenses || []).reduce(
        (sum, exp) => sum + (exp.deductible_amount || exp.total || 0),
        0
      );

      // Calculate mileage deduction
      const totalMiles = (mileage || []).reduce(
        (sum, trip) => sum + (trip.miles || 0),
        0
      );
      const mileageDeduction = totalMiles * IRS_MILEAGE_RATE;

      // Calculate net taxable income
      const netTaxableIncome = totalIncome - totalExpenses - mileageDeduction;

      setSummary({
        totalIncome,
        totalExpenses,
        mileageDeduction,
        netTaxableIncome,
        totalMiles,
      });

      // Calculate monthly income breakdown
      const monthlyMap = new Map<number, number>();
      (invoices || []).forEach((inv) => {
        const month = new Date(inv.date).getMonth();
        const current = monthlyMap.get(month) || 0;
        monthlyMap.set(month, current + (inv.total || 0));
      });

      const monthlyData: MonthlyIncome[] = [];
      for (let i = 0; i < 12; i++) {
        const monthName = new Date(selectedYear, i, 1).toLocaleDateString('en-US', {
          month: 'long',
        });
        monthlyData.push({
          month: monthName,
          amount: monthlyMap.get(i) || 0,
        });
      }
      setMonthlyIncome(monthlyData);

      // Calculate expenses by category
      const categoryMap = new Map<string, number>();
      (expenses || []).forEach((exp) => {
        const category = exp.category || 'Uncategorized';
        const current = categoryMap.get(category) || 0;
        const deductibleAmount = exp.deductible_amount || exp.total || 0;
        categoryMap.set(category, current + deductibleAmount);
      });

      const categoryData = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      setExpensesByCategory(categoryData);

      // Get available years from data
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const years = new Set<number>();
      [...(allInvoices || []), ...(allExpenses || [])].forEach((item) => {
        if (item.date) {
          years.add(new Date(item.date).getFullYear());
        }
      });

      // Add current year if no data exists
      if (years.size === 0) {
        years.add(new Date().getFullYear());
      }

      setAvailableYears(Array.from(years).sort((a, b) => b - a));
    } catch (error) {
      console.error('Error loading tax data:', error);
      Alert.alert('Error', 'Failed to load tax report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    Alert.alert(
      'Export Tax Report',
      'Export feature coming soon! This will allow you to export your tax report as a PDF or CSV file for your accountant.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Tax Report', headerShown: true }} />
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
      <Stack.Screen
        options={{
          title: 'Tax Report',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleExport} style={{ marginRight: 16 }}>
              <Ionicons name="download-outline" size={24} color={COLORS.primary[600]} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Year Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Year</Text>
            <TouchableOpacity
              style={styles.yearSelector}
              onPress={() => setShowYearPicker(!showYearPicker)}>
              <Text style={styles.yearSelectorText}>{selectedYear}</Text>
              <Ionicons
                name={showYearPicker ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.gray[500]}
              />
            </TouchableOpacity>

            {showYearPicker && (
              <View style={styles.yearPickerContainer}>
                {availableYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      year === selectedYear && styles.yearOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}>
                    <Text
                      style={[
                        styles.yearOptionText,
                        year === selectedYear && styles.yearOptionTextActive,
                      ]}>
                      {year}
                    </Text>
                    {year === selectedYear && (
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Summary Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name="cash" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.summaryLabel}>Business Income</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  {formatCurrency(summary.totalIncome)}
                </Text>
                <Text style={styles.summarySubtext}>Paid invoices</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.error + '20' }]}>
                  <Ionicons name="receipt" size={24} color={COLORS.error} />
                </View>
                <Text style={styles.summaryLabel}>Business Expenses</Text>
                <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                  {formatCurrency(summary.totalExpenses)}
                </Text>
                <Text style={styles.summarySubtext}>Tax deductible</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: COLORS.info + '20' }]}>
                  <Ionicons name="car" size={24} color={COLORS.info} />
                </View>
                <Text style={styles.summaryLabel}>Mileage Deduction</Text>
                <Text style={[styles.summaryValue, { color: COLORS.info }]}>
                  {formatCurrency(summary.mileageDeduction)}
                </Text>
                <Text style={styles.summarySubtext}>
                  {summary.totalMiles.toFixed(0)} miles × ${IRS_MILEAGE_RATE}/mi
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryIcon,
                    {
                      backgroundColor:
                        summary.netTaxableIncome >= 0
                          ? COLORS.primary[600] + '20'
                          : COLORS.warning + '20',
                    },
                  ]}>
                  <Ionicons
                    name="calculator"
                    size={24}
                    color={
                      summary.netTaxableIncome >= 0 ? COLORS.primary[600] : COLORS.warning
                    }
                  />
                </View>
                <Text style={styles.summaryLabel}>Net Taxable Income</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        summary.netTaxableIncome >= 0
                          ? COLORS.primary[600]
                          : COLORS.warning,
                    },
                  ]}>
                  {formatCurrency(summary.netTaxableIncome)}
                </Text>
                <Text style={styles.summarySubtext}>After deductions</Text>
              </View>
            </View>
          </View>

          {/* Monthly Income Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income by Month</Text>
            <View style={styles.tableCard}>
              {monthlyIncome.filter((m) => m.amount > 0).length > 0 ? (
                monthlyIncome
                  .filter((m) => m.amount > 0)
                  .map((item, index) => (
                    <View key={index}>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableMonth}>{item.month}</Text>
                        <Text style={styles.tableAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                      {index < monthlyIncome.filter((m) => m.amount > 0).length - 1 && (
                        <View style={styles.tableDivider} />
                      )}
                    </View>
                  ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No income recorded for {selectedYear}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Expenses by Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deductible Expenses by Category</Text>
            <View style={styles.tableCard}>
              {expensesByCategory.length > 0 ? (
                <>
                  {expensesByCategory.map((item, index) => (
                    <View key={index}>
                      <View style={styles.tableRow}>
                        <View style={styles.categoryRow}>
                          <Ionicons
                            name="ellipse"
                            size={10}
                            color={COLORS.primary[600]}
                            style={{ marginRight: 10 }}
                          />
                          <Text style={styles.tableCategory}>{item.category}</Text>
                        </View>
                        <Text style={styles.tableAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                      {index < expensesByCategory.length - 1 && (
                        <View style={styles.tableDivider} />
                      )}
                    </View>
                  ))}
                  <View style={styles.tableDivider} />
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCategory, { fontWeight: '700' }]}>Total</Text>
                    <Text style={[styles.tableAmount, { fontWeight: '700' }]}>
                      {formatCurrency(summary.totalExpenses)}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No deductible expenses for {selectedYear}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Mileage Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Mileage</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Business Miles</Text>
                <Text style={styles.detailValue}>{summary.totalMiles.toFixed(0)} mi</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>IRS Standard Rate ({selectedYear})</Text>
                <Text style={styles.detailValue}>${IRS_MILEAGE_RATE}/mi</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { fontWeight: '600' }]}>
                  Total Deduction
                </Text>
                <Text style={[styles.detailValue, { fontWeight: '700', fontSize: 18 }]}>
                  {formatCurrency(summary.mileageDeduction)}
                </Text>
              </View>
            </View>
          </View>

          {/* Tax Tips */}
          <View style={styles.section}>
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="information-circle" size={24} color={COLORS.info} />
                <Text style={styles.tipTitle}>Tax Filing Reminder</Text>
              </View>
              <Text style={styles.tipText}>
                This report summarizes your business income and deductible expenses for tax
                purposes. Please consult with a tax professional for accurate filing.
              </Text>
              <Text style={styles.tipText}>
                Keep all receipts and documentation for at least 7 years as recommended by
                the IRS.
              </Text>
            </View>
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
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  yearSelectorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  yearPickerContainer: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  yearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  yearOptionActive: {
    backgroundColor: COLORS.primary[600],
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  yearOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  summaryCard: {
    width: '50%',
    padding: 6,
  },
  summaryCardInner: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  summaryIcon: {
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
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 4,
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  tableCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableMonth: {
    fontSize: 15,
    color: COLORS.gray[900],
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableCategory: {
    fontSize: 15,
    color: COLORS.gray[900],
  },
  tableAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginLeft: 12,
  },
  tableDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  detailCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.gray[700],
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  tipCard: {
    backgroundColor: COLORS.info + '10',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
});
