import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/lib/stores/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initialize, loading } = useAuthStore();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Mark navigation as ready after first render
    if (!isNavigationReady) {
      setIsNavigationReady(true);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to app if authenticated
      router.replace('/(tabs)');
    }
  }, [session, segments, loading, isNavigationReady]);

  if (loading || !isNavigationReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F6FF4" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
