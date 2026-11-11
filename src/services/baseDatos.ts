import * as SQLite from "expo-sqlite";
import type { Comercio } from "../types/business";

export interface ResenaPendiente {
  id_local: string;
  comercio_id: string;
  usuario_id: string;
  estrellas: number;
  comentario: string;
  creada_en: string;
  estado: string;
  intentos: number;
  ultimo_error: string | null;
}

let promesaBaseDatos: Promise<SQLite.SQLiteDatabase> | null = null;
let operacionesPendientes: Promise<void> = Promise.resolve();

function encolarOperacion<T>(operacion: () => Promise<T>): Promise<T> {
  const resultado = operacionesPendientes.then(operacion);
  operacionesPendientes = resultado.then(() => undefined, () => undefined);
  return resultado;
}

async function obtenerBaseDatos() {
  if (!promesaBaseDatos) {
    promesaBaseDatos = inicializarBaseDatos().catch((error) => {
      promesaBaseDatos = null;
      throw error;
    });
  }

  return promesaBaseDatos;
}

async function inicializarBaseDatos() {
  const db = await SQLite.openDatabaseAsync("comercios.db");

  const columnas = await db.getAllAsync<{
    name: string;
    type: string;
  }>("PRAGMA table_info(comercios)");

  const columnaId = columnas.find((columna) => columna.name === "id");

  if (columnaId?.type.toUpperCase() === "INTEGER") {
    await db.execAsync("DROP TABLE comercios");
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS comercios (
      id TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      guardado_en TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS resenas_pendientes (
      id_local TEXT PRIMARY KEY NOT NULL,
      comercio_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      estrellas INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      creada_en TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      intentos INTEGER NOT NULL DEFAULT 0,
      ultimo_error TEXT
    );
  `);

  return db;
}

export async function guardarComercios(
  comercios: Comercio[],
): Promise<void> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();
    const fechaGuardado = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM comercios");

      for (const comercio of comercios) {
        await db.runAsync(
          `INSERT INTO comercios (id, datos, guardado_en)
           VALUES (?, ?, ?)`,
          comercio.id,
          JSON.stringify(comercio),
          fechaGuardado,
        );
      }
    });
  });
}

export async function leerComerciosGuardados(): Promise<Comercio[]> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    const filas = await db.getAllAsync<{
      datos: string;
    }>("SELECT datos FROM comercios ORDER BY id");

    return filas.map((fila) => JSON.parse(fila.datos) as Comercio);
  });
}

export async function obtenerFechaGuardado(): Promise<string | null> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    const fila = await db.getFirstAsync<{
      guardado_en: string | null;
    }>(
      "SELECT MAX(guardado_en) AS guardado_en FROM comercios",
    );

    return fila?.guardado_en ?? null;
  });
}

export async function guardarResenaPendiente(
  resena: Pick<
    ResenaPendiente,
    | "id_local"
    | "comercio_id"
    | "usuario_id"
    | "estrellas"
    | "comentario"
    | "creada_en"
  >,
): Promise<void> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    const resultado = await db.runAsync(
      `INSERT OR IGNORE INTO resenas_pendientes (
        id_local,
        comercio_id,
        usuario_id,
        estrellas,
        comentario,
        creada_en
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      resena.id_local,
      resena.comercio_id,
      resena.usuario_id,
      resena.estrellas,
      resena.comentario,
      resena.creada_en,
    );

    if (resultado.changes === 0) {
      throw new Error("La reseña ya existe en la cola de pendientes.");
    }
  });
}

export async function actualizarResenaPendiente(
  idLocal: string,
  estrellas: number,
  comentario: string,
): Promise<void> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    const resultado = await db.runAsync(
      `UPDATE resenas_pendientes
       SET estrellas = ?,
           comentario = ?,
           estado = 'pendiente',
           intentos = 0,
           ultimo_error = NULL
       WHERE id_local = ?`,
      estrellas,
      comentario,
      idLocal,
    );

    if (resultado.changes === 0) {
      throw new Error('No se encontró la reseña pendiente.');
    }
  });
}

export async function obtenerResenasPendientes(
  usuarioId: string,
): Promise<ResenaPendiente[]> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    return db.getAllAsync<ResenaPendiente>(
      `SELECT *
       FROM resenas_pendientes
       WHERE usuario_id = ?
       ORDER BY creada_en ASC`,
      usuarioId,
    );
  });
}

export async function obtenerResenasParaSincronizar(
  usuarioId: string,
): Promise<ResenaPendiente[]> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    return db.getAllAsync<ResenaPendiente>(
      `SELECT *
       FROM resenas_pendientes
       WHERE usuario_id = ?
       AND estado = 'pendiente'
       ORDER BY creada_en ASC`,
      usuarioId,
    );
  });
}

export async function registrarErrorResenaPendiente(
  idLocal: string,
  mensaje: string,
  estado: 'pendiente' | 'error',
): Promise<void> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    await db.runAsync(
      `UPDATE resenas_pendientes
       SET intentos = intentos + 1,
           ultimo_error = ?,
           estado = ?
       WHERE id_local = ?`,
      mensaje,
      estado,
      idLocal,
    );
  });
}

export async function eliminarResenaPendiente(
  idLocal: string,
): Promise<void> {
  return encolarOperacion(async () => {
    const db = await obtenerBaseDatos();

    await db.runAsync(
      `DELETE FROM resenas_pendientes
       WHERE id_local = ?`,
      idLocal,
    );
  });
}
