import { RESENAS_MOCK } from "../mocks/resenas";
import type { Resena } from "../tipos/comercio";

export async function obtenerResenasPorComercio(
  comercioId: string,
): Promise<Resena[]> {
  const idBuscado = comercioId.trim().toLowerCase();

  return RESENAS_MOCK.filter(
    (resena) => resena.comercioId.trim().toLowerCase() === idBuscado,
  ).sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
  );
}
