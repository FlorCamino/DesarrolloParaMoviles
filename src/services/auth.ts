import type { LoginCredentials, RegistroData, Sesion } from '@/types/auth';
import type { Usuario } from '@/types/usuario';
import { solicitarApi } from './api';

export async function login(credentials: LoginCredentials): Promise<Sesion> {
  const respuesta = await solicitarApi<Sesion>('/auth/ingreso', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      contrasena: credentials.password,
    }),
  });
  return respuesta.datos;
}

export async function registrar(data: RegistroData): Promise<Sesion> {
  const respuesta = await solicitarApi<Sesion>('/auth/registro', {
    method: 'POST',
    body: JSON.stringify({
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      contrasena: data.password,
    }),
  });
  return respuesta.datos;
}

export async function obtenerUsuarioActual(token: string): Promise<Usuario> {
  return (await solicitarApi<Usuario>('/yo', {}, token)).datos;
}
