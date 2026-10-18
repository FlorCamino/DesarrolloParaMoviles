import { BiometricReentry } from '@/components/biometric-reentry';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const {
    initializing,
    sesionPendiente,
  } = useAuth();

  return (
    <>
      <AnimatedSplashOverlay />

      {!initializing && (
        sesionPendiente ? (
          <BiometricReentry />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        )
      )}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
