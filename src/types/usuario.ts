export type Rol = 'vecino' | 'comercio';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  comercioId: string | null;
  favoritos: string[];
  rubrosDeInteres: string[];
  avisosActivos: boolean;
}