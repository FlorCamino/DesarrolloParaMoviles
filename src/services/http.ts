export interface SobreApi<T> {
  datos: T;
  meta: { total: number; pagina: number; porPagina: number } | null;
}

export class ErrorHttp extends Error {
  readonly codigo: string;
  readonly estado: number;

  constructor(codigo: string, mensaje: string, estado: number) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.codigo = codigo;
    this.estado = estado;
  }
}

export async function solicitarJson<T>(
  base: string,
  ruta: string,
  opciones: RequestInit = {},
  token?: string,
): Promise<SobreApi<T>> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 15000);
  const cancelar = () => control.abort();
  opciones.signal?.addEventListener('abort', cancelar, { once: true });
  if (opciones.signal?.aborted) control.abort();
  try {
    const headers = new Headers(opciones.headers);
    headers.set('Accept', 'application/json');
    if (typeof opciones.body === 'string') headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const respuesta = await fetch(`${base.replace(/\/$/, '')}/${ruta.replace(/^\//, '')}`, {
      ...opciones, headers, signal: control.signal,
    });
    if (respuesta.status === 204) return { datos: undefined as T, meta: null };
    const cuerpo = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      throw new ErrorHttp(
        cuerpo?.error?.codigo ?? 'ERROR_HTTP',
        cuerpo?.error?.mensaje ?? `No se pudo completar la solicitud (${respuesta.status}).`,
        respuesta.status,
      );
    }
    if (!cuerpo || typeof cuerpo !== 'object' || !('datos' in cuerpo)) {
      throw new ErrorHttp('RESPUESTA_INVALIDA', 'La API devolvió una respuesta inesperada.', respuesta.status);
    }
    return cuerpo as SobreApi<T>;
  } catch (error) {
    if (error instanceof ErrorHttp) throw error;
    throw new ErrorHttp(
      control.signal.aborted ? 'SOLICITUD_CANCELADA' : 'SIN_CONEXION',
      control.signal.aborted ? 'La solicitud se canceló o tardó demasiado. Intentá nuevamente.' : 'No pudimos conectar con el servidor. Revisá la conexión e intentá nuevamente.',
      0,
    );
  } finally {
    clearTimeout(temporizador);
    opciones.signal?.removeEventListener('abort', cancelar);
  }
}
