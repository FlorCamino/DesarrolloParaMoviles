import type { Comercio } from "../types/business";
import {
  guardarComercios,
  leerComerciosGuardados,
} from "./baseDatos";
import { obtenerCatalogoComercios } from "./catalogo-comercios";

export async function obtenerComercios(): Promise<Comercio[]> {
  try {
    const comercios = await obtenerCatalogoComercios();

    if (comercios.length > 0) {
      await guardarComercios(comercios);
      return comercios;
    }
  } catch (error) {
    console.warn(
      "No se pudo obtener el catálogo. Se usarán los datos locales.",
      error,
    );
  }

  return leerComerciosGuardados();
}

export async function obtenerComercioPorId(
  id: string,
): Promise<Comercio | null> {
  const comercios = await obtenerComercios();
  return comercios.find((comercio) => comercio.id === id) ?? null;
}
