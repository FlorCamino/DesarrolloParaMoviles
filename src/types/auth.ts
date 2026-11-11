import type { Usuario } from './usuario';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistroData {
  nombre: string;
  email: string;
  password: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}