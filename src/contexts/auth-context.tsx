import { createContext, ReactNode, useEffect, useState } from 'react';

import { login as loginService, registrar as registrarService, } from '@/services/auth';
import { eliminarSesion, guardarSesion, obtenerSesion, } from '@/services/session-storage';

import type { LoginCredentials, RegistroData, Sesion, } from '@/types/auth';

import type { Usuario } from '@/types/usuario';

interface AuthContextData {
  sesion: Sesion | null;
  usuario: Usuario | null;
  
  loading: boolean;
  initializing: boolean;

  login: (
    credentials: LoginCredentials
  ) => Promise<void>;

  registrar: (
    data: RegistroData
  ) => Promise<Usuario>;

  logout: () => Promise<void>;
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
  
  const [loading, setLoading] =
    useState(false);

  const [initializing, setInitializing] =
  useState(true);
  
  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const sesionGuardada = await obtenerSesion();

        if (sesionGuardada) {
          setSesion(sesionGuardada);
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
    } finally {
      setLoading(false);
    }
  };

  const registrar = async (
    data: RegistroData
  ): Promise<Usuario> => {
    try {
      setLoading(true);

      return await registrarService(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await eliminarSesion();
    setSesion(null);
  };

  return (
    <AuthContext.Provider
      value={{
        sesion,
        usuario: sesion?.usuario ?? null,
        loading,
        initializing,
        login,
        registrar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}