import assert from 'node:assert/strict';
import test from 'node:test';
import type { Promocion } from '../src/types/promociones.ts';
import {
  diasHastaVencimiento,
  obtenerEstadoPromocion,
  promocionCoincideConFiltro,
  textoDiasHastaVencimiento,
} from '../src/utils/promociones.ts';

const ahora = new Date('2026-09-07T15:00:00-03:00');

function crearPromocion(cambios: Partial<Promocion> = {}): Promocion {
  return {
    id: 'pro-test',
    comercioId: 'com-test',
    titulo: 'Promoción de prueba',
    detalle: 'Condiciones',
    descuento: 15,
    desde: '2026-09-01T00:00:00-03:00',
    hasta: '2026-09-20T23:59:00-03:00',
    imagenUrl: null,
    soloApp: true,
    usos: 0,
    activa: true,
    ...cambios,
  };
}

test('clasifica una promoción vigente', () => {
  assert.equal(obtenerEstadoPromocion(crearPromocion(), ahora), 'vigente');
});

test('clasifica una promoción que empieza en el futuro', () => {
  const promocion = crearPromocion({ desde: '2026-09-10T00:00:00-03:00' });
  assert.equal(obtenerEstadoPromocion(promocion, ahora), 'proxima');
});

test('clasifica como por vencer si faltan tres días o menos', () => {
  const promocion = crearPromocion({ hasta: '2026-09-09T12:00:00-03:00' });
  assert.equal(obtenerEstadoPromocion(promocion, ahora), 'porVencer');
  assert.equal(promocionCoincideConFiltro(promocion, 'vigentes', ahora), true);
  assert.equal(promocionCoincideConFiltro(promocion, 'porVencer', ahora), true);
});

test('no muestra promociones vencidas o dadas de baja', () => {
  const vencida = crearPromocion({ hasta: '2026-09-06T23:59:00-03:00' });
  const inactiva = crearPromocion({ activa: false });
  assert.equal(obtenerEstadoPromocion(vencida, ahora), 'vencida');
  assert.equal(obtenerEstadoPromocion(inactiva, ahora), 'vencida');
  assert.equal(promocionCoincideConFiltro(vencida, 'todas', ahora), false);
  assert.equal(promocionCoincideConFiltro(inactiva, 'todas', ahora), false);
});

test('calcula y redacta los días que faltan para el vencimiento', () => {
  const enDosDias = crearPromocion({ hasta: '2026-09-09T15:00:00-03:00' });
  const manana = crearPromocion({ hasta: '2026-09-08T15:00:00-03:00' });
  const hoy = crearPromocion({ hasta: '2026-09-07T20:00:00-03:00' });

  assert.equal(diasHastaVencimiento(enDosDias, ahora), 2);
  assert.equal(textoDiasHastaVencimiento(enDosDias, ahora), 'Quedan 2 días');
  assert.equal(textoDiasHastaVencimiento(manana, ahora), 'Queda 1 día');
  assert.equal(textoDiasHastaVencimiento(hoy, ahora), 'Vence hoy');
});

test('informa cuando la promoción ya está vencida', () => {
  const vencida = crearPromocion({ hasta: '2026-09-06T23:59:00-03:00' });
  assert.equal(textoDiasHastaVencimiento(vencida, ahora), 'Promoción vencida');
});
