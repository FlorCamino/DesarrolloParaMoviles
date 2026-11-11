import type { Comercio } from "../types/business";
import {
  obtenerComercioPorId as obtenerComercioGuardado,
  obtenerComercios as obtenerComerciosConCache,
} from "./comercios";

export async function obtenerComercios(): Promise<Comercio[]> {
  return obtenerComerciosConCache();
}

export async function obtenerComercioPorId(
  id: string,
): Promise<Comercio | null> {
  return obtenerComercioGuardado(id);
}

export async function buscarComercios(
  termino: string,
  rubroId?: string,
): Promise<Comercio[]> {
  const comercios = await obtenerComerciosConCache();
  const busqueda = termino.trim().toLocaleLowerCase("es-AR");

  return comercios.filter((comercio) => {
    const coincideBusqueda =
      !busqueda ||
      comercio.nombre.toLocaleLowerCase("es-AR").includes(busqueda) ||
      comercio.direccion.toLocaleLowerCase("es-AR").includes(busqueda) ||
      comercio.descripcion.toLocaleLowerCase("es-AR").includes(busqueda);

    const coincideRubro = !rubroId || comercio.rubroId === rubroId;

    return coincideBusqueda && coincideRubro;
  });
}