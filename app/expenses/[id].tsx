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
import type { Expense } from '@/lib/types';
import { COLORS } from '@/lib/theme';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setExpense(data);
    } catch (error) {
      console.error('Error loading expense:', error);
      Alert.alert('Error', 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expense?.id);

              if (error) throw error;

              Alert.alert('Success', 'Expense deleted', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', error.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!expense) return;

    try {
      await Share.share({
        message: `Expense: ${expense.merchant}\nAmount: ${formatCurrency(expense.total || 0)}\nDate: ${formatDate(expense.date, 'short')}\nCategory: ${expense.category || 'N/A'}${
          expense.is_tax_deductible ? '\nTax Deductible: Yes' : ''
        }`,
        title: `Expense: ${expense.merchant}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
      case 'software':
        return 'code-outline';
      case 'equipment':
        return 'hardware-chip-outline';
      case 'marketing':
        return 'megaphone-outline';
      case 'professional services':
        return 'people-outline';
      default:
        return 'receipt-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Expense Details', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent[400]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Expense Details', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Expense not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Expense Details',
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
          {/* Expense Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getCategoryIcon(expense.category) as any}
                size={40}
                color={COLORS.primary[600]}
              />
            </View>
            <Text style={styles.merchantName}>{expense.merchant}</Text>
            <Text style={styles.amount}>{formatCurrency(expense.total || 0)}</Text>
            {expense.is_tax_deductible && (
              <View style={styles.deductibleBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.deductibleText}>Tax Deductible</Text>
              </View>
            )}
          </View>

          {/* Expense Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(expense.date, 'long')}</Text>
            </View>
            {expense.category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{expense.category}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                {formatCurrency(expense.total || 0)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {expense.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{expense.notes}</Text>
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
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
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
  header: {
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent[400],
    marginBottom: 12,
  },
  deductibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  deductibleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.gray[500],
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accent[400],
  },
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
    minWidth: 180,
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
});
