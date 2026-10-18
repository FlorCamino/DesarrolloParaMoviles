import { usuariosMock } from '@/mocks/usuarios';

import type { LoginCredentials, RegistroData, Sesion, } from '@/types/auth';

import type { Usuario } from '@/types/usuario';

const esperar = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function quitarPassword(
  usuario: (typeof usuariosMock)[number]
): Usuario {
  const { password: _, ...usuarioSinPassword } = usuario;

  return usuarioSinPassword;
}

export async function login(
  credentials: LoginCredentials
): Promise<Sesion> {
  await esperar(700);

  const emailNormalizado = credentials.email.trim().toLowerCase();

  const usuario = usuariosMock.find(
    (item) =>
      item.email.toLowerCase() === emailNormalizado &&
      item.password === credentials.password
  );

  if (!usuario) {
    throw new Error('Email o contraseña incorrectos.');
  }

  return {
    token: `mock-token-${usuario.id}`,
    usuario: quitarPassword(usuario),
  };
}

export async function registrar(
  data: RegistroData
): Promise<Usuario> {
  await esperar(700);

  const emailNormalizado = data.email.trim().toLowerCase();

  const emailExiste = usuariosMock.some(
    (usuario) =>
      usuario.email.toLowerCase() === emailNormalizado
  );

  if (emailExiste) {
    throw new Error('Ya existe una cuenta con ese email.');
  }

  const nuevoUsuario = {
    id: `usr-${Date.now()}`,
    nombre: data.nombre.trim(),
    email: emailNormalizado,
    password: data.password,
    rol: 'vecino' as const,
    comercioId: null,
    favoritos: [],
    rubrosDeInteres: [],
    avisosActivos: true,
  };

  usuariosMock.push(nuevoUsuario);

  return quitarPassword(nuevoUsuario);
}