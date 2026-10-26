import {
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type { Comercio } from "@/tipos/comercio";

type Ubicacion = {
  latitude: number;
  longitude: number;
};

type Props = {
  comercios: Comercio[];
  ubicacionUsuario: Ubicacion | null;
  onSeleccionar: (comercio: Comercio) => void;
};

function calcularDistanciaKm(ubicacion: Ubicacion, comercio: Comercio): number {
  const radioTierra = 6371;

  const lat1 = (ubicacion.latitude * Math.PI) / 180;
  const lat2 = (comercio.coordenadas.latitud * Math.PI) / 180;

  const diferenciaLatitud =
    ((comercio.coordenadas.latitud - ubicacion.latitude) * Math.PI) / 180;

  const diferenciaLongitud =
    ((comercio.coordenadas.longitud - ubicacion.longitude) * Math.PI) / 180;

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(diferenciaLongitud / 2) ** 2;

  const distanciaCentral = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierra * distanciaCentral;
}

export default function MapaComercios({
  comercios,
  ubicacionUsuario,
  onSeleccionar,
}: Props) {
  const comerciosOrdenados = ubicacionUsuario
    ? [...comercios].sort(
        (a, b) =>
          calcularDistanciaKm(ubicacionUsuario, a) -
          calcularDistanciaKm(ubicacionUsuario, b),
      )
    : comercios;

  function abrirComoLlegar(comercio: Comercio) {
    const { latitud, longitud } = comercio.coordenadas;

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${latitud},${longitud}`;

    void Linking.openURL(url);
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.encabezado}>
        {ubicacionUsuario
          ? "📍 Comercios más cercanos"
          : "🏪 Comercios disponibles"}
      </Text>

      <Text style={styles.subtitulo}>
        {ubicacionUsuario
          ? "Ordenados según la distancia desde tu ubicación."
          : "Activá tu ubicación para ordenarlos por cercanía."}
      </Text>

      {comerciosOrdenados.length === 0 ? (
        <Text style={styles.vacio}>
          No encontramos comercios con este filtro.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {comerciosOrdenados.map((comercio) => {
            const distancia = ubicacionUsuario
              ? calcularDistanciaKm(ubicacionUsuario, comercio)
              : null;

            return (
              <View key={comercio.id} style={styles.tarjeta}>
                <Text style={styles.nombre}>{comercio.nombre}</Text>

                <Text style={styles.direccion}>{comercio.direccion}</Text>

                <Text style={styles.puntaje}>
                  ⭐ {comercio.puntaje.toFixed(1)} · {comercio.cantidadResenas}{" "}
                  reseñas
                </Text>

                {distancia !== null && (
                  <Text style={styles.distancia}>
                    📍 A{" "}
                    {distancia < 1
                      ? `${Math.round(distancia * 1000)} metros`
                      : `${distancia.toFixed(1)} km`}
                  </Text>
                )}

                <View style={styles.botones}>
                  <Pressable
                    style={styles.botonPrincipal}
                    onPress={() => onSeleccionar(comercio)}
                  >
                    <Text style={styles.textoBotonPrincipal}>Ver ficha</Text>
                  </Pressable>

                  <Pressable
                    style={styles.botonSecundario}
                    onPress={() => abrirComoLlegar(comercio)}
                  >
                    <Text style={styles.textoBotonSecundario}>Cómo llegar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    minHeight: 350,
    paddingVertical: 8,
  },
  encabezado: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 14,
  },
  lista: {
    paddingBottom: 16,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  nombre: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  direccion: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  puntaje: {
    fontSize: 14,
    color: "#B45309",
    marginBottom: 8,
  },
  distancia: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 12,
  },
  botones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  botonPrincipal: {
    backgroundColor: "#1E3A8A",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: "#1E3A8A",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  textoBotonSecundario: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  vacio: {
    padding: 16,
    color: "#64748B",
  },
});
