import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Almacenamiento from 'expo-sqlite/kv-store';
import { PreferenciasPromociones, Promocion } from '@/types/promociones';
import { COMERCIOS_MOCK } from '@/mocks/promociones';

type ModuloNotificaciones = typeof import('expo-notifications');
type DisparadorNotificacion = import('expo-notifications').NotificationTriggerInput;

const CANAL_PROMOCIONES = 'promociones';
const PREFIJO_AVISO = 'promociones:aviso:';
const CLAVE_CONOCIDAS = 'promociones:ids-conocidos:v1';
let moduloNotificaciones: ModuloNotificaciones | null | undefined;

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

export async function programarAvisoVencimiento(promocion: Promocion): Promise<void> {
  const permitido = await prepararNotificaciones();
  if (!permitido) return;
  const Notifications = await obtenerModuloNotificaciones();
  if (!Notifications) return;

  const fechaVencimiento = new Date(promocion.hasta);
  const unDiaAntes = new Date(fechaVencimiento.getTime() - 24 * 60 * 60 * 1000);
  const fechaReal = unDiaAntes.getTime() > Date.now()
    ? unDiaAntes
    : new Date(Date.now() + 10_000);

  // En desarrollo se dispara a los 10 segundos para poder demostrarla en clase.
  // En el APK release se agenda un día antes del vencimiento.
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
      data: { promocionId: promocion.id },
    },
    trigger,
  });

  await Almacenamiento.setItem(`${PREFIJO_AVISO}${promocion.id}`, identificador);
}

export async function cancelarAvisoVencimiento(promocionId: string): Promise<void> {
  const clave = `${PREFIJO_AVISO}${promocionId}`;
  const identificador = await Almacenamiento.getItem(clave);
  const Notifications = await obtenerModuloNotificaciones();
  if (identificador && Notifications) {
    await Notifications.cancelScheduledNotificationAsync(identificador);
  }
  await Almacenamiento.removeItem(clave);
}

export async function cancelarAvisosDelModulo(): Promise<void> {
  const claves = await Almacenamiento.getAllKeys();
  const clavesDeAvisos = claves.filter((clave) => clave.startsWith(PREFIJO_AVISO));
  const Notifications = await obtenerModuloNotificaciones();

  for (const clave of clavesDeAvisos) {
    const identificador = await Almacenamiento.getItem(clave);
    if (identificador && Notifications) {
      await Notifications.cancelScheduledNotificationAsync(identificador);
    }
    await Almacenamiento.removeItem(clave);
  }
}

export async function avisarPromocionesNuevasRelevantes(
  promociones: Promocion[],
  preferencias: PreferenciasPromociones,
): Promise<void> {
  const anterior = await Almacenamiento.getItem(CLAVE_CONOCIDAS);
  const idsActuales = promociones.map((promocion) => promocion.id);
  await Almacenamiento.setItem(CLAVE_CONOCIDAS, JSON.stringify(idsActuales));

  // La primera sincronización establece la base: no genera avisos viejos.
  if (!anterior || !preferencias.avisosActivos || Platform.OS === 'web') return;

  const idsConocidos = new Set<string>(JSON.parse(anterior));
  const nuevas = promociones.filter((promocion) => {
    if (idsConocidos.has(promocion.id)) return false;
    const comercio = COMERCIOS_MOCK.find((item) => item.id === promocion.comercioId);
    if (!comercio) return false;
    return (
      preferencias.comerciosFavoritos.includes(comercio.id) ||
      preferencias.rubrosDeInteres.includes(comercio.rubroId)
    );
  });

  if (nuevas.length === 0 || !(await prepararNotificaciones())) return;
  const Notifications = await obtenerModuloNotificaciones();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: nuevas.length === 1 ? 'Nueva promoción para vos' : 'Nuevas promociones para vos',
      body: nuevas.length === 1 ? nuevas[0].titulo : `Hay ${nuevas.length} promociones según tus intereses.`,
      data: { seccion: 'promociones' },
    },
    trigger: null,
  });
}
