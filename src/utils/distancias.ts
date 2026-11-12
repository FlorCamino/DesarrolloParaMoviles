import type { Comercio } from "@/types/business";

type Ubicacion = {
  latitude: number;
  longitude: number;
};

export function calcularDistanciaKm(
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

export function formatearDistancia(distancia: number): string {
  return distancia < 1
    ? `${Math.round(distancia * 1000)} metros`
    : `${distancia.toFixed(1)} km`;
}
