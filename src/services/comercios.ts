import type { Comercio } from "../types/business";
import {
  guardarComercios,
  leerComerciosGuardados,
  obtenerFechaGuardado,
} from "./baseDatos";
import { obtenerCatalogoComercios } from "./catalogo-comercios";

export type ResultadoComercio = {
  comercio: Comercio | null;
  origen: "api" | "sqlite" | null;
  actualizadoEn: string | null;
};

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

export async function obtenerComercioPorIdConEstado(
  id: string,
): Promise<ResultadoComercio> {
  try {
    const comercios = await obtenerCatalogoComercios();

    if (comercios.length > 0) {
      await guardarComercios(comercios);

      return {
        comercio: comercios.find((item) => item.id === id) ?? null,
        origen: "api",
        actualizadoEn: await obtenerFechaGuardado(),
      };
    }
  } catch (error) {
    console.warn(
      "No se pudo obtener el comercio desde la API. Se usarán los datos locales.",
      error,
    );
  }

  const comerciosGuardados = await leerComerciosGuardados();

  return {
    comercio:
      comerciosGuardados.find((item) => item.id === id) ?? null,
    origen: comerciosGuardados.length > 0 ? "sqlite" : null,
    actualizadoEn:
      comerciosGuardados.length > 0
        ? await obtenerFechaGuardado()
        : null,
  };
}
