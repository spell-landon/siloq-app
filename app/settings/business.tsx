import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components/ui';
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateZipCode,
  validateTaxRate,
  validateTaxId,
  sanitizeNumberInput,
  enforcePositiveNumber,
} from '@/lib/validation';
import type { BusinessSettings } from '@/lib/types/database';

interface FormData {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  taxId: string;
  defaultPaymentTerms: string;
  defaultTaxRate: string;
  defaultNotes: string;
}

interface FormErrors {
  businessName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  defaultPaymentTerms?: string;
  defaultTaxRate?: string;
  defaultNotes?: string;
}

const PAYMENT_TERMS_OPTIONS = [
  'Due on Receipt',
  'Net 15',
  'Net 30',
  'Net 60',
  'Net 90',
];

export default function BusinessSettingsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    taxId: '',
    defaultPaymentTerms: 'Net 30',
    defaultTaxRate: '0',
    defaultNotes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load business settings data
  useEffect(() => {
    loadBusinessSettings();
  }, [user]);

  const loadBusinessSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine for first time
        throw error;
      }

      if (data) {
        setFormData({
          businessName: data.business_name || '',
          address: data.business_address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          phone: data.business_phone || '',
          email: data.business_email || '',
          taxId: data.tax_id || '',
          defaultPaymentTerms: data.default_payment_terms || 'Net 30',
          defaultTaxRate: data.default_tax_rate?.toString() || '0',
          defaultNotes: data.default_notes || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading business settings:', error);
      Alert.alert('Error', 'Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate business name (required)
    if (!validateRequired(formData.businessName)) {
      newErrors.businessName = 'Business name is required';
    }

    // Validate email (optional, but if provided must be valid)
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone (optional, but if provided must be valid)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    // Validate ZIP code (optional, but if provided must be valid)
    if (formData.zip && !validateZipCode(formData.zip)) {
      newErrors.zip = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    // Validate tax ID (optional, but if provided must be valid)
    if (formData.taxId && !validateTaxId(formData.taxId)) {
      newErrors.taxId = 'Please enter a valid Tax ID/EIN (9 digits)';
    }

    // Validate tax rate
    if (formData.defaultTaxRate && !validateTaxRate(formData.defaultTaxRate)) {
      newErrors.defaultTaxRate = 'Tax rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Clear previous success message
    setSuccessMessage(null);

    // Validate form
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);

      const settingsData = {
        user_id: user.id,
        business_name: formData.businessName.trim() || null,
        business_address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip: formData.zip.trim() || null,
        business_phone: formData.phone.trim() || null,
        business_email: formData.email.trim() || null,
        tax_id: formData.taxId.trim() || null,
        default_payment_terms: formData.defaultPaymentTerms || null,
        default_tax_rate: formData.defaultTaxRate ? parseFloat(formData.defaultTaxRate) : 0,
        default_notes: formData.defaultNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Try to update first, if no rows affected, insert
      const { data: existingData } = await supabase
        .from('business_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingData) {
        // Update existing record
        const result = await supabase
          .from('business_settings')
          .update(settingsData)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('business_settings')
          .insert(settingsData);
        error = result.error;
      }

      if (error) throw error;

      // Show success message
      setSuccessMessage('Business settings saved successfully!');

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error saving business settings:', error);
      Alert.alert('Error', error.message || 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Business Settings', headerShown: true }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent[400]} />
            <Text style={styles.loadingText}>Loading business settings...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Business Settings', headerShown: true }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Success Alert */}
            {successMessage && (
              <View style={styles.successAlert}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Business Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={20} color={COLORS.primary[600]} />
                <Text style={styles.sectionTitle}>Business Information</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>
                  Manage your business details and contact information
                </Text>
              </View>
            </View>

            {/* Business Information Form */}
            <View style={styles.formSection}>
              <Input
                label="Business Name"
                placeholder="Your Business LLC"
                value={formData.businessName}
                onChangeText={(text) => {
                  setFormData({ ...formData, businessName: text });
                  if (errors.businessName) {
                    setErrors({ ...errors, businessName: undefined });
                  }
                }}
                error={errors.businessName}
                autoCapitalize="words"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Address"
                placeholder="123 Main Street"
                value={formData.address}
                onChangeText={(text) => {
                  setFormData({ ...formData, address: text });
                  if (errors.address) {
                    setErrors({ ...errors, address: undefined });
                  }
                }}
                error={errors.address}
                autoCapitalize="words"
                containerStyle={styles.inputContainer}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="City"
                    placeholder="New York"
                    value={formData.city}
                    onChangeText={(text) => {
                      setFormData({ ...formData, city: text });
                      if (errors.city) {
                        setErrors({ ...errors, city: undefined });
                      }
                    }}
                    error={errors.city}
                    autoCapitalize="words"
                    containerStyle={styles.inputContainer}
                  />
                </View>
                <View style={styles.spacing} />
                <View style={styles.flex1}>
                  <Input
                    label="State"
                    placeholder="NY"
                    value={formData.state}
                    onChangeText={(text) => {
                      setFormData({ ...formData, state: text.toUpperCase() });
                      if (errors.state) {
                        setErrors({ ...errors, state: undefined });
                      }
                    }}
                    error={errors.state}
                    autoCapitalize="characters"
                    maxLength={2}
                    containerStyle={styles.inputContainer}
                  />
                </View>
              </View>

              <Input
                label="ZIP Code"
                placeholder="12345"
                value={formData.zip}
                onChangeText={(text) => {
                  setFormData({ ...formData, zip: text });
                  if (errors.zip) {
                    setErrors({ ...errors, zip: undefined });
                  }
                }}
                error={errors.zip}
                keyboardType="number-pad"
                maxLength={10}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Phone Number"
                placeholder="(123) 456-7890"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: undefined });
                  }
                }}
                error={errors.phone}
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Email Address"
                placeholder="business@example.com"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Tax ID / EIN"
                placeholder="12-3456789"
                value={formData.taxId}
                onChangeText={(text) => {
                  setFormData({ ...formData, taxId: text });
                  if (errors.taxId) {
                    setErrors({ ...errors, taxId: undefined });
                  }
                }}
                error={errors.taxId}
                keyboardType="number-pad"
                containerStyle={styles.inputContainer}
              />
            </View>

            {/* Invoice Defaults Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.primary[600]} />
                <Text style={styles.sectionTitle}>Invoice Defaults</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>
                  Set default values for new invoices
                </Text>
              </View>
            </View>

            {/* Invoice Defaults Form */}
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Default Payment Terms</Text>
                <View style={styles.paymentTermsContainer}>
                  {PAYMENT_TERMS_OPTIONS.map((term) => (
                    <Button
                      key={term}
                      variant={formData.defaultPaymentTerms === term ? 'primary' : 'outline'}
                      size="sm"
                      onPress={() => setFormData({ ...formData, defaultPaymentTerms: term })}
                      style={styles.paymentTermButton}
                    >
                      {term}
                    </Button>
                  ))}
                </View>
              </View>

              <Input
                label="Default Tax Rate (%)"
                placeholder="0.00"
                value={formData.defaultTaxRate}
                onChangeText={(text) => {
                  const sanitized = enforcePositiveNumber(sanitizeNumberInput(text));
                  setFormData({ ...formData, defaultTaxRate: sanitized });
                  if (errors.defaultTaxRate) {
                    setErrors({ ...errors, defaultTaxRate: undefined });
                  }
                }}
                error={errors.defaultTaxRate}
                keyboardType="decimal-pad"
                containerStyle={styles.inputContainer}
              />
              <Text style={styles.helperText}>
                This tax rate will be automatically applied to new invoices
              </Text>

              <Input
                label="Default Notes (Optional)"
                placeholder="Thank you for your business!"
                value={formData.defaultNotes}
                onChangeText={(text) => {
                  setFormData({ ...formData, defaultNotes: text });
                  if (errors.defaultNotes) {
                    setErrors({ ...errors, defaultNotes: undefined });
                  }
                }}
                error={errors.defaultNotes}
                multiline
                numberOfLines={4}
                style={styles.textArea}
                containerStyle={styles.inputContainer}
              />
              <Text style={styles.helperText}>
                These notes will appear at the bottom of your invoices by default
              </Text>
            </View>
          </ScrollView>

          {/* Save Button - Fixed at Bottom */}
          <View style={styles.bottomSection}>
            <Button
              variant="primary"
              size="lg"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: SPACING.lg,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successText: {
    fontSize: 14,
    color: COLORS.gray[900],
    marginLeft: SPACING.md,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginLeft: SPACING.sm,
  },
  sectionContent: {
    marginTop: SPACING.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.gray[500],
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  spacing: {
    width: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  paymentTermsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  paymentTermButton: {
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  bottomSection: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    width: '100%',
  },
});
