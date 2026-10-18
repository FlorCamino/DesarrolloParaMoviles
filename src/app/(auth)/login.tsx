import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, } from 'react-native';

import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, } = useAuth();
  const [error, setError] = useState('');

  const emailValido = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = async () => {
    setError('');

    if (!emailValido(email)) {
      setError('Ingresá un email válido.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Completá email y contraseña.');
      return;
    }

    try {
      await login({
        email,
        password,
      });

      router.replace('/');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } 
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
            <Text style={styles.title}>¡Bienvenido!</Text>
            <Text style={styles.description}>Conectate con los comercios de tu ciudad.</Text>

            <Text style={styles.label}>Email</Text>

            <TextInput
              style={styles.input}
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Text style={styles.label}>Contraseña</Text>

            <TextInput
              style={styles.input}
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              secureTextEntry
              editable={!loading}
            />

            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : null}

            <Pressable
              style={[styles.button, loading && styles.disabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  Ingresar
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, loading && styles.disabled]}
              onPress={() => router.push('/registro')}
              disabled={loading}
            >
              <Text style={styles.link}>
                Crear cuenta
              </Text>
            </Pressable>
          </View>
          <Text style={styles.guest}>Podés explorar comercios sin iniciar sesión.</Text>
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
  description: { fontSize: 15, lineHeight: 23, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1E3A8A', marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#0F172A', backgroundColor: '#F8FAFC', marginBottom: 18 },
  button: { minHeight: 52, backgroundColor: '#1E3A8A', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { minHeight: 52, borderWidth: 1, borderColor: '#1E3A8A', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  link: { color: '#1E3A8A', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.6 },
  error: { color: '#991B1B', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 12, borderRadius: 10, fontSize: 14, lineHeight: 20, marginBottom: 12, marginTop: 8 },
  guest: { fontSize: 13, lineHeight: 20, textAlign: 'center', color: '#64748B', marginTop: 20 },
  footer: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
