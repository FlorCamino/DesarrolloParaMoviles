import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErrorHttp, solicitarJson } from '../src/services/http.ts';

test('envía Bearer y conserva datos y paginación', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string, opciones: RequestInit) => {
    assert.equal(url, 'http://localhost:3000/yo');
    assert.equal(new Headers(opciones.headers).get('Authorization'), 'Bearer prueba');
    return Response.json({ datos: { id: 'usr-1' }, meta: null });
  });
  assert.deepEqual(await solicitarJson('http://localhost:3000/', '/yo', {}, 'prueba'), {
    datos: { id: 'usr-1' }, meta: null,
  });
});

test('conserva el código y mensaje de un error HTTP', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Credenciales incorrectas.' },
  }, { status: 401 }));
  await assert.rejects(solicitarJson('http://localhost:3000', '/auth/ingreso'),
    (error: unknown) => error instanceof ErrorHttp && error.estado === 401 && error.codigo === 'CREDENCIALES_INVALIDAS');
});

test('informa fallos de red y respuestas inválidas', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(solicitarJson('http://localhost:3000', '/yo'),
    (error: unknown) => error instanceof ErrorHttp && error.codigo === 'SIN_CONEXION');
  mock.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ inesperado: true }));
  await assert.rejects(solicitarJson('http://localhost:3000', '/yo'),
    (error: unknown) => error instanceof ErrorHttp && error.codigo === 'RESPUESTA_INVALIDA');
});
