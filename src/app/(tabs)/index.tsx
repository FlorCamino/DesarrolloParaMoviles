import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const { usuario, logout } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Image source={require('@/assets/images/logo-directorio-comercios.png')} style={styles.logo} resizeMode="contain" accessible={false} />
          <Text style={styles.title}>Directorio de Comercios</Text>
          <Text style={styles.city}>CONCEPCIÓN DEL URUGUAY</Text>
          <View style={styles.accents}>
            <View style={[styles.accent, { backgroundColor: '#38BDF8' }]} />
            <View style={[styles.accent, { backgroundColor: '#10B981' }]} />
            <View style={[styles.accent, { backgroundColor: '#F59E0B' }]} />
          </View>
          <Text style={styles.tagline}>Todo lo que buscás, más cerca.</Text>
          <Text style={styles.description}>Descubrí comercios, servicios y promociones de tu ciudad.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Explorá tu ciudad</Text>
          <Text style={styles.description}>Encontrá comercios locales y conocé todo lo que tienen para ofrecer.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/explore')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Explorar comercios</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {usuario ? (
            <>
              <Text style={styles.cardTitle}>Hola, {usuario.nombre}</Text>
              <Text style={styles.description}>Sesión iniciada como {usuario.rol}</Text>
              <Pressable accessibilityRole="button" onPress={logout} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>Cerrar sesión</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.description}>¿Querés guardar favoritos, reseñar comercios y acceder a más funciones?</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/registro')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>Crear cuenta</Text>
              </Pressable>
            </>
          )}
        </View>
        <Text style={styles.footer}>Comercio local, ciudad más fuerte.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingBottom: 32, gap: 20 },
  brand: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  logo: { width: 84, height: 84, borderRadius: 18 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E3A8A', textAlign: 'center' },
  city: { fontSize: 11, letterSpacing: 2, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  accents: { flexDirection: 'row', gap: 5, marginVertical: 4 },
  accent: { width: 22, height: 4, borderRadius: 2 },
  tagline: { fontSize: 20, fontWeight: '600', color: '#0F172A', textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 23, color: '#64748B', textAlign: 'center' },
  card: { padding: 20, gap: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16 },
  cardTitle: { fontSize: 21, fontWeight: '700', color: '#1E3A8A', textAlign: 'center' },
  button: { minHeight: 50, padding: 14, backgroundColor: '#1E3A8A', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  secondaryButton: { minHeight: 50, padding: 14, borderWidth: 1, borderColor: '#1E3A8A', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '600', color: '#1E3A8A', textAlign: 'center' },
  pressed: { opacity: 0.7 },
  footer: { fontSize: 12, lineHeight: 18, color: '#64748B', textAlign: 'center' },
});
