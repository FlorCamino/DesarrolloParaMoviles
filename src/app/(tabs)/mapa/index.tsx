import MapaComercios from "@/components/mapa-comercios";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { obtenerFechaGuardado } from "@/services/baseDatos";
import { obtenerComercios } from "@/services/comercios";
import type { Comercio } from "@/types/business";

const RUBROS = [
  { id: "Todos", nombre: "Todos" },
  { id: "rub-gastronomia", nombre: "Gastronomía" },
  { id: "rub-indumentaria", nombre: "Indumentaria" },
  { id: "rub-hogar", nombre: "Hogar" },
  {
    id: "rub-ferreteria",
    nombre: "Ferretería y construcción",
  },
  { id: "rub-salud", nombre: "Salud y farmacia" },
  { id: "rub-servicios", nombre: "Servicios" },
  { id: "rub-tecnologia", nombre: "Tecnología" },
  { id: "rub-libreria", nombre: "Librería" },
  { id: "rub-otros", nombre: "Otros" },
];

export default function MapaScreen() {
  const router = useRouter();

  const [coordenadas, setCoordenadas] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [cargandoComercios, setCargandoComercios] = useState(true);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [hayInternet, setHayInternet] = useState<boolean | null>(null);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState("Todos");
  const [mensaje, setMensaje] = useState(
    "Explorá los comercios de la ciudad.",
  );
  const [fechaDatos, setFechaDatos] = useState<string | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  const datosDesactualizados = fechaDatos
    ? ahora - new Date(fechaDatos).getTime() > 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    async function comprobarConexion() {
      try {
        const estado = await Network.getNetworkStateAsync();

        setHayInternet(
          estado.isConnected === true &&
            estado.isInternetReachable !== false,
        );
      } catch {
        setHayInternet(null);
      }
    }

    void comprobarConexion();

    const suscripcion = Network.addNetworkStateListener((estado) => {
      setHayInternet(
        estado.isConnected === true &&
          estado.isInternetReachable !== false,
      );
    });

    return () => suscripcion.remove();
  }, []);

  useEffect(() => {
    let vigente = true;

    async function cargarComercios() {
      try {
        const datos = await obtenerComercios();
        const fecha = await obtenerFechaGuardado();

        if (vigente) {
          setComercios(datos);
          setFechaDatos(fecha);
        }
      } catch {
        if (vigente) {
          setMensaje("No pudimos cargar los comercios guardados.");
        }
      } finally {
        if (vigente) {
          setCargandoComercios(false);
        }
      }
    }

    void cargarComercios();

    return () => {
      vigente = false;
    };
  }, []);

  async function obtenerUbicacion() {
    setBuscandoUbicacion(true);

    try {
      const permiso = await Location.requestForegroundPermissionsAsync();

      if (!permiso.granted) {
        setCoordenadas(null);
        setMensaje(
          "Podés explorar los comercios sin compartir tu ubicación.",
        );
        return;
      }

      const ubicacion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordenadas({
        latitude: ubicacion.coords.latitude,
        longitude: ubicacion.coords.longitude,
      });

      setMensaje("Tu ubicación se actualizó correctamente.");
    } catch {
      setMensaje(
        "No pudimos obtener tu ubicación. Podés seguir explorando.",
      );
    } finally {
      setBuscandoUbicacion(false);
    }
  }

  const comerciosFiltrados = useMemo(() => {
    if (rubroSeleccionado === "Todos") {
      return comercios;
    }

    return comercios.filter(
      (comercio) => comercio.rubroId === rubroSeleccionado,
    );
  }, [comercios, rubroSeleccionado]);

  function abrirFichaComercio(comercio: Comercio) {
    router.push({
      pathname: "/comercio/[id]",
      params: { id: comercio.id },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.encabezado}>
        <View style={styles.filaEncabezado}>
          <View style={styles.iconoMarca}>
            <Text style={styles.iconoTexto}>⌖</Text>
          </View>

          <View style={styles.titulos}>
            <Text style={styles.ciudad}>
              CONCEPCIÓN DEL URUGUAY
            </Text>

            <Text style={styles.titulo}>
              Encontrá lo que buscás
            </Text>
          </View>
        </View>

        <Text style={styles.subtitulo}>
          Explorá los comercios de la ciudad.
        </Text>

        <View style={styles.estadoConexion}>
          <View
            style={[
              styles.puntoConexion,
              hayInternet === false && styles.puntoSinConexion,
              hayInternet === null && styles.puntoDesconocido,
            ]}
          />

          <Text
            style={[
              styles.textoConexion,
              hayInternet === false && styles.textoSinConexion,
              hayInternet === null && styles.textoDesconocido,
            ]}
          >
            {hayInternet === false
              ? "Sin conexión a internet"
              : hayInternet === true
                ? "Con conexión"
                : "Comprobando conexión..."}
          </Text>
        </View>
      </View>

      {hayInternet === false && (
        <View style={styles.avisoOffline}>
          <Text style={styles.textoAviso}>
            {datosDesactualizados
              ? "Estás sin conexión y los datos guardados tienen más de 24 horas. Podrían estar desactualizados."
              : "Estás sin conexión. Se muestran los comercios guardados."}
          </Text>
        </View>
      )}

      <Text style={styles.textoFecha}>
        {fechaDatos
          ? `Última actualización: ${new Date(
              fechaDatos,
            ).toLocaleString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Fecha de actualización no disponible"}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtros}
        contentContainerStyle={styles.contenidoFiltros}
      >
        {RUBROS.map((rubro) => (
          <Pressable
            key={rubro.id}
            onPress={() => setRubroSeleccionado(rubro.id)}
            style={[
              styles.chipRubro,
              rubroSeleccionado === rubro.id &&
                styles.chipRubroActivo,
            ]}
          >
            <Text
              style={[
                styles.textoChip,
                rubroSeleccionado === rubro.id &&
                  styles.textoChipActivo,
              ]}
            >
              {rubro.nombre}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.seccionMapa}>
        <View style={styles.encabezadoMapa}>
          <Text style={styles.tituloMapa}>
            Mapa de la ciudad
          </Text>

          <Text style={styles.etiquetaMapa}>
            {comerciosFiltrados.length} COMERCIOS
          </Text>
        </View>

        <View style={styles.tarjetaMapa}>
          <MapaComercios
            comercios={comerciosFiltrados}
            ubicacionUsuario={coordenadas}
            onSeleccionar={abrirFichaComercio}
          />

          {cargandoComercios && (
            <View style={styles.cargando}>
              <ActivityIndicator
                size="large"
                color="#137A63"
              />
              <Text style={styles.textoCargando}>
                Cargando comercios...
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.panelInferior}>
        <View style={styles.detalleUbicacion}>
          <View style={styles.iconoUbicacion}>
            <Text style={styles.iconoUbicacionTexto}>⌖</Text>
          </View>

          <View style={styles.detalleTexto}>
            <Text style={styles.tituloUbicacion}>
              Tu ubicación
            </Text>

            <Text style={styles.mensaje}>{mensaje}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.boton,
            pressed && styles.botonPresionado,
            buscandoUbicacion && styles.botonDeshabilitado,
          ]}
          onPress={obtenerUbicacion}
          disabled={buscandoUbicacion}
        >
          {buscandoUbicacion ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.iconoBoton}>⌖</Text>
          )}

          <Text style={styles.textoBoton}>
            {buscandoUbicacion
              ? "Buscando ubicación..."
              : "Usar mi ubicación"}
          </Text>
        </Pressable>

        <Text style={styles.credito}>
          La ubicación es opcional.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F5",
  },
  encabezado: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  filaEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconoMarca: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#DDF4EC",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoTexto: {
    fontSize: 30,
    color: "#137A63",
  },
  titulos: {
    flex: 1,
  },
  ciudad: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#137A63",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172D2A",
  },
  subtitulo: {
    fontSize: 14,
    color: "#647873",
    marginTop: 12,
  },
  estadoConexion: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    marginTop: 12,
    backgroundColor: "#EAF7EF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  puntoConexion: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#15803D",
  },
  puntoSinConexion: {
    backgroundColor: "#B45309",
  },
  puntoDesconocido: {
    backgroundColor: "#64748B",
  },
  textoConexion: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "600",
  },
  textoSinConexion: {
    color: "#92400E",
  },
  textoDesconocido: {
    color: "#475569",
  },
  avisoOffline: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
  },
  textoAviso: {
    color: "#92400E",
    fontSize: 12,
  },
  seccionMapa: {
    flex: 1,
    minHeight: 200,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  encabezadoMapa: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tituloMapa: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172D2A",
  },
  etiquetaMapa: {
    fontSize: 10,
    fontWeight: "800",
    color: "#137A63",
    letterSpacing: 1,
  },
  tarjetaMapa: {
    flex: 1,
    minHeight: 180,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#E5EEE9",
    borderWidth: 1,
    borderColor: "#E0EAE4",
  },
  cargando: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F3F7F5",
    zIndex: 1,
  },
  textoCargando: {
    color: "#47665D",
    fontSize: 13,
  },
  panelInferior: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  detalleUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconoUbicacion: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#DDF4EC",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoUbicacionTexto: {
    fontSize: 27,
    color: "#137A63",
  },
  detalleTexto: {
    flex: 1,
  },
  tituloUbicacion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#172D2A",
    marginBottom: 3,
  },
  mensaje: {
    fontSize: 12,
    color: "#647873",
    lineHeight: 17,
  },
  boton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#137A63",
  },
  botonPresionado: {
    backgroundColor: "#0E6250",
  },
  botonDeshabilitado: {
    opacity: 0.8,
  },
  iconoBoton: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  credito: {
    textAlign: "center",
    color: "#81918B",
    fontSize: 10,
    marginTop: 8,
  },
  filtros: {
    flexGrow: 0,
    backgroundColor: "#FFFFFF",
    maxHeight: 48,
  },
  contenidoFiltros: {
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  chipRubro: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#EDF3F0",
    borderWidth: 1,
    borderColor: "#DCE8E2",
  },
  chipRubroActivo: {
    backgroundColor: "#137A63",
    borderColor: "#137A63",
  },
  textoChip: {
    fontSize: 12,
    fontWeight: "600",
    color: "#47665D",
  },
  textoChipActivo: {
    color: "#FFFFFF",
  },
  textoFecha: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    color: "#647873",
  },
});
