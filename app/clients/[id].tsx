import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Client, Invoice } from '@/lib/types/database';
import { COLORS } from '@/lib/theme';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    if (!user || !id) return;

    try {
      // Load client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load invoices for this client
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error loading client:', error);
      Alert.alert('Error', 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Client',
      'Are you sure you want to delete this client? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client?.id);

              if (error) throw error;

              Alert.alert('Success', 'Client deleted', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error deleting client:', error);
              Alert.alert('Error', error.message || 'Failed to delete client');
            }
          },
        },
      ]
    );
  };

  const handleEmail = () => {
    if (client?.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const handleCall = () => {
    const phone = client?.phone || client?.mobile;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const getTotalBilled = () => {
    return invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  };

  const getTotalOutstanding = () => {
    return invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{ title: 'Client Details', headerShown: true }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.accent[400]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{ title: 'Client Details', headerShown: true }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Client not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: client.name,
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
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
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView style={styles.scrollView}>
          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Billed</Text>
              <Text style={styles.statValue}>
                {formatCurrency(getTotalBilled())}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Outstanding</Text>
              <Text style={[styles.statValue, { color: COLORS.error }]}>
                {formatCurrency(getTotalOutstanding())}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Invoices</Text>
              <Text style={styles.statValue}>{invoices.length}</Text>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            {client.contact_person && (
              <View style={styles.infoRow}>
                <Ionicons
                  name='person-outline'
                  size={20}
                  color={COLORS.gray[500]}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contact Person</Text>
                  <Text style={styles.infoValue}>{client.contact_person}</Text>
                </View>
              </View>
            )}

            {client.email && (
              <TouchableOpacity style={styles.infoRow} onPress={handleEmail}>
                <Ionicons
                  name='mail-outline'
                  size={20}
                  color={COLORS.gray[500]}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={[styles.infoValue, styles.linkText]}>
                    {client.email}
                  </Text>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            )}

            {client.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Ionicons
                  name='call-outline'
                  size={20}
                  color={COLORS.gray[500]}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={[styles.infoValue, styles.linkText]}>
                    {client.phone}
                  </Text>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            )}

            {client.mobile && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Ionicons
                  name='phone-portrait-outline'
                  size={20}
                  color={COLORS.gray[500]}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mobile</Text>
                  <Text style={[styles.infoValue, styles.linkText]}>
                    {client.mobile}
                  </Text>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            )}

            {client.website && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => Linking.openURL(client.website!)}>
                <Ionicons
                  name='globe-outline'
                  size={20}
                  color={COLORS.gray[500]}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={[styles.infoValue, styles.linkText]}>
                    {client.website}
                  </Text>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Address */}
          {(client.address ||
            client.city ||
            client.state ||
            client.postal_code) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.infoRow}>
                <Ionicons
                  name='location-outline'
                  size={20}
                  color={COLORS.gray[500]}
                />
                <View style={styles.infoContent}>
                  {client.address && (
                    <Text style={styles.infoValue}>{client.address}</Text>
                  )}
                  {(client.city || client.state || client.postal_code) && (
                    <Text style={styles.infoValue}>
                      {[client.city, client.state, client.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  )}
                  {client.country && (
                    <Text style={styles.infoValue}>{client.country}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Additional Info */}
          {(client.tax_id || client.notes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>

              {client.tax_id && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name='document-text-outline'
                    size={20}
                    color={COLORS.gray[500]}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Tax ID</Text>
                    <Text style={styles.infoValue}>{client.tax_id}</Text>
                  </View>
                </View>
              )}

              {client.notes && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name='chatbox-outline'
                    size={20}
                    color={COLORS.gray[500]}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Notes</Text>
                    <Text style={styles.infoValue}>{client.notes}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Invoice History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice History</Text>
            {invoices.length === 0 ? (
              <View style={styles.emptyInvoices}>
                <Ionicons
                  name='document-outline'
                  size={48}
                  color={COLORS.gray[400]}
                />
                <Text style={styles.emptyInvoicesText}>No invoices yet</Text>
              </View>
            ) : (
              invoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.invoiceItem}
                  onPress={() => router.push(`/invoices/${invoice.id}`)}>
                  <View style={styles.invoiceLeft}>
                    <Text style={styles.invoiceNumber}>
                      {invoice.invoice_number}
                    </Text>
                    <Text style={styles.invoiceDate}>
                      {formatDate(invoice.date, 'short')}
                    </Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>
                      {formatCurrency(invoice.total || 0)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(invoice.status || ''),
                        },
                      ]}>
                      <Text style={styles.statusText}>
                        {getStatusText(invoice.status || 'draft')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Actions Menu */}
        {showActions && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                router.push(`/clients/edit/${client.id}`);
              }}>
              <Ionicons
                name='create-outline'
                size={20}
                color={COLORS.gray[900]}
              />
              <Text style={styles.actionText}>Edit Client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                router.push(`/invoices/new?clientId=${client.id}`);
              }}>
              <Ionicons
                name='document-text-outline'
                size={20}
                color={COLORS.accent[400]}
              />
              <Text style={[styles.actionText, { color: COLORS.accent[400] }]}>
                New Invoice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                handleDelete();
              }}>
              <Ionicons name='trash-outline' size={20} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Primary Action Button */}
        <View style={styles.primaryActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push(`/invoices/new?clientId=${client.id}`)}>
            <Text style={styles.primaryButtonText}>
              New Invoice for {client.name}
            </Text>
          </TouchableOpacity>
        </View>
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
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.gray[50],
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.gray[500],
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent[400],
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.gray[900],
    fontWeight: '500',
  },
  linkText: {
    color: COLORS.accent[400],
  },
  emptyInvoices: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyInvoicesText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 12,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
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
    minWidth: 200,
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
  primaryActions: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  primaryButton: {
    backgroundColor: COLORS.accent[400],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
