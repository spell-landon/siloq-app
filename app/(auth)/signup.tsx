import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components/ui';
import { COLORS } from '@/lib/theme';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName);
      Alert.alert('Success', 'Account created! Please check your email.');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Get Started</Text>
              <Text style={styles.subtitle}>Create your Siloq account</Text>
            </View>

            <View style={styles.form}>
              <Input
                label='Full Name'
                placeholder='John Doe'
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize='words'
              />
              <Input
                label='Email'
                placeholder='name@example.com'
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                keyboardType='email-address'
              />
              <Input
                label='Password'
                placeholder='At least 6 characters'
                value={password}
                onChangeText={setPassword}
                autoCapitalize='none'
              />
              <Input
                label='Confirm Password'
                placeholder='Re-enter password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize='none'
              />
              <Button
                variant='primary'
                size='lg'
                onPress={handleSignUp}
                loading={loading}
                style={styles.button}>
                Create Account
              </Button>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Link href='/(auth)/login' asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  header: { marginBottom: 48 },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary[600],
    marginBottom: 8,
  },
  subtitle: { fontSize: 18, color: COLORS.gray[500] },
  form: {},
  button: { marginTop: 24 },
  footer: { marginTop: 32 },
  footerText: { textAlign: 'center', color: COLORS.gray[500], fontSize: 16 },
  link: { color: COLORS.accent[400], fontWeight: '600' },
});
