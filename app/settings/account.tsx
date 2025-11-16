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
import { validateEmail, validatePhone, validateRequired } from '@/lib/validation';
import type { Profile } from '@/lib/types/database';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export default function AccountSettingsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user profile data
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          fullName: data.full_name || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate full name
    if (!validateRequired(formData.fullName)) {
      newErrors.fullName = 'Full name is required';
    }

    // Validate phone (optional, but if provided must be valid)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
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

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Show success message
      setSuccessMessage('Account settings saved successfully!');

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save account settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Account Settings', headerShown: true }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent[400]} />
            <Text style={styles.loadingText}>Loading account settings...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Account Settings', headerShown: true }} />
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

            {/* Account Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary[600]} />
                <Text style={styles.sectionTitle}>Account Information</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>
                  Manage your personal account details
                </Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={formData.fullName}
                onChangeText={(text) => {
                  setFormData({ ...formData, fullName: text });
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: undefined });
                  }
                }}
                error={errors.fullName}
                autoCapitalize="words"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={formData.email}
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
                style={styles.disabledInput}
              />
              <Text style={styles.helperText}>
                Email address is managed through your authentication settings and cannot be
                changed here
              </Text>

              <Input
                label="Phone Number (Optional)"
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
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
              />
            </View>

            {/* Account Stats Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary[600]} />
                <Text style={styles.sectionTitle}>Account Details</Text>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>User ID</Text>
                  <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="middle">
                    {user?.id || 'N/A'}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Account Created</Text>
                  <Text style={styles.statValue}>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>
              </View>
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
  disabledInput: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.gray[500],
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  statsContainer: {
    marginTop: SPACING.md,
  },
  statItem: {
    paddingVertical: SPACING.md,
  },
  statDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    color: COLORS.gray[900],
    fontWeight: '400',
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
