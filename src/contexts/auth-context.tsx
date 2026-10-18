import { createContext, ReactNode, useState, } from 'react';

import { login as loginService, registrar as registrarService, } from '@/services/auth';

import type { LoginCredentials, RegistroData, Sesion, } from '@/types/auth';

import type { Usuario } from '@/types/usuario';

interface AuthContextData {
  sesion: Sesion | null;
  usuario: Usuario | null;
  loading: boolean;

  login: (
    credentials: LoginCredentials
  ) => Promise<void>;

  registrar: (
    data: RegistroData
  ) => Promise<Usuario>;

  logout: () => void;
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

  const login = async (
    credentials: LoginCredentials
  ) => {
    try {
      setLoading(true);

      const nuevaSesion =
        await loginService(credentials);

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

  const logout = () => {
    setSesion(null);
  };

  return (
    <AuthContext.Provider
      value={{
        sesion,
        usuario: sesion?.usuario ?? null,
        loading,
        login,
        registrar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}