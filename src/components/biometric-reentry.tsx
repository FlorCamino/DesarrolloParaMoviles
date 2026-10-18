import { useState } from 'react';

import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, } from 'react-native';

import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export function BiometricReentry() {
  const insets = useSafeAreaInsets();
  const {
    sesionPendiente,
    puedeUsarBiometria,
    reingresarConBiometria,
    usarLoginManual,
  } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleBiometria = async () => {
    try {
      setError('');
      setLoading(true);

      const correcto =
        await reingresarConBiometria();

      if (!correcto) {
        setError(
          'No se pudo verificar tu identidad.'
        );
      }
    } catch {
      setError(
        'Ocurrió un error al verificar tu identidad.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginManual = () => {
    usarLoginManual();

    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.content}>
          <View style={styles.brand}>
            <Image source={require('@/assets/images/logo-directorio-comercios.png')} style={styles.logo} resizeMode="contain" accessible={false} />
            <Text style={styles.brandName}>Directorio de Comercios</Text>
            <Text style={styles.city}>CONCEPCIÓN DEL URUGUAY</Text>
            <View style={styles.accents}>
              <View style={[styles.accent, { backgroundColor: '#38BDF8' }]} />
              <View style={[styles.accent, { backgroundColor: '#10B981' }]} />
              <View style={[styles.accent, { backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>
              Bienvenido nuevamente
            </Text>

            {sesionPendiente && (
              <Text style={styles.subtitle}>
                {sesionPendiente.usuario.nombre}
              </Text>
            )}

            {puedeUsarBiometria ? (
              <>
                <Text style={styles.description}>
                  Confirmá tu identidad para continuar.
                </Text>

                <Pressable
                  style={[styles.button, loading && styles.disabled]}
                  onPress={handleBiometria}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Ingresar con biometría
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <Text style={styles.description}>
                Este dispositivo no tiene biometría
                disponible o configurada.
              </Text>
            )}

            {error ? (
              <Text style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              style={[styles.secondaryButton, loading && styles.disabled]}
              onPress={handleLoginManual}
              disabled={loading}
            >
              <Text style={styles.link}>
                Ingresar con email y contraseña
              </Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>Comercio local, ciudad más fuerte.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#E0F2FE', marginBottom: 12 },
  brandName: { fontSize: 23, fontWeight: '800', color: '#1E3A8A', textAlign: 'center' },
  city: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#64748B', textAlign: 'center', marginTop: 8 },
  accents: { flexDirection: 'row', gap: 5, marginTop: 16 },
  accent: { width: 22, height: 4, borderRadius: 2 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0px 6px 24px rgba(30, 58, 138, 0.06)' },
  title: { fontSize: 28, fontWeight: '800', color: '#1E3A8A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#1E3A8A', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  description: { fontSize: 15, lineHeight: 23, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  button: { minHeight: 52, backgroundColor: '#1E3A8A', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { minHeight: 52, borderWidth: 1, borderColor: '#1E3A8A', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  link: { color: '#1E3A8A', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.6 },
  error: { color: '#991B1B', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 12, borderRadius: 10, fontSize: 14, lineHeight: 20, marginBottom: 12, marginTop: 8 },
  footer: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
