import { COMERCIOS_MOCK } from "../mocks/comercios";
import type { Comercio } from "../types/business";

/**
 * Catálogo temporal de comercios.
 * Cuando se integre la API, se reemplazará esta función
 * por la petición al servidor.
 */
export async function obtenerCatalogoComercios(): Promise<Comercio[]> {
  return COMERCIOS_MOCK.filter((comercio) => comercio.activo);
}
