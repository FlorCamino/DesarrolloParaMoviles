export interface Rubro {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  orden: number;
}

export interface ComercioResumen {
  id: string;
  nombre: string;
  rubroId: string;
  direccion: string;
}

export interface Promocion {
  id: string;
  comercioId: string;
  titulo: string;
  detalle: string;
  descuento: number | null;
  desde: string;
  hasta: string;
  imagenUrl: string | null;
  soloApp: boolean;
  usos: number;
  activa: boolean;
}

export interface UsoDePromocion {
  id: string;
  promocionId: string;
  usuarioId: string;
  codigo: string;
  validadoEn: string | null;
}

export interface RespuestaApi<T> {
  datos: T;
  meta?: {
    total: number;
    pagina: number;
    porPagina: number;
  };
}

export type EstadoPromocion = 'vigente' | 'proxima' | 'porVencer' | 'vencida';
export type FiltroEstado = 'todas' | 'vigentes' | 'proximas' | 'porVencer';
export type ModoDemo = 'normal' | 'vacio' | 'error';

export interface PreferenciasPromociones {
  promocionesGuardadas: string[];
  comerciosFavoritos: string[];
  rubrosDeInteres: string[];
  avisosActivos: boolean;
}

export interface CachePromociones {
  datos: Promocion[];
  actualizadoEn: string;
}
