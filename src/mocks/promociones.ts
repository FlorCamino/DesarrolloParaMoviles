import type { Promocion } from "../tipos/comercio";

export const PROMOCIONES_MOCK: Promocion[] = [
  {
    id: "pro-441",
    comercioId: "com-118",
    titulo: "15% de descuento en pinturas",
    detalle:
      "No acumulable con otras promociones. Descuento sujeto a disponibilidad de stock.",
    descuento: 15,
    desde: "2026-10-20T00:00:00-03:00",
    hasta: "2026-11-30T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 27,
    activa: true,
  },
  {
    id: "pro-442",
    comercioId: "com-205",
    titulo: "20% de descuento en productos seleccionados",
    detalle:
      "Válido para productos seleccionados de panadería. No acumulable con otras ofertas.",
    descuento: 20,
    desde: "2026-10-20T00:00:00-03:00",
    hasta: "2026-11-15T23:59:00-03:00",
    imagenUrl: null,
    soloApp: false,
    usos: 12,
    activa: true,
  },
  {
    id: "pro-443",
    comercioId: "com-306",
    titulo: "10% en indumentaria de temporada",
    detalle:
      "Descuento en prendas seleccionadas. Consultar disponibilidad en el local.",
    descuento: 10,
    desde: "2026-10-25T00:00:00-03:00",
    hasta: "2026-11-20T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 5,
    activa: true,
  },
];
