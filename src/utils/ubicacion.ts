import * as Location from "expo-location";

export type UbicacionReferencia = {
    latitude: number;
    longitude: number;
};

export const UBICACION_FICTICIA: UbicacionReferencia = {
    latitude: -32.4835,
    longitude: -58.2312,
};

type ResultadoUbicacion = {
    ubicacion: UbicacionReferencia;
    esReal: boolean;
};


export async function obtenerUbicacionReferencia(): Promise<ResultadoUbicacion> {
    try {
        let permiso = await Location.getForegroundPermissionsAsync();

        if (!permiso.granted && permiso.canAskAgain) {
            permiso = await Location.requestForegroundPermissionsAsync();
        }

        if (!permiso.granted) {
            return {
                ubicacion: UBICACION_FICTICIA,
                esReal: false,
            };
        }

        const posicion = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            ubicacion: {
                latitude: posicion.coords.latitude,
                longitude: posicion.coords.longitude,
            },
            esReal: true,
        };
    } catch (error) {
        console.warn("No se pudo obtener la ubicación del usuario.", error);

        return {
            ubicacion: UBICACION_FICTICIA,
            esReal: false,
        };
    }
}

