import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

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

const REGION_INICIAL = {
  latitude: -32.4835,
  longitude: -58.2312,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

function calcularDistanciaKm(ubicacion: Ubicacion, comercio: Comercio): number {
  const radioTierra = 6371;

  const latitudUsuario = (ubicacion.latitude * Math.PI) / 180;

  const latitudComercio = (comercio.coordenadas.latitud * Math.PI) / 180;

  const diferenciaLatitud =
    ((comercio.coordenadas.latitud - ubicacion.latitude) * Math.PI) / 180;

  const diferenciaLongitud =
    ((comercio.coordenadas.longitud - ubicacion.longitude) * Math.PI) / 180;

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(latitudUsuario) *
      Math.cos(latitudComercio) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  const distanciaCentral = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierra * distanciaCentral;
}

function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    return `A ${Math.round(distanciaKm * 1000)} metros`;
  }

  return `A ${distanciaKm.toFixed(1)} km`;
}

export default function MapaComercios({
  comercios,
  ubicacionUsuario,
  onSeleccionar,
}: Props) {
  const mapaRef = useRef<MapView>(null);

  const comerciosOrdenados = useMemo(() => {
    if (!ubicacionUsuario) {
      return comercios;
    }

    return [...comercios].sort(
      (a, b) =>
        calcularDistanciaKm(ubicacionUsuario, a) -
        calcularDistanciaKm(ubicacionUsuario, b),
    );
  }, [comercios, ubicacionUsuario]);

  useEffect(() => {
    if (!ubicacionUsuario || !mapaRef.current) {
      return;
    }

    mapaRef.current.animateToRegion(
      {
        ...ubicacionUsuario,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      700,
    );
  }, [ubicacionUsuario]);

  return (
    <View style={styles.contenedor}>
      <MapView
        ref={mapaRef}
        style={styles.mapa}
        initialRegion={REGION_INICIAL}
        showsUserLocation={Boolean(ubicacionUsuario)}
        showsMyLocationButton={false}
      >
        {comerciosOrdenados.map((comercio) => {
          const distancia = ubicacionUsuario
            ? calcularDistanciaKm(ubicacionUsuario, comercio)
            : null;

          const descripcion = [
            comercio.direccion,
            `${comercio.puntaje.toFixed(1)} estrellas`,
            distancia !== null ? formatearDistancia(distancia) : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Marker
              key={comercio.id}
              coordinate={{
                latitude: comercio.coordenadas.latitud,
                longitude: comercio.coordenadas.longitud,
              }}
              title={comercio.nombre}
              description={descripcion}
              onCalloutPress={() => onSeleccionar(comercio)}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    minHeight: 350,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  mapa: {
    ...StyleSheet.absoluteFill,
  },
});
