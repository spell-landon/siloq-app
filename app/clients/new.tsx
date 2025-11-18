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
import { validateRequired, validateEmail } from '@/lib/validation';
import { COLORS } from '@/lib/theme';

export default function NewClientScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'name':
        if (!validateRequired(value)) {
          return 'Client name is required';
        }
        break;
      case 'email':
        if (value && !validateEmail(value)) {
          return 'Invalid email address';
        }
        break;
    }
    return '';
  };

  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const value = field === 'name' ? name : field === 'email' ? email : '';
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (touched.name) {
      const error = validateField('name', value);
      setErrors({ ...errors, name: error });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const error = validateField('email', value);
      setErrors({ ...errors, email: error });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all fields
    const nameError = validateField('name', name);
    const emailError = validateField('email', email);

    const newErrors = {
      name: nameError,
      email: emailError,
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true });

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== '')) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          mobile: mobile.trim() || null,
          website: website.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
          country: country.trim() || null,
          tax_id: taxId.trim() || null,
          notes: notes.trim() || null,
          is_active: isActive,
          status: isActive ? 'active' : 'inactive',
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Client created successfully', [
        {
          text: 'View',
          onPress: () => router.replace(`/clients/${data.id}`),
        },
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating client:', error);
      Alert.alert('Error', error.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Client',
          headerShown: true,
          headerBackTitle: '',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={COLORS.accent[400]} />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Client Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, touched.name && errors.name ? styles.inputError : null]}
                placeholder="Acme Corporation"
                value={name}
                onChangeText={handleNameChange}
                onBlur={() => handleFieldBlur('name')}
                autoCapitalize="words"
              />
              {touched.name && errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={contactPerson}
                onChangeText={setContactPerson}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active Client</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.accent[200] }}
                  thumbColor={isActive ? COLORS.accent[400] : COLORS.gray[500]}
                />
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, touched.email && errors.email ? styles.inputError : null]}
                placeholder="contact@acme.com"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => handleFieldBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.email && errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 987-6543"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="https://acme.com"
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="San Francisco"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>State/Province</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CA"
                  value={state}
                  onChangeText={setState}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="94102"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="United States"
                value={country}
                onChangeText={setCountry}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tax ID / EIN</Text>
              <TextInput
                style={styles.input}
                placeholder="12-3456789"
                value={taxId}
                onChangeText={setTaxId}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes about this client..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
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
  scrollView: {
    flex: 1,
  },
  saveButton: {
    fontSize: 16,
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
  fieldGroup: {
    marginBottom: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
