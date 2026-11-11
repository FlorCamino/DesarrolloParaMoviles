import type { Resena } from '@/types/business';
import { solicitarApi } from './api';
import { json, listarTodo, tokenObligatorio } from './api-listas';
import {
  actualizarResenaPendiente,
  eliminarResenaPendiente,
  guardarResenaPendiente,
  obtenerResenasParaSincronizar,
  obtenerResenasPendientes,
  registrarErrorResenaPendiente,
} from './baseDatos';
import { ErrorHttp } from './http';
import { obtenerSesion } from './session-storage';

type ResenaApi = Omit<Resena, 'usuarioNombre'>;
const adaptar = (r: ResenaApi): Resena => ({ ...r, usuarioNombre: `Usuario ${r.usuarioId}` });

export function generarIdResena(): string {
  const fecha = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 10);

  return `res-${fecha}-${aleatorio}`;
}

export async function obtenerResenasPorComercio(
  comercioId: string,
): Promise<Resena[]> {
  const sesion = await obtenerSesion();

  const pendientes = sesion
    ? await obtenerResenasPendientes(sesion.usuario.id)
    : [];

  const pendientesDelComercio: Resena[] = pendientes
    .filter((resena) => resena.comercio_id === comercioId)
    .map((resena) => ({
      id: resena.id_local,
      comercioId: resena.comercio_id,
      usuarioId: resena.usuario_id,
      usuarioNombre: sesion!.usuario.nombre,
      estrellas: resena.estrellas,
      comentario: resena.comentario,
      respuesta: null,
      reportada: false,
      creadaEn: resena.creada_en,
      sincronizada: false,
      estadoSincronizacion: resena.estado === 'error'
        ? 'error'
        : 'pendiente',
    }));

  try {
    const datos = await listarTodo<ResenaApi>(
      `/comercios/${encodeURIComponent(comercioId)}/resenas`,
    );

    const sincronizadas = datos.map(adaptar);

    return [
      ...sincronizadas,
      ...pendientesDelComercio.filter(
        (pendiente) =>
          !sincronizadas.some((resena) => resena.id === pendiente.id),
      ),
    ].sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
  } catch (error) {
    if (
      error instanceof ErrorHttp &&
      (error.estado === 0 || error.estado >= 500)
    ) {
      if (pendientesDelComercio.length > 0) {
        return pendientesDelComercio.sort(
          (a, b) => b.creadaEn.localeCompare(a.creadaEn),
        );
      }
    }

    throw error;
  }
}

export async function crearResena(
  comercioId: string,
  estrellas: number,
  comentario: string,
): Promise<Resena> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    throw new Error('Iniciá sesión para dejar una reseña.');
  }

  const id = generarIdResena();
  const creadaEn = new Date().toISOString();
  const comentarioLimpio = comentario.trim();

  const resenaLocal: Resena = {
    id,
    comercioId,
    usuarioId: sesion.usuario.id,
    usuarioNombre: sesion.usuario.nombre,
    estrellas,
    comentario: comentarioLimpio,
    respuesta: null,
    reportada: false,
    creadaEn,
    sincronizada: false,
    estadoSincronizacion: 'pendiente',
  };

  await guardarResenaPendiente({
    id_local: id,
    comercio_id: comercioId,
    usuario_id: sesion.usuario.id,
    estrellas,
    comentario: comentarioLimpio,
    creada_en: creadaEn,
  });

  try {
    const r = await solicitarApi<ResenaApi>(
      `/comercios/${encodeURIComponent(comercioId)}/resenas`,
      json('POST', {
        id,
        estrellas,
        comentario: comentarioLimpio,
        creadaEn,
      }),
      sesion.token,
    );

    await eliminarResenaPendiente(id);

    return adaptar(r.datos);
  } catch (error) {
    if (error instanceof ErrorHttp) {
      const errorTemporal =
        error.estado === 0 ||
        error.estado >= 500 ||
        error.estado === 401 ||
        error.estado === 403;

      await registrarErrorResenaPendiente(
        id,
        error.message,
        errorTemporal ? 'pendiente' : 'error',
      );

      if (errorTemporal) {
        return resenaLocal;
      }
    }

    throw error;
  }
}

export async function sincronizarResenasPendientes(): Promise<void> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return;
  }

  const pendientes = await obtenerResenasParaSincronizar(
    sesion.usuario.id,
  );

  for (const resena of pendientes) {
    try {
      await solicitarApi<ResenaApi>(
        `/comercios/${encodeURIComponent(resena.comercio_id)}/resenas`,
        json('POST', {
          id: resena.id_local,
          estrellas: resena.estrellas,
          comentario: resena.comentario,
          creadaEn: resena.creada_en,
        }),
        sesion.token,
      );

      await eliminarResenaPendiente(resena.id_local);
    } catch (error) {
      if (error instanceof ErrorHttp) {
        const errorTemporal =
          error.estado === 0 ||
          error.estado >= 500 ||
          error.estado === 401 ||
          error.estado === 403;

        await registrarErrorResenaPendiente(
          resena.id_local,
          error.message,
          errorTemporal ? 'pendiente' : 'error',
        );

        if (errorTemporal) {
          break;
        }

        if (error.estado === 401 || error.estado === 403) {
          break;
        }

      } else {
        await registrarErrorResenaPendiente(
          resena.id_local,
          error instanceof Error
            ? error.message
            : 'Error desconocido',
          'pendiente',
        );

        break;
      }
    }
  }
}

export async function editarResena(
  id: string,
  estrellas: number,
  comentario: string,
): Promise<Resena> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    throw new Error('Iniciá sesión para editar tu reseña.');
  }

  const pendientes = await obtenerResenasPendientes(sesion.usuario.id);
  const pendiente = pendientes.find((resena) => resena.id_local === id);
  const comentarioLimpio = comentario.trim();

  if (pendiente) {
    await actualizarResenaPendiente(
      id,
      estrellas,
      comentarioLimpio,
    );

    return {
      id,
      comercioId: pendiente.comercio_id,
      usuarioId: pendiente.usuario_id,
      usuarioNombre: sesion.usuario.nombre,
      estrellas,
      comentario: comentarioLimpio,
      respuesta: null,
      reportada: false,
      creadaEn: pendiente.creada_en,
      sincronizada: false,
      estadoSincronizacion: 'pendiente',
    };
  }

  const r = await solicitarApi<ResenaApi>(
    `/resenas/${encodeURIComponent(id)}`,
    json('PATCH', { estrellas, comentario: comentarioLimpio }),
    sesion.token,
  );

  return adaptar(r.datos);
}

export async function borrarResena(id: string): Promise<void> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    throw new Error('Iniciá sesión para eliminar tu reseña.');
  }

  const pendientes = await obtenerResenasPendientes(sesion.usuario.id);
  const pendiente = pendientes.find((resena) => resena.id_local === id);

  if (pendiente) {
    await eliminarResenaPendiente(id);
    return;
  }

  await solicitarApi<void>(
    `/resenas/${encodeURIComponent(id)}`,
    json('DELETE'),
    sesion.token,
  );
}

export async function reportarResena(id: string): Promise<Resena> {
  const r = await solicitarApi<ResenaApi>(`/resenas/${encodeURIComponent(id)}/reportes`, json('POST'), await tokenObligatorio());
  return adaptar(r.datos);
}
