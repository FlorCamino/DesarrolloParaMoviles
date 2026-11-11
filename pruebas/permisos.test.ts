import test from 'node:test';
import assert from 'node:assert/strict';
import { requiereSesion, requiereSocio } from '../src/utils/permisos.ts';

const vecino = { id:'usr-1', nombre:'Ana', email:'ana@example.com', rol:'vecino' as const, comercioId:null, favoritos:[], rubrosDeInteres:[], avisosActivos:false };
const socio = { ...vecino, id:'usr-2', rol:'comercio' as const, comercioId:'com-2' };
test('un visitante no puede guardar preferencias', () => {
  assert.throws(() => requiereSesion(null), /Iniciá sesión/);
});
test('un vecino puede usar funcionalidades autenticadas, pero no las del socio', () => {
  assert.equal(requiereSesion(vecino).id, 'usr-1');
  assert.throws(() => requiereSocio(vecino), /cuenta de comercio/);
});
test('sólo socios con comercio asociado administran el panel', () => {
  assert.equal(requiereSocio(socio), 'com-2');
  assert.throws(() => requiereSocio({ ...socio, comercioId:null }), /cuenta de comercio/);
});
