import { Directory, File, Paths } from "expo-file-system";
import * as Network from "expo-network";

type TipoMultimedia = "imagen" | "video";

const directorioMultimedia = new Directory(
    Paths.document,
    "multimedia-comercios",
);

const descargasEnCurso = new Map<string, Promise<string>>();

function generarNombreArchivo(url: string, tipo: TipoMultimedia): string {
    let hash = 2166136261;

    for (let i = 0; i < url.length; i++) {
        hash ^= url.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    const nombre = (hash >>> 0).toString(16);
    const urlSinParametros = url.split("?")[0].split("#")[0];
    const extension = urlSinParametros.match(/\.[a-zA-Z0-9]{2,5}$/)?.[0];
    const extensionPredeterminada = tipo === "video" ? ".mp4" : ".jpg";

    return `${nombre}-v2${extension ?? extensionPredeterminada}`;
}

async function descargarMultimedia(
    url: string,
    tipo: TipoMultimedia,
): Promise<string> {
    const nombreArchivo = generarNombreArchivo(url, tipo);

    try {
        directorioMultimedia.create({
            idempotent: true,
            intermediates: true,
        });

        const archivoLocal = new File(directorioMultimedia, nombreArchivo);
        const archivoTemporal = new File(
            directorioMultimedia,
            `${nombreArchivo}.download`,
        );

        if (archivoLocal.exists && archivoLocal.size > 0) {
            return archivoLocal.uri;
        }

        const estadoRed = await Network.getNetworkStateAsync();

        if (estadoRed.isConnected !== true || estadoRed.isInternetReachable === false) {
            return url;
        }

        if (archivoTemporal.exists) {
            archivoTemporal.delete();
        }

        await File.downloadFileAsync(url, archivoTemporal);

        if (!archivoTemporal.exists || archivoTemporal.size === 0) {
            throw new Error("El archivo descargado está vacío.");
        }

        await archivoTemporal.move(archivoLocal, { overwrite: true });

        return archivoLocal.uri;
    } catch (error) {
        console.warn(
            "No se pudo guardar el archivo multimedia. Se utilizará la URL original.",
            error,
        );

        return url;

    } finally {
        try {
            const archivoTemporal = new File(
                directorioMultimedia,
                `${nombreArchivo}.download`,
            );

            if (archivoTemporal.exists) {
                archivoTemporal.delete();
            }
        } catch (error) {
            console.warn(
                "No se pudo limpiar el archivo temporal.",
                error,
            );
        }
    }
}


    export function obtenerUriMultimedia(
        url: string,
        tipo: TipoMultimedia,
    ): Promise<string> {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return Promise.resolve(url);
        }

        const clave = `${tipo}:${url}`;
        const descargaExistente = descargasEnCurso.get(clave);

        if (descargaExistente) {
            return descargaExistente;
        }

        const descarga = descargarMultimedia(url, tipo);

        descargasEnCurso.set(clave, descarga);

        void descarga.then(
            () => descargasEnCurso.delete(clave),
            () => descargasEnCurso.delete(clave),
        );

        return descarga;
    }
