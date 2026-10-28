import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const { usuario, logout } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={[styles.description, { textAlign: 'center' }]}>Descubrí comercios, servicios y promociones de tu ciudad.</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/comercios')} style={({ pressed }) => [styles.exploreCard, pressed && styles.pressed]}>
          <View style={styles.exploreCopy}>
            <Text style={styles.exploreEyebrow}>EXPLORÁ TU CIUDAD</Text>
            <Text style={styles.exploreTitle}>Tu próximo descubrimiento está cerca.</Text>
            <Text style={styles.exploreLink}>Buscar comercios →</Text>
          </View>
          <Text style={styles.exploreArrow} accessible={false}>↗</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promociones y beneficios</Text>
          <Text style={styles.description}>Consultá ofertas, filtrá por rubro y guardá las que te interesan.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/promociones')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Ver promociones</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/avisos')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Mis avisos y preferencias</Text>
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
  screen: { flex: 1, backgroundColor: '#F3F6FC' },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20, paddingBottom: 36, gap: 18 },
  brand: { alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 14 },
  logo: { width: 68, height: 68, borderRadius: 18 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: '800', color: '#172E62', textAlign: 'center', letterSpacing: -0.7 },
  city: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', color: '#536582', textAlign: 'center' },
  accents: { flexDirection: 'row', gap: 5, marginVertical: 4 },
  accent: { width: 22, height: 4, borderRadius: 2 },
  tagline: { fontSize: 18, lineHeight: 25, fontWeight: '600', color: '#172E62', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 22, color: '#536582' },
  card: { padding: 22, gap: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 22, shadowColor: '#172E62', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  cardTitle: { fontSize: 20, lineHeight: 27, fontWeight: '700', color: '#172E62', letterSpacing: -0.4 },
  button: { minHeight: 52, padding: 14, backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  secondaryButton: { minHeight: 50, padding: 14, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '600', color: '#2455B8', textAlign: 'center' },
  exploreCard: { padding: 22, borderRadius: 22, backgroundColor: '#172E62', flexDirection: 'row', alignItems: 'center', gap: 12 },
  exploreCopy: { flex: 1, gap: 12 },
  exploreEyebrow: { color: '#B9CEF5', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  exploreTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  exploreLink: { color: '#D9E7FF', fontSize: 14, fontWeight: '600' },
  exploreArrow: { color: '#B9CEF5', fontSize: 32 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  footer: { fontSize: 12, lineHeight: 18, color: '#64748B', textAlign: 'center' },
});
