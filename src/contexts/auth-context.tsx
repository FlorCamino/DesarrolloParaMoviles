import { createContext, ReactNode, useEffect, useState } from 'react';

import { login as loginService, registrar as registrarService, obtenerUsuarioActual } from '@/services/auth';
import { eliminarSesion, guardarSesion, obtenerSesion, } from '@/services/session-storage';

import { autenticarConBiometria, biometriaDisponible } from '@/services/biometric';

import type { LoginCredentials, RegistroData, Sesion, } from '@/types/auth';

import type { Usuario } from '@/types/usuario';
import { ErrorHttp } from '@/services/http';

interface AuthContextData {
  sesion: Sesion | null;
  sesionPendiente: Sesion | null;

  usuario: Usuario | null;
  
  loading: boolean;
  initializing: boolean;

  puedeUsarBiometria: boolean;

  login: (
    credentials: LoginCredentials
  ) => Promise<void>;

  registrar: (
    data: RegistroData
  ) => Promise<Usuario>;

  logout: () => Promise<void>;

  reingresarConBiometria: 
  () => Promise<boolean>;

  usarLoginManual: () => void;
}

export const AuthContext =
  createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [sesion, setSesion] =
    useState<Sesion | null>(null);
  
  const [sesionPendiente, setSesionPendiente] =
  useState<Sesion | null>(null);

  const [puedeUsarBiometria, setPuedeUsarBiometria] =
    useState(false);
  
  const [loading, setLoading] =
    useState(false);

  const [initializing, setInitializing] =
  useState(true);
  
  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const sesionGuardada = await obtenerSesion();

        if (sesionGuardada) {
          setSesionPendiente(sesionGuardada);

          try {
            const disponible =
              await biometriaDisponible();

            setPuedeUsarBiometria(disponible);
          } catch {
            setPuedeUsarBiometria(false);
          }
        }
      } catch (error) {
        console.error(
          'Error al restaurar la sesión:',
          error
        );
      } finally {
        setInitializing(false);
      }
    };

    restaurarSesion();
  }, []);

  const login = async (
    credentials: LoginCredentials
  ) => {
    try {
      setLoading(true);

      const nuevaSesion =
        await loginService(credentials);

      await guardarSesion(nuevaSesion);

      setSesion(nuevaSesion);
      setSesionPendiente(null);
    } finally {
      setLoading(false);
    }
  };

  const registrar = async (
    data: RegistroData
  ): Promise<Usuario> => {
    try {
      setLoading(true);

      const nuevaSesion = await registrarService(data);
      await guardarSesion(nuevaSesion);
      setSesion(nuevaSesion);
      setSesionPendiente(null);
      return nuevaSesion.usuario;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await eliminarSesion();
    setSesion(null);
    setSesionPendiente(null);
  };

  const reingresarConBiometria =
  async (): Promise<boolean> => {
    if (!sesionPendiente) {
      return false;
    }

    const autenticado =
      await autenticarConBiometria();

    if (!autenticado) {
      return false;
    }

    let sesionActualizada = sesionPendiente;
    try {
      const usuario = await obtenerUsuarioActual(sesionPendiente.token);
      sesionActualizada = { ...sesionPendiente, usuario };
      await guardarSesion(sesionActualizada);
    } catch (error) {
      if (error instanceof ErrorHttp && error.estado === 401) {
        await logout();
        throw new Error('Tu sesión venció. Ingresá nuevamente con email y contraseña.');
      }
      if (!(error instanceof ErrorHttp && error.estado === 0)) throw error;
    }
    setSesion(sesionActualizada);
    setSesionPendiente(null);

    return true;
  };

  const usarLoginManual = () => {
    setSesionPendiente(null);
    setSesion(null);
  };

  return (
    <AuthContext.Provider
      value={{
        sesion,
        sesionPendiente,
        usuario: sesion?.usuario ?? null,
        loading,
        initializing,
        puedeUsarBiometria,
        login,
        registrar,
        logout,
        reingresarConBiometria,
        usarLoginManual,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
