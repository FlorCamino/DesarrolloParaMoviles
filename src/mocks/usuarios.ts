import type { Usuario } from '@/types/usuario';

export interface UsuarioMock extends Usuario {
  password: string;
}

export const usuariosMock: UsuarioMock[] = [
  {
    id: 'usr-512',
    nombre: 'Marta Giménez',
    email: 'marta@mail.com',
    password: '123456',
    rol: 'vecino',
    comercioId: null,
    favoritos: ['com-118'],
    rubrosDeInteres: ['rub-ferreteria'],
    avisosActivos: true,
  },
  {
    id: 'usr-com-118',
    nombre: 'Ferretería El Tornillo',
    email: 'tornillo@mail.com',
    password: '123456',
    rol: 'comercio',
    comercioId: 'com-118',
    favoritos: [],
    rubrosDeInteres: [],
    avisosActivos: true,
  },
];