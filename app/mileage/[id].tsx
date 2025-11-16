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
import type { Mileage } from '@/lib/types';
import { COLORS } from '@/lib/theme';

export default function MileageDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mileage, setMileage] = useState<Mileage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadMileage();
  }, [id]);

  const loadMileage = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('mileage')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setMileage(data);
    } catch (error) {
      console.error('Error loading mileage:', error);
      Alert.alert('Error', 'Failed to load mileage trip');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this mileage trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('mileage')
                .delete()
                .eq('id', mileage?.id);

              if (error) throw error;

              Alert.alert('Success', 'Mileage trip deleted', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error deleting mileage:', error);
              Alert.alert('Error', error.message || 'Failed to delete mileage trip');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!mileage) return;

    try {
      await Share.share({
        message: `Mileage Trip\nDate: ${formatDate(mileage.date, 'long')}\nRoute: ${mileage.start_location} → ${mileage.end_location}\nMiles: ${mileage.miles} mi\nPurpose: ${mileage.purpose}\nDeductible: ${formatCurrency(mileage.total_amount || 0)}${
          mileage.is_business ? '\nBusiness Trip: Yes' : ''
        }`,
        title: `Mileage: ${mileage.start_location} → ${mileage.end_location}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Trip Details', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.accent[400]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!mileage) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Trip Details', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Mileage trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trip Details',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowActions(!showActions)}>
              <Ionicons
                name='ellipsis-horizontal'
                size={24}
                color={COLORS.gray[900]}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          {/* Trip Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name='car-outline'
                size={40}
                color={COLORS.primary[600]}
              />
            </View>
            <View style={styles.routeContainer}>
              <Text style={styles.locationText}>{mileage.start_location}</Text>
              <Ionicons
                name='arrow-forward'
                size={24}
                color={COLORS.gray[400]}
                style={styles.arrowIcon}
              />
              <Text style={styles.locationText}>{mileage.end_location}</Text>
            </View>
            <Text style={styles.milesAmount}>{mileage.miles} mi</Text>
            {mileage.is_business && (
              <View style={styles.businessBadge}>
                <Ionicons
                  name='checkmark-circle'
                  size={16}
                  color={COLORS.success}
                />
                <Text style={styles.businessText}>Business Trip</Text>
              </View>
            )}
          </View>

          {/* Trip Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(mileage.date, 'long')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purpose</Text>
              <Text style={styles.detailValue}>{mileage.purpose}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Miles Driven</Text>
              <Text style={[styles.detailValue, styles.highlightText]}>
                {mileage.miles} mi
              </Text>
            </View>
          </View>

          {/* Deductible Amount */}
          {mileage.is_business && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tax Deduction</Text>
              <View style={styles.deductibleCard}>
                <View style={styles.deductibleHeader}>
                  <Ionicons
                    name='calculator-outline'
                    size={24}
                    color={COLORS.success}
                  />
                  <Text style={styles.deductibleTitle}>
                    Deductible Amount
                  </Text>
                </View>
                <View style={styles.deductibleCalc}>
                  <Text style={styles.deductibleCalcText}>
                    {mileage.miles} mi × {formatCurrency(mileage.rate_per_mile || 0)}/mi
                  </Text>
                  <Text style={styles.deductibleAmount}>
                    {formatCurrency(mileage.total_amount || 0)}
                  </Text>
                </View>
                <Text style={styles.deductibleNote}>
                  Based on IRS standard mileage rate
                </Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {mileage.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{mileage.notes}</Text>
            </View>
          )}
        </ScrollView>

        {/* Actions Menu */}
        {showActions && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <Ionicons name='share-outline' size={20} color={COLORS.gray[900]} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name='trash-outline' size={20} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>
                Delete
              </Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
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
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  arrowIcon: {
    marginHorizontal: 4,
  },
  milesAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent[400],
    marginBottom: 12,
  },
  businessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  businessText: {
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accent[400],
  },
  deductibleCard: {
    backgroundColor: COLORS.success + '10',
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    borderRadius: 8,
    padding: 16,
  },
  deductibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deductibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  deductibleCalc: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deductibleCalcText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  deductibleAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success,
  },
  deductibleNote: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontStyle: 'italic',
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
