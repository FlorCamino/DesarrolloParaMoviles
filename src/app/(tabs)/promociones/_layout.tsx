import { Stack } from 'expo-router';

export default function PromocionesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#153E75',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle de promoción' }} />
      <Stack.Screen name="guardadas" options={{ title: 'Promociones guardadas' }} />
    </Stack>
  );
}
