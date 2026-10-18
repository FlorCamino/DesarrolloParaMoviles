import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, } from 'react-native';

import { router } from 'expo-router';

import { registrar } from '@/services/auth';

export default function RegistroScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailValido = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};

  const handleRegistro = async () => {
    setError('');

    if (
      !nombre.trim() ||
      !email.trim() ||
      !password ||
      !confirmacion
    ) {
      setError('Completá todos los campos.');
      return;
    }

    if (!emailValido(email)) {
      setError('Ingresá un email válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      const usuario = await registrar({
        nombre,
        email,
        password,
      });

      console.log('Usuario registrado:', usuario);

      router.replace('/login');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error al crear la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <Text style={styles.label}>Nombre</Text>

      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre completo"
        editable={!loading}
      />

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

      <Text style={styles.label}>
        Confirmar contraseña
      </Text>

      <TextInput
        style={styles.input}
        value={confirmacion}
        onChangeText={setConfirmacion}
        placeholder="Repetir contraseña"
        secureTextEntry
        editable={!loading}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <Pressable
        style={styles.button}
        onPress={handleRegistro}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Crear cuenta
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.link}>
          Ya tengo una cuenta
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