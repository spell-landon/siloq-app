import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth';

export default function Index() {
  const { session } = useAuthStore();

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
