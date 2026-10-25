import { COMERCIOS_MOCK, PROMOCIONES_MOCK, RUBROS_MOCK } from '@/mocks/promociones';
import {
  ComercioResumen,
  ModoDemo,
  Promocion,
  RespuestaApi,
  Rubro,
  UsoDePromocion,
} from '@/types/promociones';
import { obtenerEstadoPromocion, ordenarPromociones } from '@/utils/promociones';

const esperar = (milisegundos: number) =>
  new Promise<void>((resolver) => setTimeout(resolver, milisegundos));

export class ErrorApi extends Error {
  constructor(public codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

export async function listarPromociones(
  modo: ModoDemo = 'normal',
): Promise<RespuestaApi<Promocion[]>> {
  await esperar(350);

  if (modo === 'error') {
    throw new ErrorApi('SIN_CONEXION', 'No pudimos actualizar las promociones.');
  }
  if (modo === 'vacio') {
    return { datos: [], meta: { total: 0, pagina: 1, porPagina: 20 } };
  }

  const visibles = PROMOCIONES_MOCK.filter(
    (promocion) => obtenerEstadoPromocion(promocion) !== 'vencida',
  );

  return {
    datos: ordenarPromociones(visibles),
    meta: { total: visibles.length, pagina: 1, porPagina: 20 },
  };
}

export async function obtenerPromocion(id: string): Promise<Promocion> {
  await esperar(180);
  const promocion = PROMOCIONES_MOCK.find((item) => item.id === id);

  if (!promocion) {
    throw new ErrorApi('PROMO_NO_ENCONTRADA', 'La promoción no existe.');
  }
  if (obtenerEstadoPromocion(promocion) === 'vencida') {
    throw new ErrorApi('PROMO_VENCIDA', 'Esa promoción ya no está vigente.');
  }
  return promocion;
}

export async function listarRubros(): Promise<Rubro[]> {
  await esperar(80);
  return [...RUBROS_MOCK].sort((a, b) => a.orden - b.orden);
}

export async function listarComerciosResumen(): Promise<ComercioResumen[]> {
  await esperar(80);
  return COMERCIOS_MOCK;
}

export async function obtenerCodigoDeUso(
  promocionId: string,
  usuarioId: string,
): Promise<UsoDePromocion> {
  const promocion = await obtenerPromocion(promocionId);
  if (!promocion.soloApp) {
    throw new ErrorApi('PROMO_SIN_CODIGO', 'Esta promoción no necesita código.');
  }

  const partePromo = promocionId.replace(/\D/g, '').padStart(3, '0').slice(-3);
  const parteUsuario = usuarioId.replace(/\D/g, '').padStart(3, '0').slice(-3);
  const control = `${promocionId}-${usuarioId}`
    .split('')
    .reduce((total, caracter) => total + caracter.charCodeAt(0), 0)
    .toString()
    .padStart(4, '0')
    .slice(-4);

  return {
    id: `uso-${promocionId}-${usuarioId}`,
    promocionId,
    usuarioId,
    codigo: `CCU-${partePromo}-${parteUsuario}-${control}`,
    validadoEn: null,
  };
}
