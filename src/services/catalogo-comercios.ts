import type { Comercio } from '@/types/business';
import { listarTodo } from './api-listas';

export async function obtenerCatalogoComercios(): Promise<Comercio[]> {
  return listarTodo<Comercio>('/comercios');
}
