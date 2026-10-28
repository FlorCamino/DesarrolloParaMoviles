import * as SQLite from "expo-sqlite";
import type { Comercio } from "../types/business";

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
