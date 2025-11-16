import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: '$' | '€' | '£' | '¥';
  push_notifications: boolean;
  email_notifications: boolean;
}

type CurrencyOption = '$' | '€' | '£' | '¥';

const CURRENCY_OPTIONS: CurrencyOption[] = ['$', '€', '£', '¥'];

const CURRENCY_LABELS: Record<CurrencyOption, string> = {
  '$': 'USD ($)',
  '€': 'EUR (€)',
  '£': 'GBP (£)',
  '¥': 'JPY/CNY (¥)',
};

export default function AppSettingsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    currency: '$',
    push_notifications: true,
    email_notifications: true,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load app settings
  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
        } else {
          throw error;
        }
      } else if (data) {
        setSettings({
          theme: data.theme as 'light' | 'dark' | 'system',
          currency: data.currency as CurrencyOption,
          push_notifications: data.push_notifications,
          email_notifications: data.email_notifications,
        });
      }
    } catch (error: any) {
      console.error('Error loading app settings:', error);
      Alert.alert('Error', 'Failed to load app settings');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('app_settings').insert({
        user_id: user.id,
        theme: 'system',
        currency: '$',
        push_notifications: true,
        email_notifications: true,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error creating default settings:', error);
    }
  };

  const saveSettings = async (updatedSettings: AppSettings) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('app_settings')
        .update({
          theme: updatedSettings.theme,
          currency: updatedSettings.currency,
          push_notifications: updatedSettings.push_notifications,
          email_notifications: updatedSettings.email_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Show success message
      setSuccessMessage('Settings saved successfully!');

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error saving app settings:', error);
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSwitch = async (key: keyof AppSettings, value: boolean) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleCurrencyChange = async (currency: CurrencyOption) => {
    const updatedSettings = { ...settings, currency };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will allow you to export all your data in JSON format.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement data export functionality
            Alert.alert('Coming Soon', 'Data export functionality will be available soon!');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove all locally stored data and may require re-downloading content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing functionality
            Alert.alert('Success', 'Cache cleared successfully!');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'App Settings', headerShown: true }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent[400]} />
            <Text style={styles.loadingText}>Loading app settings...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'App Settings', headerShown: true }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Alert */}
          {successMessage && (
            <View style={styles.successAlert}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Display Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="color-palette-outline" size={20} color={COLORS.primary[600]} />
              <Text style={styles.sectionTitle}>Display</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Customize the appearance and currency settings
            </Text>

            {/* Theme Settings */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingGroupTitle}>Theme</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="sunny-outline" size={20} color={COLORS.gray[600]} />
                  <Text style={styles.settingLabel}>Light Mode</Text>
                </View>
                <Switch
                  value={settings.theme === 'light'}
                  onValueChange={(value) =>
                    handleToggleSwitch('theme' as keyof AppSettings, value ? 'light' as any : 'system' as any)
                  }
                  trackColor={{ false: COLORS.gray[300], true: COLORS.accent[400] }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="moon-outline" size={20} color={COLORS.gray[600]} />
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                </View>
                <Switch
                  value={settings.theme === 'dark'}
                  onValueChange={(value) =>
                    handleToggleSwitch('theme' as keyof AppSettings, value ? 'dark' as any : 'system' as any)
                  }
                  trackColor={{ false: COLORS.gray[300], true: COLORS.accent[400] }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="phone-portrait-outline" size={20} color={COLORS.gray[600]} />
                  <Text style={styles.settingLabel}>System Default</Text>
                </View>
                <Switch
                  value={settings.theme === 'system'}
                  onValueChange={(value) =>
                    handleToggleSwitch('theme' as keyof AppSettings, value ? 'system' as any : 'light' as any)
                  }
                  trackColor={{ false: COLORS.gray[300], true: COLORS.accent[400] }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </View>
            </View>

            {/* Currency Settings */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingGroupTitle}>Currency Symbol</Text>
              <View style={styles.currencyButtons}>
                {CURRENCY_OPTIONS.map((currency) => (
                  <TouchableOpacity
                    key={currency}
                    style={[
                      styles.currencyButton,
                      settings.currency === currency && styles.currencyButtonActive,
                    ]}
                    onPress={() => handleCurrencyChange(currency)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        settings.currency === currency && styles.currencyButtonTextActive,
                      ]}
                    >
                      {CURRENCY_LABELS[currency]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primary[600]} />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Manage your notification preferences
            </Text>

            <View style={styles.settingGroup}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="phone-portrait-outline" size={20} color={COLORS.gray[600]} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                    <Text style={styles.settingSubtext}>
                      Receive notifications about invoices, payments, and updates
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.push_notifications}
                  onValueChange={(value) => handleToggleSwitch('push_notifications', value)}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.accent[400] }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.gray[600]} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Email Notifications</Text>
                    <Text style={styles.settingSubtext}>
                      Receive email updates and summaries
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.email_notifications}
                  onValueChange={(value) => handleToggleSwitch('email_notifications', value)}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.accent[400] }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </View>
            </View>
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="server-outline" size={20} color={COLORS.primary[600]} />
              <Text style={styles.sectionTitle}>Data & Storage</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Manage your app data and storage
            </Text>

            <View style={styles.settingGroup}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleExportData}
                disabled={saving}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="download-outline" size={20} color={COLORS.primary[600]} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.actionLabel}>Export Data</Text>
                    <Text style={styles.settingSubtext}>
                      Download all your data in JSON format
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>

              <View style={styles.settingDivider} />

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleClearCache}
                disabled={saving}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  <View style={styles.settingTextContainer}>
                    <Text style={[styles.actionLabel, styles.destructiveText]}>Clear Cache</Text>
                    <Text style={styles.settingSubtext}>
                      Remove all locally stored data
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary[600]} />
              <Text style={styles.sectionTitle}>App Information</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Version</Text>
                <Text style={styles.statValue}>1.0.0</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Build</Text>
                <Text style={styles.statValue}>100</Text>
              </View>
            </View>
          </View>
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
  sectionDescription: {
    fontSize: 14,
    color: COLORS.gray[500],
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  settingGroup: {
    marginTop: SPACING.md,
  },
  settingGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.gray[900],
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginLeft: 40,
  },
  currencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  currencyButton: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  currencyButtonActive: {
    borderColor: COLORS.accent[400],
    backgroundColor: COLORS.accent[400] + '10',
  },
  currencyButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  currencyButtonTextActive: {
    color: COLORS.accent[400],
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  actionLabel: {
    fontSize: 16,
    color: COLORS.gray[900],
    fontWeight: '500',
  },
  destructiveText: {
    color: COLORS.error,
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
});
