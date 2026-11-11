import { BiometricReentry } from '@/components/biometric-reentry';
import { SincronizadorResenas } from '@/components/sincronizador-resenas';
import { AuthProvider } from '@/contexts/auth-context';
import { AvisoLoginProvider } from '@/contexts/aviso-login-context';
import { PromocionesProvider } from '@/contexts/promociones-context';
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
    usuario,
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
            <Stack.Protected guard={usuario?.rol === 'comercio' && Boolean(usuario.comercioId)}>
              <Stack.Screen name="panel_socio" />
            </Stack.Protected>
          </Stack>
        )
      )}
    </>
  );
}

function AppWithPromociones() {
  const { usuario } = useAuth();

  return (
    <PromocionesProvider key={usuario?.id ?? 'invitado'}>
      <AvisoLoginProvider>
        <AppNavigator />
      </AvisoLoginProvider>
    </PromocionesProvider>
  );
}

export default function RootLayout() {


  return (
    <ThemeProvider
      value={DefaultTheme}
    >
      <StatusBar style="dark" />
      <AuthProvider>
        <SincronizadorResenas />
        <AppWithPromociones />
      </AuthProvider>
    </ThemeProvider>
  );
}
