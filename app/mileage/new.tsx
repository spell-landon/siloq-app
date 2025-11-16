import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { DatePicker } from '@/components/DatePicker';
import {
  validateRequired,
  validatePositiveNumber,
  enforcePositiveNumber,
} from '@/lib/validation';
import { COLORS } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';

const IRS_RATE_2024 = 0.67; // IRS standard mileage rate for 2024

export default function NewMileageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [miles, setMiles] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isBusiness, setIsBusiness] = useState(true);
  const [ratePerMile] = useState(IRS_RATE_2024);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'startLocation':
        if (!validateRequired(value)) {
          return 'Start location is required';
        }
        break;
      case 'endLocation':
        if (!validateRequired(value)) {
          return 'End location is required';
        }
        break;
      case 'miles':
        if (!value || value.trim() === '') {
          return 'Miles is required';
        }
        if (!validatePositiveNumber(value)) {
          return 'Miles must be greater than 0';
        }
        break;
      case 'purpose':
        if (!validateRequired(value)) {
          return 'Purpose is required';
        }
        break;
      case 'date':
        if (!validateRequired(value)) {
          return 'Date is required';
        }
        break;
    }
    return '';
  };

  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const value =
      field === 'startLocation'
        ? startLocation
        : field === 'endLocation'
          ? endLocation
          : field === 'miles'
            ? miles
            : field === 'purpose'
              ? purpose
              : field === 'date'
                ? date
                : '';
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleFieldChange = (field: string, value: string) => {
    // Update field value
    switch (field) {
      case 'startLocation':
        setStartLocation(value);
        break;
      case 'endLocation':
        setEndLocation(value);
        break;
      case 'miles':
        const sanitized = enforcePositiveNumber(value);
        setMiles(sanitized);
        break;
      case 'purpose':
        setPurpose(value);
        break;
    }

    // Clear error if field is now valid
    if (touched[field]) {
      const error = validateField(field, field === 'miles' ? enforcePositiveNumber(value) : value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const calculateDeductibleAmount = () => {
    const milesNum = parseFloat(miles) || 0;
    return milesNum * ratePerMile;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all fields
    const startLocationError = validateField('startLocation', startLocation);
    const endLocationError = validateField('endLocation', endLocation);
    const milesError = validateField('miles', miles);
    const purposeError = validateField('purpose', purpose);
    const dateError = validateField('date', date);

    const newErrors = {
      startLocation: startLocationError,
      endLocation: endLocationError,
      miles: milesError,
      purpose: purposeError,
      date: dateError,
    };

    setErrors(newErrors);
    setTouched({
      startLocation: true,
      endLocation: true,
      miles: true,
      purpose: true,
      date: true,
    });

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== '')) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('mileage').insert({
        user_id: user.id,
        date,
        start_location: startLocation.trim(),
        end_location: endLocation.trim(),
        miles: parseFloat(miles),
        purpose: purpose.trim(),
        notes: notes.trim() || null,
        is_business: isBusiness,
        rate_per_mile: ratePerMile,
      });

      if (error) throw error;

      Alert.alert('Success', 'Mileage trip tracked successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error saving mileage:', error);
      Alert.alert('Error', error.message || 'Failed to save mileage trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Track Mileage',
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            {/* Date */}
            <DatePicker
              label='Date'
              value={date}
              onChange={setDate}
              required
            />

            {/* Start Location */}
            <View style={styles.field}>
              <Text style={styles.label}>Start Location *</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.startLocation &&
                    errors.startLocation &&
                    styles.inputError,
                ]}
                value={startLocation}
                onChangeText={(value) => handleFieldChange('startLocation', value)}
                onBlur={() => handleFieldBlur('startLocation')}
                placeholder='e.g., Home, Office, Client Site'
                placeholderTextColor={COLORS.gray[400]}
              />
              {touched.startLocation && errors.startLocation && (
                <Text style={styles.errorText}>{errors.startLocation}</Text>
              )}
            </View>

            {/* End Location */}
            <View style={styles.field}>
              <Text style={styles.label}>End Location *</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.endLocation && errors.endLocation && styles.inputError,
                ]}
                value={endLocation}
                onChangeText={(value) => handleFieldChange('endLocation', value)}
                onBlur={() => handleFieldBlur('endLocation')}
                placeholder='e.g., Client Site, Home, Office'
                placeholderTextColor={COLORS.gray[400]}
              />
              {touched.endLocation && errors.endLocation && (
                <Text style={styles.errorText}>{errors.endLocation}</Text>
              )}
            </View>

            {/* Miles */}
            <View style={styles.field}>
              <Text style={styles.label}>Miles *</Text>
              <View
                style={[
                  styles.milesInput,
                  touched.miles && errors.miles && styles.inputError,
                ]}>
                <TextInput
                  style={styles.milesField}
                  value={miles}
                  onChangeText={(value) => handleFieldChange('miles', value)}
                  onBlur={() => handleFieldBlur('miles')}
                  placeholder='0.0'
                  placeholderTextColor={COLORS.gray[400]}
                  keyboardType='decimal-pad'
                />
                <Text style={styles.milesUnit}>mi</Text>
              </View>
              {touched.miles && errors.miles && (
                <Text style={styles.errorText}>{errors.miles}</Text>
              )}
            </View>

            {/* Purpose */}
            <View style={styles.field}>
              <Text style={styles.label}>Purpose *</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.purpose && errors.purpose && styles.inputError,
                ]}
                value={purpose}
                onChangeText={(value) => handleFieldChange('purpose', value)}
                onBlur={() => handleFieldBlur('purpose')}
                placeholder='e.g., Client meeting, Site visit'
                placeholderTextColor={COLORS.gray[400]}
              />
              {touched.purpose && errors.purpose && (
                <Text style={styles.errorText}>{errors.purpose}</Text>
              )}
            </View>

            {/* Business/Personal Toggle */}
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Business Trip</Text>
                  <Text style={styles.helper}>
                    Only business trips are tax deductible
                  </Text>
                </View>
                <Switch
                  value={isBusiness}
                  onValueChange={setIsBusiness}
                  trackColor={{
                    false: COLORS.gray[300],
                    true: COLORS.accent[300],
                  }}
                  thumbColor={
                    isBusiness ? COLORS.accent[400] : COLORS.gray[100]
                  }
                />
              </View>
            </View>

            {/* Deductible Amount Display */}
            {isBusiness && miles && parseFloat(miles) > 0 && (
              <View style={styles.deductibleCard}>
                <View style={styles.deductibleHeader}>
                  <Ionicons
                    name='calculator-outline'
                    size={24}
                    color={COLORS.success}
                  />
                  <Text style={styles.deductibleTitle}>
                    Tax Deductible Amount
                  </Text>
                </View>
                <View style={styles.deductibleCalc}>
                  <Text style={styles.deductibleCalcText}>
                    {miles} mi × {formatCurrency(ratePerMile)}/mi
                  </Text>
                  <Text style={styles.deductibleAmount}>
                    {formatCurrency(calculateDeductibleAmount())}
                  </Text>
                </View>
                <Text style={styles.deductibleNote}>
                  Based on IRS standard mileage rate for 2024
                </Text>
              </View>
            )}

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder='Add any additional notes...'
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Trip</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  milesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  milesField: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    paddingVertical: 12,
  },
  milesUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginLeft: 8,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  deductibleCard: {
    backgroundColor: COLORS.success + '10',
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.accent[400],
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
