import { PROMOCIONES_MOCK } from "../mocks/promociones";
import type { Promocion } from "../tipos/comercio";

export async function obtenerPromocionesVigentesPorComercio(
  comercioId: string,
): Promise<Promocion[]> {
  const ahora = Date.now();

  return PROMOCIONES_MOCK.filter((promocion) => {
    const desde = new Date(promocion.desde).getTime();
    const hasta = new Date(promocion.hasta).getTime();

    return (
      promocion.comercioId === comercioId &&
      promocion.activa &&
      desde <= ahora &&
      ahora <= hasta
    );
  });
}
