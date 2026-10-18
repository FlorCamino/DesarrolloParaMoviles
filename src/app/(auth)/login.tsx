import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, } from 'react-native';

import { router } from 'expo-router';

import { login } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
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
      setLoading(true);

      const sesion = await login({
        email,
        password,
      });

      console.log('Login correcto:', sesion);

      router.replace('/');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <Text style={styles.label}>Email</Text>

      <TextInput
        style={styles.input}
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
        style={styles.button}
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
        onPress={() => router.push('/registro')}
        disabled={loading}
      >
        <Text style={styles.link}>
          ¿No tenés cuenta? Crear cuenta
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#1769e0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    marginTop: 18,
    color: '#1769e0',
    fontSize: 15,
  },
  error: {
    color: '#b00020',
    marginTop: 4,
  },
});