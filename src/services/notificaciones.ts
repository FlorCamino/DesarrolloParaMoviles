import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Almacenamiento from 'expo-sqlite/kv-store';
import type { PreferenciasPromociones, Promocion } from '@/types/promociones';

type ModuloNotificaciones = typeof import('expo-notifications');
type DisparadorNotificacion = import('expo-notifications').NotificationTriggerInput;

const CANAL_PROMOCIONES = 'promociones';
const PREFIJO_AVISO = 'promociones:aviso:';
const PREFIJO_CONOCIDAS = 'promociones:ids-conocidos:';
let moduloNotificaciones: ModuloNotificaciones | null | undefined;

function claveAviso(usuarioId: string, promocionId: string): string {
  return `${PREFIJO_AVISO}${encodeURIComponent(usuarioId)}:${encodeURIComponent(promocionId)}`;
}

function claveConocidas(usuarioId: string): string {
  return `${PREFIJO_CONOCIDAS}${encodeURIComponent(usuarioId)}`;
}

export function avisosRequierenBuildDesarrollo(): boolean {
  return Platform.OS === 'android' && Constants.expoGoConfig !== null;
}

async function obtenerModuloNotificaciones(): Promise<ModuloNotificaciones | null> {
  if (Platform.OS === 'web' || avisosRequierenBuildDesarrollo()) return null;
  if (moduloNotificaciones !== undefined) return moduloNotificaciones;

  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    moduloNotificaciones = Notifications;
  } catch (error) {
    console.warn('Las notificaciones no están disponibles en este entorno.', error);
    moduloNotificaciones = null;
  }
  return moduloNotificaciones;
}

export async function prepararNotificaciones(): Promise<boolean> {
  const Notifications = await obtenerModuloNotificaciones();
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_PROMOCIONES, {
      name: 'Promociones y vencimientos',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const permisoActual = await Notifications.getPermissionsAsync();
  if (permisoActual.granted) return true;
  const permisoSolicitado = await Notifications.requestPermissionsAsync();
  return permisoSolicitado.granted;
}

export async function cancelarAvisoVencimiento(usuarioId: string, promocionId: string): Promise<void> {
  const clave = claveAviso(usuarioId, promocionId);
  const identificador = await Almacenamiento.getItem(clave);
  const Notifications = await obtenerModuloNotificaciones();
  if (identificador && Notifications) {
    await Notifications.cancelScheduledNotificationAsync(identificador);
  }
  await Almacenamiento.removeItem(clave);
}

export async function programarAvisoVencimiento(
  usuarioId: string,
  promocion: Promocion,
): Promise<void> {
  await cancelarAvisoVencimiento(usuarioId, promocion.id);
  const permitido = await prepararNotificaciones();
  if (!permitido) return;
  const Notifications = await obtenerModuloNotificaciones();
  if (!Notifications) return;

  const fechaVencimiento = new Date(promocion.hasta);
  if (Number.isNaN(fechaVencimiento.getTime()) || fechaVencimiento.getTime() <= Date.now()) return;

  const unDiaAntes = new Date(fechaVencimiento.getTime() - 24 * 60 * 60 * 1000);
  const fechaReal = unDiaAntes.getTime() > Date.now()
    ? unDiaAntes
    : new Date(Date.now() + 10_000);

  const trigger: DisparadorNotificacion = __DEV__
    ? {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        repeats: false,
        channelId: CANAL_PROMOCIONES,
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fechaReal,
        channelId: CANAL_PROMOCIONES,
      };

  const identificador = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tu promoción está por vencer',
      body: `${promocion.titulo} finaliza pronto.`,
      data: { promocionId: promocion.id, usuarioId },
    },
    trigger,
  });
  await Almacenamiento.setItem(claveAviso(usuarioId, promocion.id), identificador);
}

export async function sincronizarAvisosVencimiento(
  usuarioId: string,
  promociones: Promocion[],
  promocionesGuardadas: string[],
  avisosActivos: boolean,
): Promise<void> {
  const guardadas = new Set(promocionesGuardadas);
  const vigentesGuardadas = avisosActivos
    ? promociones.filter((promo) => guardadas.has(promo.id) && new Date(promo.hasta).getTime() > Date.now())
    : [];

  const claves = await Almacenamiento.getAllKeys();
  const prefijoUsuario = `${PREFIJO_AVISO}${encodeURIComponent(usuarioId)}:`;
  const clavesUsuario = claves.filter((clave) => clave.startsWith(prefijoUsuario));
  const idsVigentes = new Set(vigentesGuardadas.map((promo) => promo.id));

  for (const clave of clavesUsuario) {
    const promocionId = decodeURIComponent(clave.slice(prefijoUsuario.length));
    if (!idsVigentes.has(promocionId)) {
      const identificador = await Almacenamiento.getItem(clave);
      const Notifications = await obtenerModuloNotificaciones();
      if (identificador && Notifications) {
        await Notifications.cancelScheduledNotificationAsync(identificador);
      }
      await Almacenamiento.removeItem(clave);
    }
  }

  if (!avisosActivos || vigentesGuardadas.length === 0) return;
  if (!(await prepararNotificaciones())) return;

  for (const promocion of vigentesGuardadas) {
    await programarAvisoVencimiento(usuarioId, promocion);
  }
}

export async function cancelarAvisosDelModulo(usuarioId: string): Promise<void> {
  const claves = await Almacenamiento.getAllKeys();
  const prefijoUsuario = `${PREFIJO_AVISO}${encodeURIComponent(usuarioId)}:`;
  const clavesUsuario = claves.filter((clave) => clave.startsWith(prefijoUsuario));
  const Notifications = await obtenerModuloNotificaciones();

  for (const clave of clavesUsuario) {
    const identificador = await Almacenamiento.getItem(clave);
    if (identificador && Notifications) {
      await Notifications.cancelScheduledNotificationAsync(identificador);
    }
    await Almacenamiento.removeItem(clave);
  }
}

export async function avisarPromocionesNuevasRelevantes(
  usuarioId: string,
  promociones: Promocion[],
  preferencias: PreferenciasPromociones,
  comercios: { id: string; rubroId: string }[],
): Promise<void> {
  const clave = claveConocidas(usuarioId);
  const anterior = await Almacenamiento.getItem(clave);
  const idsActuales = promociones.map((promocion) => promocion.id);
  await Almacenamiento.setItem(clave, JSON.stringify(idsActuales));

  if (!anterior || !preferencias.avisosActivos || Platform.OS === 'web') return;

  let idsConocidos: Set<string>;
  try {
    idsConocidos = new Set<string>(JSON.parse(anterior));
  } catch {
    return;
  }
  const nuevas = promociones.filter((promocion) => {
    if (idsConocidos.has(promocion.id)) return false;
    const comercio = comercios.find((item) => item.id === promocion.comercioId);
    return (
      preferencias.comerciosFavoritos.includes(promocion.comercioId) ||
      Boolean(comercio && preferencias.rubrosDeInteres.includes(comercio.rubroId))
    );
  });

  if (nuevas.length === 0 || !(await prepararNotificaciones())) return;
  const Notifications = await obtenerModuloNotificaciones();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: nuevas.length === 1 ? 'Nueva promoción para vos' : 'Nuevas promociones para vos',
      body: nuevas.length === 1 ? nuevas[0].titulo : `Hay ${nuevas.length} promociones según tus intereses.`,
      data: { seccion: 'promociones', usuarioId },
    },
    trigger: null,
  });
}
