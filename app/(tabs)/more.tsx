import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/lib/stores/auth';
import { COLORS } from '@/lib/theme';

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  onPress?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Business',
      items: [
        {
          title: 'Estimates',
          icon: 'calculator-outline',
          route: '/(tabs)/estimates',
        },
        {
          title: 'Mileage',
          icon: 'car-outline',
          route: '/mileage',
        },
        {
          title: 'Clients',
          icon: 'people-outline',
          route: '/clients',
        },
        {
          title: 'Line Item Templates',
          icon: 'list-outline',
          route: '/templates',
        },
      ],
    },
    {
      title: 'Reports',
      items: [
        {
          title: 'Reports',
          icon: 'analytics-outline',
          route: '/reports',
        },
        {
          title: 'Tax Report',
          icon: 'document-text-outline',
          route: '/tax-report',
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          title: 'Account Settings',
          icon: 'person-outline',
          route: '/settings/account',
        },
        {
          title: 'Business Settings',
          icon: 'briefcase-outline',
          route: '/settings/business',
        },
        {
          title: 'App Settings',
          icon: 'settings-outline',
          route: '/settings/app',
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.title}
      style={styles.menuItem}
      onPress={() => {
        if (item.onPress) {
          item.onPress();
        } else if (item.route) {
          router.push(item.route as any);
        }
      }}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={22} color={COLORS.primary[600]} />
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <Ionicons name='chevron-forward' size={20} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary[600] }}>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 0, backgroundColor: COLORS.primary[600] }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar style='light' />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>More</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {menuSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuGroup}>
                {section.items.map((item) => renderMenuItem(item))}
              </View>
            </View>
          ))}

          {/* Sign Out Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}>
              <Ionicons name='log-out-outline' size={22} color={COLORS.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>Siloq</Text>
            <Text style={styles.appVersion}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    backgroundColor: COLORS.primary[600],
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[600] + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
});
