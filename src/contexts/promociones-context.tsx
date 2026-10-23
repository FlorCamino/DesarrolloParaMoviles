import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useAuth } from '@/hooks/use-auth';
import {
  CachePromociones,
  ComercioResumen,
  ModoDemo,
  PreferenciasPromociones,
  Promocion,
  Rubro,
} from '@/types/promociones';
import {
  listarComerciosResumen,
  listarPromociones,
  listarRubros,
} from '@/services/promociones';
import {
  guardarCachePromociones,
  guardarPreferencias,
  leerCachePromociones,
  leerPreferencias,
} from '@/services/persistencia-promociones';
import {
  avisarPromocionesNuevasRelevantes,
  cancelarAvisoVencimiento,
  cancelarAvisosDelModulo,
  prepararNotificaciones,
  programarAvisoVencimiento,
} from '@/services/notificaciones';

interface ValorContexto {
  promociones: Promocion[];
  rubros: Rubro[];
  comercios: ComercioResumen[];
  preferencias: PreferenciasPromociones;
  cargando: boolean;
  error: string | null;
  sinConexion: boolean;
  origenCache: boolean;
  actualizadoEn: string | null;
  cargar: (modo?: ModoDemo) => Promise<void>;
  alternarPromocionGuardada: (promocion: Promocion) => Promise<void>;
  alternarComercioFavorito: (comercioId: string) => Promise<void>;
  alternarRubroInteres: (rubroId: string) => Promise<void>;
  cambiarAvisosActivos: (activo: boolean) => Promise<boolean>;
}

const preferenciasVacias: PreferenciasPromociones = {
  promocionesGuardadas: [],
  comerciosFavoritos: [],
  rubrosDeInteres: [],
  avisosActivos: false,
};

const ContextoPromociones = createContext<ValorContexto | null>(null);

export function PromocionesProvider({ children }: PropsWithChildren) {
  const { usuario } = useAuth();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [comercios, setComercios] = useState<ComercioResumen[]>([]);
  const [preferencias, setPreferencias] = useState(preferenciasVacias);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [origenCache, setOrigenCache] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState<string | null>(null);

  async function cargar(modo: ModoDemo = 'normal') {
    setCargando(true);
    setError(null);

    try {
      const [preferenciasLocales, rubrosDisponibles, comerciosDisponibles, red] =
        await Promise.all([
          leerPreferencias({
            comerciosFavoritos: usuario?.favoritos ?? [],
            rubrosDeInteres: usuario?.rubrosDeInteres ?? [],
            avisosActivos: usuario?.avisosActivos ?? false,
          }),
          listarRubros(),
          listarComerciosResumen(),
          Network.getNetworkStateAsync(),
        ]);

      setPreferencias(preferenciasLocales);
      setRubros(rubrosDisponibles);
      setComercios(comerciosDisponibles);

      const desconectado = red.isConnected === false || red.isInternetReachable === false;
      setSinConexion(desconectado);

      if (desconectado) {
        const cache = await leerCachePromociones();
        setPromociones(cache?.datos ?? []);
        setActualizadoEn(cache?.actualizadoEn ?? null);
        setOrigenCache(Boolean(cache));
        if (!cache) setError('No hay conexión ni promociones guardadas en este dispositivo.');
        return;
      }

      const respuesta = await listarPromociones(modo);
      const cache: CachePromociones = {
        datos: respuesta.datos,
        actualizadoEn: new Date().toISOString(),
      };

      setPromociones(respuesta.datos);
      setActualizadoEn(cache.actualizadoEn);
      setOrigenCache(false);
      await guardarCachePromociones(cache);
      await avisarPromocionesNuevasRelevantes(respuesta.datos, preferenciasLocales);
    } catch (e) {
      // Los modos de prueba deben exhibir el error, no esconderlo con la caché.
      if (modo !== 'normal') {
        setPromociones([]);
        setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
        return;
      }

      const cache = await leerCachePromociones();
      if (cache) {
        setPromociones(cache.datos);
        setActualizadoEn(cache.actualizadoEn);
        setOrigenCache(true);
        setError('No se pudo actualizar. Se muestran los últimos datos guardados.');
      } else {
        setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(() => void cargar(), 0);
    return () => clearTimeout(temporizador);
    // cargar depende de todo el estado del módulo; aquí sólo reiniciamos al cambiar de usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  async function persistir(nuevas: PreferenciasPromociones) {
    setPreferencias(nuevas);
    await guardarPreferencias(nuevas);
  }

  async function alternarPromocionGuardada(promocion: Promocion) {
    const yaGuardada = preferencias.promocionesGuardadas.includes(promocion.id);
    const promocionesGuardadas = yaGuardada
      ? preferencias.promocionesGuardadas.filter((id) => id !== promocion.id)
      : [...preferencias.promocionesGuardadas, promocion.id];

    await persistir({ ...preferencias, promocionesGuardadas });
    await Haptics.selectionAsync();

    if (yaGuardada) {
      await cancelarAvisoVencimiento(promocion.id);
    } else if (preferencias.avisosActivos) {
      await programarAvisoVencimiento(promocion);
    }
  }

  async function alternarComercioFavorito(comercioId: string) {
    const existe = preferencias.comerciosFavoritos.includes(comercioId);
    const comerciosFavoritos = existe
      ? preferencias.comerciosFavoritos.filter((id) => id !== comercioId)
      : [...preferencias.comerciosFavoritos, comercioId];
    await persistir({ ...preferencias, comerciosFavoritos });
    await Haptics.selectionAsync();
  }

  async function alternarRubroInteres(rubroId: string) {
    const existe = preferencias.rubrosDeInteres.includes(rubroId);
    const rubrosDeInteres = existe
      ? preferencias.rubrosDeInteres.filter((id) => id !== rubroId)
      : [...preferencias.rubrosDeInteres, rubroId];
    await persistir({ ...preferencias, rubrosDeInteres });
  }

  async function cambiarAvisosActivos(activo: boolean): Promise<boolean> {
    if (activo) {
      const permitido = await prepararNotificaciones();
      if (!permitido) return false;
    } else {
      await cancelarAvisosDelModulo();
    }

    await persistir({ ...preferencias, avisosActivos: activo });
    return true;
  }

  const valor: ValorContexto = {
    promociones,
    rubros,
    comercios,
    preferencias,
    cargando,
    error,
    sinConexion,
    origenCache,
    actualizadoEn,
    cargar,
    alternarPromocionGuardada,
    alternarComercioFavorito,
    alternarRubroInteres,
    cambiarAvisosActivos,
  };

  return <ContextoPromociones.Provider value={valor}>{children}</ContextoPromociones.Provider>;
}

export function usePromociones(): ValorContexto {
  const contexto = useContext(ContextoPromociones);
  if (!contexto) {
    throw new Error('usePromociones debe usarse dentro de PromocionesProvider.');
  }
  return contexto;
}
