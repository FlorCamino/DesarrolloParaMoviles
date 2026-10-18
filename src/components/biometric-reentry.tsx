import { useState } from 'react';

import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { router } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export function BiometricReentry() {
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
    } finally {
      setLoading(false);
    }
  };

  const handleLoginManual = () => {
    usarLoginManual();

    router.replace('/login');
  };

  return (
    <View style={styles.container}>
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
            style={styles.button}
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
        onPress={handleLoginManual}
        disabled={loading}
      >
        <Text style={styles.link}>
          Ingresar con email y contraseña
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
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 12,
  },

  description: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },

  button: {
    backgroundColor: '#1769e0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  link: {
    textAlign: 'center',
    marginTop: 22,
    color: '#1769e0',
    fontSize: 15,
  },

  error: {
    color: '#b00020',
    textAlign: 'center',
    marginTop: 16,
  },
});