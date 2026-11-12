import {
  calcularDistanciaKm,
  formatearDistancia,
} from "@/utils/distancias";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import type { Comercio } from "@/types/business";

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
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export default function MapaComercios({
  comercios,
  ubicacionUsuario,
  onSeleccionar,
}: Props) {
  const mapaRef = useRef<MapView | null>(null);
  const [mapaListo, setMapaListo] = useState(false);

  const comerciosOrdenados = useMemo(() => {
    const comerciosValidos = comercios.filter((comercio) => {
      const latitud = comercio.coordenadas?.latitud;
      const longitud = comercio.coordenadas?.longitud;

      return (
        typeof latitud === "number" &&
        typeof longitud === "number" &&
        Number.isFinite(latitud) &&
        Number.isFinite(longitud) &&
        latitud >= -90 &&
        latitud <= 90 &&
        longitud >= -180 &&
        longitud <= 180
      );
    });

    if (!ubicacionUsuario) {
      return comerciosValidos;
    }

    return [...comerciosValidos].sort(
      (a, b) =>
        calcularDistanciaKm(ubicacionUsuario, a) -
        calcularDistanciaKm(ubicacionUsuario, b),
    );
  }, [comercios, ubicacionUsuario]);

  const coordenadas = useMemo(() => {
    const puntos = comerciosOrdenados.map((comercio) => ({
      latitude: comercio.coordenadas.latitud,
      longitude: comercio.coordenadas.longitud,
    }));

    if (ubicacionUsuario) {
      puntos.push(ubicacionUsuario);
    }

    return puntos;
  }, [comerciosOrdenados, ubicacionUsuario]);

  useEffect(() => {
    if (!mapaListo || coordenadas.length === 0) {
      return;
    }

    if (coordenadas.length === 1) {
      mapaRef.current?.animateToRegion(
        {
          ...coordenadas[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );

      return;
    }

    mapaRef.current?.fitToCoordinates(coordenadas, {
      edgePadding: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      },
      animated: true,
    });
  }, [coordenadas, mapaListo]);

  function obtenerDistancia(comercio: Comercio): string {
    if (!ubicacionUsuario) {
      return "";
    }

    const distancia = calcularDistanciaKm(
      ubicacionUsuario,
      comercio,
    );

    return formatearDistancia(distancia);
  }

  if (
    Platform.OS === "android" &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    !Constants.expoConfig?.extra?.googleMapsAndroidConfigurado
  ) {
    return (
      <View style={[styles.contenedor, styles.mapaNoDisponible]}>
        <Text>El mapa no está disponible sin una clave de Google Maps.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <MapView
        ref={mapaRef}
        style={styles.mapa}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...REGION_INICIAL,
          ...(ubicacionUsuario
            ? {
              latitude: ubicacionUsuario.latitude,
              longitude: ubicacionUsuario.longitude,
            }
            : {}),
        }}
        onMapReady={() => setMapaListo(true)}
      >
        {comerciosOrdenados.map((comercio) => (
          <Marker
            key={comercio.id}
            coordinate={{
              latitude: comercio.coordenadas.latitud,
              longitude: comercio.coordenadas.longitud,
            }}
            title={comercio.nombre}
            description={[
              comercio.direccion,
              `${Number(comercio.puntaje).toFixed(1)} estrellas`,
              obtenerDistancia(comercio),
            ]
              .filter(Boolean)
              .join(" · ")}
            onCalloutPress={() => onSeleccionar(comercio)}
          />
        ))}

        {ubicacionUsuario && (
          <Marker
            coordinate={ubicacionUsuario}
            title="Tu ubicación"
            pinColor="#2455B8"
          />
        )}
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
    flex: 1,
  },
  mapaNoDisponible: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
});
