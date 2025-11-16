import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import type { Client } from '@/lib/types';
import { COLORS } from '@/lib/theme';

interface ClientSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
}

export function ClientSelector({
  visible,
  onClose,
  onSelect,
}: ClientSelectorProps) {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // New client form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadClients();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!user) return;

    if (!newClientName.trim()) {
      Alert.alert('Error', 'Please enter a client name');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: newClientName,
          email: newClientEmail || null,
          phone: newClientPhone || null,
          address: newClientAddress || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Client created successfully');
      setShowNewClientForm(false);
      resetNewClientForm();
      await loadClients();
      onSelect(data);
      onClose();
    } catch (error: any) {
      console.error('Error creating client:', error);
      Alert.alert('Error', error.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  const resetNewClientForm = () => {
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
  };

  const handleClose = () => {
    setSearchQuery('');
    setShowNewClientForm(false);
    resetNewClientForm();
    onClose();
  };

  const handleSelectClient = (client: Client) => {
    onSelect(client);
    handleClose();
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => handleSelectClient(item)}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        {item.email && <Text style={styles.clientDetail}>{item.email}</Text>}
        {item.phone && <Text style={styles.clientDetail}>{item.phone}</Text>}
      </View>
      <Ionicons name='chevron-forward' size={20} color={COLORS.gray[500]} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name='close' size={24} color={COLORS.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {showNewClientForm ? 'New Client' : 'Select Client'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {showNewClientForm ? (
          // New Client Form
          <View style={styles.content}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Client Name *</Text>
              <TextInput
                style={styles.input}
                value={newClientName}
                onChangeText={setNewClientName}
                placeholder='Enter client name'
                autoFocus
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={newClientEmail}
                onChangeText={setNewClientEmail}
                placeholder='client@example.com'
                keyboardType='email-address'
                autoCapitalize='none'
              />
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newClientPhone}
                onChangeText={setNewClientPhone}
                placeholder='(555) 123-4567'
                keyboardType='phone-pad'
              />
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newClientAddress}
                onChangeText={setNewClientAddress}
                placeholder='Street address, City, State ZIP'
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowNewClientForm(false);
                  resetNewClientForm();
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateClient}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.createButtonText}>Create Client</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Client List
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name='search' size={20} color={COLORS.gray[500]} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder='Search clients...'
                autoCapitalize='none'
              />
            </View>

            {/* New Client Button */}
            <TouchableOpacity
              style={styles.newClientButton}
              onPress={() => setShowNewClientForm(true)}>
              <Ionicons
                name='add-circle'
                size={20}
                color={COLORS.accent[400]}
              />
              <Text style={styles.newClientText}>Create New Client</Text>
            </TouchableOpacity>

            {/* Client List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={COLORS.accent[400]} />
              </View>
            ) : filteredClients.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name='person-outline'
                  size={48}
                  color={COLORS.gray[500]}
                />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Create your first client to get started'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  newClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent[400],
    gap: 8,
  },
  newClientText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent[400],
  },
  list: {
    flex: 1,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  formSection: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  createButton: {
    backgroundColor: COLORS.accent[400],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
