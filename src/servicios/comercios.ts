import { COMERCIOS_MOCK } from "../mocks/comercios";
import type { Comercio } from "../tipos/comercio";

export async function obtenerComercios(): Promise<Comercio[]> {
  return COMERCIOS_MOCK.filter((comercio) => comercio.activo);
}

export async function obtenerComercioPorId(
  id: string,
): Promise<Comercio | null> {
  const comercio = COMERCIOS_MOCK.find((item) => item.id === id && item.activo);

  return comercio ?? null;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function buscarComercios(
  termino: string,
  rubroId?: string,
): Promise<Comercio[]> {
  const comercios = await obtenerComercios();
  const busqueda = normalizarTexto(termino);

  return comercios.filter((comercio) => {
    const coincideTexto =
      busqueda.length === 0 ||
      [comercio.nombre, comercio.descripcion, comercio.direccion].some(
        (campo) => normalizarTexto(campo).includes(busqueda),
      );

    const coincideRubro = !rubroId || comercio.rubroId === rubroId;

    return coincideTexto && coincideRubro;
  });
}
