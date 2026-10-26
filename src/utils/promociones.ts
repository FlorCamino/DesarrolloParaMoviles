import type { EstadoPromocion, FiltroEstado, Promocion } from '@/types/promociones';

export const DIAS_POR_VENCER = 3;

export function obtenerEstadoPromocion(
  promocion: Promocion,
  ahora = new Date(),
): EstadoPromocion {
  const desde = new Date(promocion.desde).getTime();
  const hasta = new Date(promocion.hasta).getTime();
  const instante = ahora.getTime();

  if (!promocion.activa || instante > hasta) return 'vencida';
  if (instante < desde) return 'proxima';

  const limitePorVencer = DIAS_POR_VENCER * 24 * 60 * 60 * 1000;
  if (hasta - instante <= limitePorVencer) return 'porVencer';

  return 'vigente';
}

export function promocionCoincideConFiltro(
  promocion: Promocion,
  filtro: FiltroEstado,
  ahora = new Date(),
): boolean {
  const estado = obtenerEstadoPromocion(promocion, ahora);

  if (estado === 'vencida') return false;
  if (filtro === 'todas') return true;
  if (filtro === 'vigentes') return estado === 'vigente' || estado === 'porVencer';
  if (filtro === 'proximas') return estado === 'proxima';
  return estado === 'porVencer';
}

export function diasHastaVencimiento(promocion: Promocion, ahora = new Date()): number {
  const diferencia = new Date(promocion.hasta).getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(diferencia / (24 * 60 * 60 * 1000)));
}

export function textoDiasHastaVencimiento(
  promocion: Promocion,
  ahora = new Date(),
): string {
  const estado = obtenerEstadoPromocion(promocion, ahora);

  if (estado === 'vencida') return 'Promoción vencida';

  const fechaVencimiento = new Date(promocion.hasta);
  const diaArgentina = (fecha: Date) => fecha.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const venceHoy = diaArgentina(fechaVencimiento) === diaArgentina(ahora);

  if (venceHoy) return 'Vence hoy';

  const dias = diasHastaVencimiento(promocion, ahora);
  if (dias === 1) return 'Queda 1 día';
  return `Quedan ${dias} días`;
}

export function formatearFechaArgentina(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export function ordenarPromociones(promociones: Promocion[]): Promocion[] {
  return [...promociones].sort(
    (a, b) => new Date(a.hasta).getTime() - new Date(b.hasta).getTime(),
  );
}
