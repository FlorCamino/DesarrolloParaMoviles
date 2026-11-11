import type { Resena } from "../types/business";

export const RESENAS_MOCK: Resena[] = [
  {
    id: "res-2210",
    comercioId: "com-118",
    usuarioId: "usr-512",
    usuarioNombre: "Marta G.",
    estrellas: 5,
    comentario:
      "Tenían el tornillo raro que no conseguía en ningún lado. Excelente atención.",
    respuesta: "¡Gracias por tu comentario! Siempre estamos para ayudarte.",
    reportada: false,
    creadaEn: "2026-10-18T17:05:00-03:00",
    sincronizada: true,
  },
  {
    id: "res-2211",
    comercioId: "com-118",
    usuarioId: "usr-620",
    usuarioNombre: "Carlos M.",
    estrellas: 4,
    comentario: "Muy buena atención y bastante variedad de herramientas.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-10-14T11:30:00-03:00",
    sincronizada: true,
  },
  {
    id: "res-2212",
    comercioId: "com-118",
    usuarioId: "usr-734",
    usuarioNombre: "Lucía R.",
    estrellas: 5,
    comentario:
      "Me asesoraron muy bien para elegir la pintura. Volvería a comprar.",
    respuesta: "¡Muchas gracias por confiar en nosotros!",
    reportada: false,
    creadaEn: "2026-10-08T16:20:00-03:00",
    sincronizada: true,
  },
  {
    id: "res-2213",
    comercioId: "com-205",
    usuarioId: "usr-801",
    usuarioNombre: "Sofía P.",
    estrellas: 5,
    comentario: "Las facturas son riquísimas y siempre están frescas.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-10-20T09:15:00-03:00",
    sincronizada: true,
  },
];
