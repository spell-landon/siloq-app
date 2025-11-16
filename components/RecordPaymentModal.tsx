import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';
import { DatePicker } from './DatePicker';
import { formatCurrency } from '@/lib/utils';
import { validateRequired, validatePositiveNumber } from '@/lib/validation';

interface RecordPaymentModalProps {
  visible: boolean;
  invoiceId: string;
  invoiceTotal: number;
  balanceDue: number;
  onClose: () => void;
  onSubmit: (payment: PaymentData) => Promise<void>;
}

export interface PaymentData {
  amount: number;
  date: string;
  payment_method: string;
  reference: string;
  notes: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export function RecordPaymentModal({
  visible,
  invoiceId,
  invoiceTotal,
  balanceDue,
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState(balanceDue.toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(amount)) {
      newErrors.amount = 'Payment amount is required';
    } else if (!validatePositiveNumber(amount)) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(amount) > balanceDue) {
      newErrors.amount = `Amount cannot exceed balance due (${formatCurrency(
        balanceDue
      )})`;
    }

    if (!validateRequired(date)) {
      newErrors.date = 'Payment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        date,
        payment_method: paymentMethod,
        reference,
        notes,
      });

      // Reset form
      setAmount(balanceDue.toString());
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setReference('');
      setNotes('');
      setErrors({});
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const setFullAmount = () => {
    setAmount(balanceDue.toString());
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Record Payment</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
            <Text
              style={[
                styles.saveButton,
                submitting && styles.saveButtonDisabled,
              ]}>
              {submitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Invoice Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Total:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(invoiceTotal)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Balance Due:</Text>
              <Text style={[styles.infoValue, styles.balanceDue]}>
                {formatCurrency(balanceDue)}
              </Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Payment Amount <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity onPress={setFullAmount}>
                <Text style={styles.fullAmountButton}>Full Amount</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              value={amount}
              onChangeText={setAmount}
              placeholder='0.00'
              keyboardType='decimal-pad'
              returnKeyType='done'
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.field}>
            <DatePicker
              label='Payment Date'
              value={date}
              onChange={setDate}
              required
            />
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Payment Method */}
          <View style={styles.field}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodButtons}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.methodButton,
                    paymentMethod === method.value && styles.methodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}>
                  <Text
                    style={[
                      styles.methodButtonText,
                      paymentMethod === method.value &&
                        styles.methodButtonTextActive,
                    ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reference */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Reference Number{' '}
              <Text style={styles.optional}>
                (Check #, Transaction ID, etc.)
              </Text>
            </Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder='Optional'
              returnKeyType='next'
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Notes <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder='Add any notes about this payment...'
              multiline
              numberOfLines={4}
              textAlignVertical='top'
            />
          </View>
        </ScrollView>
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
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  cancelButton: {
    fontSize: 17,
    color: COLORS.primary[600],
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: COLORS.primary[50],
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: COLORS.gray[700],
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  balanceDue: {
    color: COLORS.primary[600],
    fontSize: 18,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  optional: {
    fontSize: 13,
    color: COLORS.gray[400],
    fontWeight: '400',
  },
  fullAmountButton: {
    fontSize: 14,
    color: COLORS.primary[600],
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 4,
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  methodButtonActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  methodButtonText: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: COLORS.white,
  },
});
