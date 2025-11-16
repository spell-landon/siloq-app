import Constants from 'expo-constants';

const getEnvVar = (key: string): string => {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key];

  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }

  return value;
};

export const config = {
  supabase: {
    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  },
} as const;
