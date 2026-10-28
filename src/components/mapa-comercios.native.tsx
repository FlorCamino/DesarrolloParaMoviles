
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

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
};

function calcularDistanciaKm(
  ubicacion: Ubicacion,
  comercio: Comercio,
): number {
  const radioTierra = 6371;
  const radianes = Math.PI / 180;

  const lat1 = ubicacion.latitude * radianes;
  const lat2 = comercio.coordenadas.latitud * radianes;
  const diferenciaLatitud =
    (comercio.coordenadas.latitud - ubicacion.latitude) * radianes;
  const diferenciaLongitud =
    (comercio.coordenadas.longitud - ubicacion.longitude) * radianes;

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  const distanciaCentral =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierra * distanciaCentral;
}

export default function MapaComercios({
  comercios,
  ubicacionUsuario,
  onSeleccionar,
}: Props) {
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

  const htmlMapa = useMemo(() => {
    const datos = JSON.stringify({
      comercios: comerciosOrdenados.map((comercio) => ({
        id: comercio.id,
        nombre: comercio.nombre,
        direccion: comercio.direccion,
        latitud: comercio.coordenadas.latitud,
        longitud: comercio.coordenadas.longitud,
        puntaje: comercio.puntaje,
        distancia: ubicacionUsuario
          ? calcularDistanciaKm(ubicacionUsuario, comercio)
          : null,
      })),
      ubicacionUsuario,
      centroInicial: REGION_INICIAL,
    }).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #e5eee9;
    }
    .leaflet-popup-content {
      font-family: Arial, sans-serif;
      min-width: 150px;
    }
    .nombre {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .detalle {
      font-size: 12px;
      margin-bottom: 8px;
    }
    button {
      border: 0;
      border-radius: 6px;
      background: #137a63;
      color: white;
      padding: 8px 10px;
      font-size: 12px;
    }
    .aviso {
      position: absolute;
      z-index: 1000;
      bottom: 12px;
      left: 12px;
      right: 12px;
      padding: 8px;
      border-radius: 8px;
      background: white;
      font: 12px Arial, sans-serif;
      box-shadow: 0 1px 5px #0002;
    }
  </style>
</head>
<body>
  <div id="mapa"></div>

  <script>
    window.datosMapa = ${datos};
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      const datos = window.datosMapa;
      const centro = datos.ubicacionUsuario
        ? [datos.ubicacionUsuario.latitude, datos.ubicacionUsuario.longitude]
        : [datos.centroInicial.latitude, datos.centroInicial.longitude];

      const mapa = L.map("mapa").setView(centro, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(mapa);

      datos.comercios.forEach(function (comercio) {
        const distancia = comercio.distancia === null
          ? ""
          : "<br>" + (comercio.distancia < 1
              ? Math.round(comercio.distancia * 1000) + " metros"
              : comercio.distancia.toFixed(1) + " km");

        const popup = document.createElement("div");
        const nombre = document.createElement("div");
        nombre.className = "nombre";
        nombre.textContent = comercio.nombre;

        const detalle = document.createElement("div");
        detalle.className = "detalle";
        detalle.textContent = comercio.direccion +
          " · " + Number(comercio.puntaje).toFixed(1) +
          " estrellas" +
          (comercio.distancia === null ? "" :
            " · " + (comercio.distancia < 1
              ? Math.round(comercio.distancia * 1000) + " metros"
              : comercio.distancia.toFixed(1) + " km"));

        const boton = document.createElement("button");
        boton.textContent = "Ver comercio";
        boton.onclick = function () {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ tipo: "seleccionar", id: comercio.id })
          );
        };

        popup.appendChild(nombre);
        popup.appendChild(detalle);
        popup.appendChild(boton);

        L.marker([comercio.latitud, comercio.longitud])
          .addTo(mapa)
          .bindPopup(popup);
      });

      if (datos.ubicacionUsuario) {
        L.circleMarker(
          [datos.ubicacionUsuario.latitude, datos.ubicacionUsuario.longitude],
          {
            radius: 8,
            color: "#ffffff",
            weight: 3,
            fillColor: "#2563eb",
            fillOpacity: 1
          }
        ).addTo(mapa).bindPopup("Tu ubicación");

        if (datos.comercios.length > 0) {
          const puntos = datos.comercios.map(function (comercio) {
            return [comercio.latitud, comercio.longitud];
          });
          puntos.push([
            datos.ubicacionUsuario.latitude,
            datos.ubicacionUsuario.longitude
          ]);
          mapa.fitBounds(puntos, { padding: [25, 25], maxZoom: 16 });
        }
      }

      if (datos.comercios.length === 0) {
        const aviso = document.createElement("div");
        aviso.className = "aviso";
        aviso.textContent = "No hay comercios para mostrar con este filtro.";
        document.body.appendChild(aviso);
      }
    })();
  </script>
</body>
</html>`;
  }, [comerciosOrdenados, ubicacionUsuario]);

  function manejarMensaje(evento: { nativeEvent: { data: string } }) {
    try {
      const mensaje = JSON.parse(evento.nativeEvent.data);

      if (mensaje.tipo !== "seleccionar") {
        return;
      }

      const comercio = comerciosOrdenados.find(
        (item) => item.id === mensaje.id,
      );

      if (comercio) {
        onSeleccionar(comercio);
      }
    } catch {
      console.warn("No se pudo procesar la selección del mapa.");
    }
  }

  return (
    <View style={styles.contenedor}>
      <WebView
        source={{ html: htmlMapa }}
        style={styles.mapa}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onMessage={manejarMensaje}
        setSupportMultipleWindows={false}
      />
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
    backgroundColor: "#E2E8F0",
  },
});
