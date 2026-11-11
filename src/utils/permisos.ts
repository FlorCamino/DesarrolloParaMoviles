import type { Usuario } from '@/types/usuario';

export function requiereSesion(usuario: Usuario | null): Usuario {
  if (!usuario) throw new Error('Iniciá sesión para usar esta función.');
  return usuario;
}

export function requiereSocio(usuario: Usuario | null): string {
  const actual = requiereSesion(usuario);
  if (actual.rol !== 'comercio' || !actual.comercioId) {
    throw new Error('Esta operación requiere una cuenta de comercio.');
  }
  return actual.comercioId;
}
