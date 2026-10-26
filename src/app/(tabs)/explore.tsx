import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapaComercios from "@/components/mapa-comercios";
import { buscarComercios } from "@/services/businesses";
import type { Comercio } from "@/types/business";

type Ubicacion = {
  latitude: number;
  longitude: number;
};

const RUBROS = [
  { id: null, nombre: "Todos" },
  { id: "rub-gastronomia", nombre: "Gastronomía" },
  { id: "rub-indumentaria", nombre: "Indumentaria" },
  { id: "rub-hogar", nombre: "Hogar" },
  { id: "rub-ferreteria", nombre: "Ferretería" },
  { id: "rub-salud", nombre: "Salud" },
  { id: "rub-servicios", nombre: "Servicios" },
  { id: "rub-tecnologia", nombre: "Tecnología" },
  { id: "rub-libreria", nombre: "Librería" },
  { id: "rub-otros", nombre: "Otros" },
];

export default function ExploreScreen() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(
    null,
  );

  const [ubicacionUsuario, setUbicacionUsuario] = useState<Ubicacion | null>(
    null,
  );

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [mensajeUbicacion, setMensajeUbicacion] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function cargarComercios() {
      setCargando(true);
      setError(false);

      try {
        const resultado = await buscarComercios(
          "",
          rubroSeleccionado ?? undefined,
        );

        if (vigente) {
          setComercios(resultado);
        }
      } catch (error) {
        console.error("Error cargando comercios del mapa:", error);

        if (vigente) {
          setComercios([]);
          setError(true);
        }
      } finally {
        if (vigente) {
          setCargando(false);
        }
      }
    }

    void cargarComercios();

    return () => {
      vigente = false;
    };
  }, [rubroSeleccionado, intento]);

  async function solicitarUbicacion() {
    setCargandoUbicacion(true);
    setMensajeUbicacion("");

    try {
      const permiso = await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== "granted") {
        setMensajeUbicacion(
          "No diste permiso para acceder a tu ubicación. Podés seguir explorando los comercios.",
        );
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUbicacionUsuario({
        latitude: posicion.coords.latitude,
        longitude: posicion.coords.longitude,
      });

      setMensajeUbicacion("Ubicación obtenida correctamente.");
    } catch (error) {
      console.error("Error obteniendo la ubicación:", error);

      setMensajeUbicacion(
        "No pudimos obtener tu ubicación. Revisá los permisos del dispositivo e intentá nuevamente.",
      );
    } finally {
      setCargandoUbicacion(false);
    }
  }

  function mostrarFicha(comercio: Comercio) {
    router.push({
      pathname: "/comercio/[id]",
      params: { id: comercio.id },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.encabezado}>
          <Text style={styles.etiqueta}>DESCUBRÍ TU CIUDAD</Text>

          <Text style={styles.titulo}>Mapa de comercios</Text>

          <Text style={styles.subtitulo}>
            Explorá los negocios locales y encontrá lo que necesitás.
          </Text>
        </View>

        <ScrollView
          horizontal
          style={styles.filtrosRubros}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaRubros}
        >
          {RUBROS.map((rubro) => {
            const seleccionado = rubroSeleccionado === rubro.id;

            return (
              <Pressable
                key={rubro.nombre}
                onPress={() => setRubroSeleccionado(rubro.id)}
                style={[styles.chip, seleccionado && styles.chipActivo]}
                accessibilityRole="button"
                accessibilityState={{
                  selected: seleccionado,
                }}
              >
                <Text
                  style={[
                    styles.textoChip,
                    seleccionado && styles.textoChipActivo,
                  ]}
                >
                  {rubro.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => void solicitarUbicacion()}
          disabled={cargandoUbicacion}
          style={styles.botonUbicacion}
          accessibilityRole="button"
        >
          {cargandoUbicacion ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBotonUbicacion}>📍 Usar mi ubicación</Text>
          )}
        </Pressable>

        {mensajeUbicacion.length > 0 && (
          <Text style={styles.mensajeUbicacion}>{mensajeUbicacion}</Text>
        )}

        <View style={styles.encabezadoMapa}>
          <Text style={styles.tituloMapa}>
            {cargando
              ? "Buscando comercios..."
              : `${comercios.length} ${
                  comercios.length === 1 ? "comercio" : "comercios"
                }`}
          </Text>
        </View>

        <View style={styles.contenedorMapa}>
          {cargando ? (
            <View style={styles.estado}>
              <ActivityIndicator size="large" color="#1E3A8A" />

              <Text style={styles.textoEstado}>Cargando comercios...</Text>
            </View>
          ) : error ? (
            <View style={styles.estado}>
              <Text style={styles.tituloEstado}>
                No pudimos cargar los comercios
              </Text>

              <Pressable
                onPress={() => setIntento((actual) => actual + 1)}
                style={styles.botonReintentar}
                accessibilityRole="button"
              >
                <Text style={styles.textoBotonReintentar}>
                  Volver a intentar
                </Text>
              </Pressable>
            </View>
          ) : (
            <MapaComercios
              comercios={comercios}
              ubicacionUsuario={ubicacionUsuario}
              onSeleccionar={mostrarFicha}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingBottom: 12,
  },
  encabezado: {
    paddingTop: 14,
    paddingBottom: 12,
    gap: 6,
  },
  etiqueta: {
    color: "#1E3A8A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  titulo: {
    color: "#1E3A8A",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitulo: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  filtrosRubros: { flexGrow: 0, flexShrink: 0 },
  listaRubros: {
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 22,
  },
  chipActivo: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  textoChip: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  textoChipActivo: {
    color: "#FFFFFF",
  },
  botonUbicacion: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    padding: 14,
    minHeight: 50,
    marginTop: 6,
  },
  textoBotonUbicacion: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  mensajeUbicacion: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
  },
  encabezadoMapa: {
    paddingVertical: 10,
  },
  tituloMapa: {
    color: "#1E3A8A",
    fontSize: 14,
    fontWeight: "800",
  },
  contenedorMapa: {
    flex: 1,
    minHeight: 350,
  },
  estado: {
    flex: 1,
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  tituloEstado: {
    color: "#1E3A8A",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },
  textoEstado: {
    color: "#64748B",
    fontSize: 13,
  },
  botonReintentar: {
    marginTop: 6,
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  textoBotonReintentar: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
