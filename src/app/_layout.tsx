import { BiometricReentry } from '@/components/biometric-reentry';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

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
            <Stack.Screen name="comercio/[id]" options={{ headerShown: true, title: "Ficha del comercio" }} />
          </Stack>
        )
      )}
    </>
  );
}

export default function RootLayout() {


  return (
    <ThemeProvider
      value={DefaultTheme}
    >
      <StatusBar style="dark" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
