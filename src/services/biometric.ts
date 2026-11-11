import * as LocalAuthentication from 'expo-local-authentication';

export async function biometriaDisponible(): Promise<boolean> {
  const tieneHardware =
    await LocalAuthentication.hasHardwareAsync();

  if (!tieneHardware) {
    return false;
  }

  const estaConfigurada =
    await LocalAuthentication.isEnrolledAsync();

  return estaConfigurada;
}

export async function autenticarConBiometria(): Promise<boolean> {
  const resultado =
    await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmá tu identidad',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
    });

  return resultado.success;
}