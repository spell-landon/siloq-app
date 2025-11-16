import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent[400],
        tabBarInactiveTintColor: COLORS.gray[500],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray[200],
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 16,
          height: 84,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='home-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='invoices'
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='document-text-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='expenses'
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='receipt-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='more'
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='ellipsis-horizontal' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='estimates'
        options={{
          href: null, // Hide from tab bar, accessible via More menu
        }}
      />
    </Tabs>
  );
}
