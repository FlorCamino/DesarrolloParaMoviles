
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useAuth } from '@/hooks/use-auth';
import { solicitarApi } from '@/services/api';
import { json, tokenObligatorio } from '@/services/api-listas';
import type { Usuario } from '@/types/usuario';
import { requiereSesion } from '@/utils/permisos';
import type {
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
  sincronizarAvisosVencimiento,
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
      const red = await Network.getNetworkStateAsync();
      const desconectado =
        red.isConnected === false || red.isInternetReachable === false;

      setSinConexion(desconectado);

      let preferenciasLocales = usuario
        ? await leerPreferencias(usuario.id, {
            comerciosFavoritos: usuario.favoritos ?? [],
            rubrosDeInteres: usuario.rubrosDeInteres ?? [],
            avisosActivos: usuario.avisosActivos ?? false,
          })
        : preferenciasVacias;

      if (usuario && !desconectado) {
        try {
          const remoto = (
            await solicitarApi<Usuario>(
              '/yo',
              {},
              await tokenObligatorio(),
            )
          ).datos;

          preferenciasLocales = {
            ...preferenciasLocales,
            comerciosFavoritos: remoto.favoritos,
            rubrosDeInteres: remoto.rubrosDeInteres,
            avisosActivos: remoto.avisosActivos,
          };

          await guardarPreferencias(usuario.id, preferenciasLocales);
        } catch (e) {
          if (__DEV__) {
            console.warn('No se pudo actualizar la cuenta:', e);
          }
        }
      }

      setPreferencias(preferenciasLocales);

      let comerciosActualizados: ComercioResumen[] = [];

      if (!desconectado) {
        const [rubrosDisponibles, comerciosDisponibles] =
          await Promise.all([
            listarRubros(),
            listarComerciosResumen(),
          ]);

        setRubros(rubrosDisponibles);
        setComercios(comerciosDisponibles);
        comerciosActualizados = comerciosDisponibles;
      }

      if (desconectado) {
        const cache = await leerCachePromociones();

        setPromociones(cache?.datos ?? []);
        setActualizadoEn(cache?.actualizadoEn ?? null);
        setOrigenCache(Boolean(cache));

        if (!cache) {
          setError(
            'No hay conexión ni promociones guardadas en este dispositivo.',
          );
        }

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

      if (usuario) {
        try {
          await avisarPromocionesNuevasRelevantes(
            usuario.id,
            respuesta.datos,
            preferenciasLocales,
            comerciosActualizados,
          );

          await sincronizarAvisosVencimiento(
            usuario.id,
            respuesta.datos,
            preferenciasLocales.promocionesGuardadas,
            preferenciasLocales.avisosActivos,
          );
        } catch (errorNotificaciones) {
          if (__DEV__) {
            console.warn(
              'No se pudieron sincronizar los avisos:',
              errorNotificaciones,
            );
          }
        }
      }
    } catch (e) {
      if (modo !== 'normal') {
        setPromociones([]);
        setError(
          e instanceof Error
            ? e.message
            : 'Ocurrió un error inesperado.',
        );
        return;
      }

      const cache = await leerCachePromociones();

      if (cache) {
        setPromociones(cache.datos);
        setActualizadoEn(cache.actualizadoEn);
        setOrigenCache(true);
        setError(
          'No se pudo actualizar. Se muestran los últimos datos guardados.',
        );
      } else {
        setError(
          e instanceof Error
            ? e.message
            : 'Ocurrió un error inesperado.',
        );
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setPreferencias(preferenciasVacias);
      setPromociones([]);
      void cargar();
    }, 0);

    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  async function persistir(nuevas: PreferenciasPromociones) {
    const actual = requiereSesion(usuario);

    await guardarPreferencias(actual.id, nuevas);
    setPreferencias(nuevas);
  }

  async function alternarPromocionGuardada(promocion: Promocion) {
    const actual = requiereSesion(usuario);

    const yaGuardada = preferencias.promocionesGuardadas.includes(
      promocion.id,
    );

    const promocionesGuardadas = yaGuardada
      ? preferencias.promocionesGuardadas.filter(
          (id) => id !== promocion.id,
        )
      : [...preferencias.promocionesGuardadas, promocion.id];

    await persistir({
      ...preferencias,
      promocionesGuardadas,
    });

    await Haptics.selectionAsync();

    try {
      if (yaGuardada) {
        await cancelarAvisoVencimiento(actual.id, promocion.id);
      } else if (preferencias.avisosActivos) {
        await programarAvisoVencimiento(actual.id, promocion);
      }
    } catch (errorNotificaciones) {
      if (__DEV__) {
        console.warn(
          'No se pudo actualizar el aviso de la promoción:',
          errorNotificaciones,
        );
      }
    }
  }

  async function alternarComercioFavorito(comercioId: string) {
    requiereSesion(usuario);

    const existe = preferencias.comerciosFavoritos.includes(comercioId);

    const comerciosFavoritos = existe
      ? preferencias.comerciosFavoritos.filter(
          (id) => id !== comercioId,
        )
      : [...preferencias.comerciosFavoritos, comercioId];

    const token = await tokenObligatorio();
    const ruta = `/yo/favoritos/${encodeURIComponent(comercioId)}`;

    if (existe) {
      await solicitarApi<void>(ruta, json('DELETE'), token);

      await persistir({
        ...preferencias,
        comerciosFavoritos,
      });
    } else {
      const { datos: actualizado } = await solicitarApi<Usuario>(
        ruta,
        json('PUT'),
        token,
      );

      await persistir({
        ...preferencias,
        comerciosFavoritos: actualizado.favoritos,
      });
    }

    await Haptics.selectionAsync();
  }

  async function alternarRubroInteres(rubroId: string) {
    requiereSesion(usuario);

    const existe = preferencias.rubrosDeInteres.includes(rubroId);

    const rubrosDeInteres = existe
      ? preferencias.rubrosDeInteres.filter(
          (id) => id !== rubroId,
        )
      : [...preferencias.rubrosDeInteres, rubroId];

    const actualizado = (
      await solicitarApi<Usuario>(
        '/yo',
        json('PATCH', { rubrosDeInteres }),
        await tokenObligatorio(),
      )
    ).datos;

    await persistir({
      ...preferencias,
      rubrosDeInteres: actualizado.rubrosDeInteres,
    });
  }

  async function cambiarAvisosActivos(
    activo: boolean,
  ): Promise<boolean> {
    const actual = requiereSesion(usuario);

    if (activo) {
      const permitido = await prepararNotificaciones();

      if (!permitido) {
        return false;
      }
    }

    const actualizado = (
      await solicitarApi<Usuario>(
        '/yo',
        json('PATCH', { avisosActivos: activo }),
        await tokenObligatorio(),
      )
    ).datos;

    const nuevasPreferencias = {
      ...preferencias,
      avisosActivos: actualizado.avisosActivos,
    };

    await persistir(nuevasPreferencias);

    try {
      if (actualizado.avisosActivos) {
        await sincronizarAvisosVencimiento(
          actual.id,
          promociones,
          nuevasPreferencias.promocionesGuardadas,
          true,
        );
      } else {
        await cancelarAvisosDelModulo(actual.id);
      }
    } catch (errorNotificaciones) {
      if (__DEV__) {
        console.warn(
          'No se pudieron actualizar los avisos programados:',
          errorNotificaciones,
        );
      }
    }

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

  return (
    <ContextoPromociones.Provider value={valor}>
      {children}
    </ContextoPromociones.Provider>
  );
}

export function usePromociones(): ValorContexto {
  const contexto = useContext(ContextoPromociones);

  if (!contexto) {
    throw new Error(
      'usePromociones debe usarse dentro de PromocionesProvider.',
    );
  }

  return contexto;
}
