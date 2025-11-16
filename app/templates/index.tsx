import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';

export default function TemplatesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Line Item Templates', headerShown: true }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="list-outline" size={64} color={COLORS.gray[400]} />
          <Text style={styles.title}>Line Item Templates</Text>
          <Text style={styles.subtitle}>Coming Soon</Text>
          <Text style={styles.description}>
            Create reusable templates for common services and products
          </Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accent[400],
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
});
