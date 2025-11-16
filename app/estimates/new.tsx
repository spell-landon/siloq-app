import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency } from '@/lib/utils';
import { ClientSelector } from '@/components/ClientSelector';
import { DatePicker } from '@/components/DatePicker';
import {
  validateRequired,
  validatePositiveNumber,
  enforcePositiveNumber,
} from '@/lib/validation';
import type { LineItem, Client } from '@/lib/types';
import { COLORS } from '@/lib/theme';

export default function NewEstimateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Estimate metadata
  const [estimateNumber, setEstimateNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDays, setExpiryDays] = useState(30);
  const [expiryDate, setExpiryDate] = useState('');

  // Client info
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  // Financial fields
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');

  // Validation state
  const [errors, setErrors] = useState<{
    client?: string;
    lineItems?: Record<string, { description?: string; rate?: string }>;
  }>({});
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    generateEstimateNumber();
  }, []);

  useEffect(() => {
    calculateExpiryDate();
  }, [date, expiryDays]);

  useEffect(() => {
    calculateTotals();
  }, [lineItems, taxRate, discount]);

  const generateEstimateNumber = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('estimate_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].estimate_number.replace(/\D/g, '')) || 0;
        setEstimateNumber(`EST-${String(lastNumber + 1).padStart(4, '0')}`);
      } else {
        setEstimateNumber('EST-0001');
      }
    } catch (error) {
      console.error('Error generating estimate number:', error);
      setEstimateNumber('EST-0001');
    }
  };

  const calculateExpiryDate = () => {
    const estimateDate = new Date(date);
    estimateDate.setDate(estimateDate.getDate() + expiryDays);
    setExpiryDate(estimateDate.toISOString().split('T')[0]);
  };

  const calculateTotals = () => {
    const sub = lineItems.reduce((sum, item) => sum + item.amount, 0);
    setSubtotal(sub);

    const taxAmount = (sub * taxRate) / 100;
    setTax(taxAmount);

    const totalAmount = sub + taxAmount - discount;
    setTotal(totalAmount);
  };

  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString();
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          let processedValue = value;

          // Enforce positive numbers for quantity and rate
          if (field === 'quantity' || field === 'rate') {
            processedValue =
              typeof value === 'string'
                ? parseFloat(enforcePositiveNumber(value)) || 0
                : Math.max(0, value);
          }

          const updated = { ...item, [field]: processedValue };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = updated.quantity * updated.rate;
          }

          // Clear errors for this field
          if (showErrors && errors.lineItems?.[id]) {
            const newErrors = { ...errors };
            if (field === 'description' && validateRequired(processedValue as string)) {
              delete newErrors.lineItems![id].description;
            }
            if (field === 'rate' && validatePositiveNumber(processedValue)) {
              delete newErrors.lineItems![id].rate;
            }
            setErrors(newErrors);
          }

          return updated;
        }
        return item;
      })
    );
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      Alert.alert('Error', 'Estimate must have at least one line item');
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientSelector(false);
    // Clear client error
    if (showErrors && errors.client) {
      setErrors({ ...errors, client: undefined });
    }
  };

  const handleTaxRateChange = (text: string) => {
    const sanitized = enforcePositiveNumber(text);
    setTaxRate(parseFloat(sanitized) || 0);
  };

  const handleDiscountChange = (text: string) => {
    const sanitized = enforcePositiveNumber(text);
    setDiscount(parseFloat(sanitized) || 0);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate client selection
    if (!selectedClient) {
      newErrors.client = 'Please select a client';
    }

    // Validate line items
    newErrors.lineItems = {};
    lineItems.forEach((item) => {
      const itemErrors: { description?: string; rate?: string } = {};

      if (!validateRequired(item.description)) {
        itemErrors.description = 'Description is required';
      }

      if (!validatePositiveNumber(item.rate)) {
        itemErrors.rate = 'Rate must be greater than 0';
      }

      if (Object.keys(itemErrors).length > 0) {
        newErrors.lineItems![item.id] = itemErrors;
      }
    });

    if (Object.keys(newErrors.lineItems).length === 0) {
      delete newErrors.lineItems;
    }

    return newErrors;
  };

  const handleSave = async (status: 'draft' | 'pending') => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    // Validate form
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setShowErrors(true);

    if (Object.keys(validationErrors).length > 0) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('estimates').insert({
        user_id: user.id,
        client_id: selectedClient.id,
        estimate_number: estimateNumber,
        date,
        expiry_date: expiryDate,
        status,
        bill_to_name: selectedClient.name,
        bill_to_email: selectedClient.email || null,
        bill_to_address: selectedClient.address || null,
        bill_to_phone: selectedClient.phone || null,
        line_items: JSON.stringify(lineItems),
        subtotal,
        tax,
        discount,
        total,
        notes: notes || null,
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        status === 'draft' ? 'Estimate saved as draft' : 'Estimate created',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error saving estimate:', error);
      Alert.alert('Error', error.message || 'Failed to save estimate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Estimate',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={COLORS.gray[900]} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          {/* Estimate Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimate Information</Text>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Estimate Number</Text>
                <TextInput
                  style={styles.input}
                  value={estimateNumber}
                  onChangeText={setEstimateNumber}
                  placeholder="EST-0001"
                />
              </View>
              <View style={styles.halfWidth}>
                <DatePicker
                  label='Date'
                  value={date}
                  onChange={setDate}
                  required
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Valid For (days)</Text>
                <TextInput
                  style={styles.input}
                  value={expiryDays.toString()}
                  onChangeText={(text) => setExpiryDays(parseInt(text) || 30)}
                  placeholder="30"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfWidth}>
                <DatePicker
                  label='Expiry Date'
                  value={expiryDate}
                  onChange={setExpiryDate}
                  minimumDate={new Date(date)}
                  required
                />
              </View>
            </View>
          </View>

          {/* Client Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {selectedClient ? (
              <View style={styles.selectedClient}>
                <View style={styles.clientInfo}>
                  <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
                  {selectedClient.email && (
                    <Text style={styles.selectedClientDetail}>{selectedClient.email}</Text>
                  )}
                  {selectedClient.phone && (
                    <Text style={styles.selectedClientDetail}>{selectedClient.phone}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setShowClientSelector(true)}>
                  <Text style={styles.changeButton}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.selectClientButton,
                    showErrors && errors.client && styles.selectClientButtonError,
                  ]}
                  onPress={() => setShowClientSelector(true)}
                >
                  <Ionicons name="person-add-outline" size={20} color={COLORS.accent[400]} />
                  <Text style={styles.selectClientText}>Select Client</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[500]} />
                </TouchableOpacity>
                {showErrors && errors.client && (
                  <Text style={styles.errorText}>{errors.client}</Text>
                )}
              </>
            )}
          </View>

          {/* Line Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Line Items</Text>
              <TouchableOpacity style={styles.addButton} onPress={addLineItem}>
                <Ionicons name="add-circle" size={24} color={COLORS.accent[400]} />
              </TouchableOpacity>
            </View>
            {lineItems.map((item, index) => (
              <View key={item.id} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemNumber}>Item {index + 1}</Text>
                  {lineItems.length > 1 && (
                    <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[
                    styles.input,
                    showErrors &&
                      errors.lineItems?.[item.id]?.description &&
                      styles.inputError,
                  ]}
                  value={item.description}
                  onChangeText={(text) => updateLineItem(item.id, 'description', text)}
                  placeholder="Item or service description"
                />
                {showErrors && errors.lineItems?.[item.id]?.description && (
                  <Text style={styles.errorText}>
                    {errors.lineItems[item.id].description}
                  </Text>
                )}
                <View style={styles.row}>
                  <View style={styles.thirdWidth}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={item.quantity.toString()}
                      onChangeText={(text) =>
                        updateLineItem(item.id, 'quantity', parseFloat(text) || 0)
                      }
                      placeholder="1"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.thirdWidth}>
                    <Text style={styles.label}>Rate</Text>
                    <TextInput
                      style={[
                        styles.input,
                        showErrors &&
                          errors.lineItems?.[item.id]?.rate &&
                          styles.inputError,
                      ]}
                      value={item.rate.toString()}
                      onChangeText={(text) =>
                        updateLineItem(item.id, 'rate', parseFloat(text) || 0)
                      }
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                    {showErrors && errors.lineItems?.[item.id]?.rate && (
                      <Text style={styles.errorText}>
                        {errors.lineItems[item.id].rate}
                      </Text>
                    )}
                  </View>
                  <View style={styles.thirdWidth}>
                    <Text style={styles.label}>Amount</Text>
                    <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Totals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Totals</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.row} style={{ flex: 1 }}>
                <Text style={styles.totalLabel}>Tax (%)</Text>
                <TextInput
                  style={[styles.input, styles.taxInput]}
                  value={taxRate.toString()}
                  onChangeText={handleTaxRateChange}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <TextInput
                style={[styles.input, styles.discountInput]}
                value={discount.toString()}
                onChangeText={handleDiscountChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.draftButton]}
            onPress={() => handleSave('draft')}
            disabled={loading}
          >
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={() => handleSave('pending')}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>Create Estimate</Text>
          </TouchableOpacity>
        </View>

        <ClientSelector
          visible={showClientSelector}
          onClose={() => setShowClientSelector(false)}
          onSelect={handleSelectClient}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  scrollView: { flex: 1 },
  section: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 6,
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: { flex: 1 },
  thirdWidth: { flex: 1 },
  addButton: { padding: 4 },
  lineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    paddingVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: { fontSize: 16, color: COLORS.gray[900] },
  totalValue: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  taxInput: { flex: 0, width: 60, marginLeft: 8 },
  discountInput: { width: 100 },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: COLORS.gray[200],
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  grandTotalValue: { fontSize: 20, fontWeight: '700', color: COLORS.accent[400] },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  draftButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.gray[900] },
  sendButton: { backgroundColor: COLORS.accent[400] },
  sendButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  selectClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  selectClientText: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.accent[400] },
  selectedClient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    padding: 16,
  },
  clientInfo: { flex: 1 },
  selectedClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  selectedClientDetail: { fontSize: 14, color: COLORS.gray[500], marginBottom: 2 },
  changeButton: { fontSize: 15, fontWeight: '600', color: COLORS.accent[400], marginLeft: 12 },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  selectClientButtonError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 4,
  },
});
