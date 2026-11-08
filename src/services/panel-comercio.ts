import { COMERCIOS_MOCK as DIRECTORIO_MOCK } from "@/mocks/comercios";
import { PROMOCIONES_MOCK } from "@/mocks/promociones";
import { RESENAS_MOCK } from "@/mocks/resenas";
import { usuariosMock } from "@/mocks/usuarios";

import type { Comercio, Coordenadas, Horario, Resena } from "@/types/business";
import type { Promocion, UsoDePromocion } from "@/types/promociones";
import { obtenerEstadoPromocion } from "@/utils/promociones";
import { ErrorApi, obtenerCodigoDeUso } from "./promociones";

const esperar = (milisegundos: number) => new Promise<void>((resolver) => setTimeout(resolver, milisegundos));

export interface DatosPromocion {
    titulo: string;
    detalle: string;
    descuento: number | null;
    hasta: string;
    soloApp: boolean;
}

export async function listarMisPromociones(comercioId: string): Promise<Promocion[]> {
    await esperar(300);

    return PROMOCIONES_MOCK
        .filter((promocion) => promocion.comercioId === comercioId)
        .sort((a, b) => new Date(b.desde).getTime() - new Date(a.desde).getTime());
}

export async function obtenerMiPromocion(comercioId: string, id: string): Promise<Promocion> {
    await esperar(150);

    const promocion = PROMOCIONES_MOCK.find((item) => item.id === id);
    if (!promocion) {
        throw new ErrorApi('PROMOCION_NO_ENCONTRADA', 'La promocion no existe');
    }
    if (promocion.comercioId !== comercioId) {
        throw new ErrorApi('SIN_PERMISO', 'Esa promoción es de otro comercio.');
    }
    return promocion;
}

export async function crearPromocion(comercioId: string, datos: DatosPromocion): Promise<Promocion> {
    await esperar(400);

    const ahora = Date.now();
    if (new Date(datos.hasta).getTime() <= ahora) {
        throw new ErrorApi('PROMOCION_VENCIDA', 'La fecha de fin debe ser posterior a la de inicio.');
    }

    const nueva: Promocion = {
        id: `pro-${ahora}`,
        comercioId,
        titulo: datos.titulo.trim(),
        detalle: datos.detalle.trim(),
        descuento: datos.descuento,
        desde: new Date(ahora).toISOString(),
        hasta: datos.hasta,
        imagenUrl: null,
        soloApp: datos.soloApp,
        usos: 0,
        activa: true,
    };

    PROMOCIONES_MOCK.push(nueva);
    return nueva;
}

export async function editarPromocion(comercioId: string, id: string, cambios: DatosPromocion): Promise<Promocion> {
    const promocion = await obtenerMiPromocion(comercioId, id);

    if (obtenerEstadoPromocion(promocion) === 'vencida') {
        throw new ErrorApi('PROMOCION_VENCIDA', 'Una promoción vencida no puede ser editada.');
    }
    if (new Date(cambios.hasta).getTime() <= new Date(promocion.desde).getTime()) {
        throw new ErrorApi('VALIDACION_INVALIDA', 'La fecha de fin debe ser posterior a la de inicio');
    }

    promocion.titulo = cambios.titulo.trim();
    promocion.detalle = cambios.detalle.trim();
    promocion.descuento = cambios.descuento;
    promocion.hasta = cambios.hasta;
    promocion.soloApp = cambios.soloApp;
    return promocion;
}

export async function darDeBajaPromocion(comercioId: string, id: string): Promise<void> {
    const promocion = await obtenerMiPromocion(comercioId, id);
    promocion.activa = false;
}

const USOS_VALIDADOS = new Map<string, UsoDePromocion>();

export async function validarCodigo(comercioId: string, codigoLeido: string): Promise<{promocion: Promocion; uso: UsoDePromocion}> {
    await esperar(400);

    const codigo = codigoLeido.trim().toUpperCase();
    if (!codigo) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'El código no es correcto o falta.');
    }

    for (const promocion of PROMOCIONES_MOCK) {
        if (!promocion.soloApp) continue;

        for (const usuario of usuariosMock) {
            if (usuario.rol !== 'vecino') continue;

            let uso: UsoDePromocion;
            try {
                uso = await obtenerCodigoDeUso(promocion.id, usuario.id);
            } catch {
                continue;
            }
            if (uso.codigo.toUpperCase() !== codigo) continue;

            if (promocion.comercioId !== comercioId) {
                throw new ErrorApi('PROMOCION_OTRO_COMERCIO', 'El código corresponde a otro comercio.');
            }
            if (USOS_VALIDADOS.has(codigo)) {
                throw new ErrorApi('CODIGO_YA_VALIDADO', 'El código ya ha sido validado anteriormente.');
            }
            if (new Date(promocion.desde).getTime() > Date.now()) {
                throw new ErrorApi('PROMOCION_AUN_NO_ACTIVA', 'La promoción aún no está activa.');
            }

            const validado: UsoDePromocion = { ...uso, validadoEn: new Date().toISOString()};
            USOS_VALIDADOS.set(codigo, validado);
            promocion.usos += 1;
            return {promocion, uso: validado};
        }
    }

    throw new ErrorApi('CODIGO_INVALIDO', 'El código no existe o la promoción ha vencido.');
}

const MEDIOS_DE_PAGO = ['efectivo', 'debito', 'credito', 'transferencia', 'billetera_virtual'];

export interface DatosComercio {
    descripcion: string;
    direccion: string;
    coordenadas: Coordenadas;
    telefono: string | null;
    whatsapp: string | null;
    instagram: string | null;
    mediosDePago: string[];
    imagenes: string[];
    videoUrl: string | null;
}

export async function obtenerMiComercio(comercioId: string): Promise<Comercio> {
    await esperar(200);

    const comercio = DIRECTORIO_MOCK.find((item) => item.id === comercioId);
    if (!comercio) {
        throw new ErrorApi('COMERCIO_NO_ENCONTRADO', 'No se encontró el comercio.');
    }
    return comercio;
}

export async function editarMiComercio(comercioId: string, cambios: DatosComercio): Promise<Comercio> {
    const comercio = await obtenerMiComercio(comercioId);
    await esperar(300);

    if (cambios.whatsapp !== null && !/^\d{10,15}$/.test(cambios.whatsapp)) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'El número de WhatsApp tiene que ser solo números e incluir el código de país (por ejemplo 5493442421000).');
    }
    if (cambios.instagram !== null && !/^@[A-Za-z0-9._]{1,30}$/.test(cambios.instagram)) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'La cuenta de Instagram debe empezar con un @, por ejemplo @eltornillo.');
    }
    const {latitud, longitud} = cambios.coordenadas;
    if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90 || !Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'La ubicación del comercio no es válida.');
    }
    if (cambios.telefono !== null && cambios.telefono.length > 40) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'El teléfono tiene que tener hasta 40 caracteres.');
    }
    if (cambios.imagenes.length > 8) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'Se pueden cargar hasta 8 fotos.');
    }
    if (cambios.mediosDePago.some((medio) => !MEDIOS_DE_PAGO.includes(medio))) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'Hay un medio de pago que no existe.');
    }

  Object.assign(comercio, cambios);
  return comercio;
}

export async function agregarImagen(urlLocal: string): Promise<string> {
    await esperar(500);
    return urlLocal;
}

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function editarMisHorarios(comercioId: string, horarios: Horario[]): Promise<Comercio> {
    const comercio = await obtenerMiComercio(comercioId);
    await esperar(300);

    for (const tramo of horarios) {
        const dia = NOMBRES_DIA[tramo.dia];
        if (!HORA_VALIDA.test(tramo.abre) || !HORA_VALIDA.test(tramo.cierra)) {
            throw new ErrorApi('VALIDACION_FALLIDA', `El horario del día ${dia} es incorrecto, las horas deben ser en formato HH:MM.`);
        }
        if (tramo.abre >= tramo.cierra) {
            throw new ErrorApi('VALIDACION_FALLIDA', `El horario del día ${dia} es incorrecto, un comercio no puede abrir luego de la hora de cierre.`);
        }
    }
    
    for (let dia = 0; dia <= 6; dia++) {
        const tramos = horarios
            .filter((tramo) => tramo.dia === dia)
            .sort((a, b) => a.abre.localeCompare(b.abre));

            for (let i = 1; i < tramos.length; i++) {
                if (tramos[i].abre < tramos[i-1].cierra) {
                    throw new ErrorApi('HORARIOS_SUPERPUESTOS', `Existen horarios que se superponen el ${NOMBRES_DIA[dia]}.`);
                }
            }
    }

    comercio.horarios = horarios.map(({dia, abre, cierra}) => ({dia, abre, cierra}));
    return comercio;
}

export async function listarMisRenas(comercioId: string): Promise<Resena[]> {
    await esperar(250);

    return RESENAS_MOCK
        .filter((resena) => resena.comercioId === comercioId)
        .sort((a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime());
}

export async function responderResena(comercioId: string, resenaId: string, respuesta: string): Promise<Resena> {
    await esperar(300);

    const resena = RESENAS_MOCK.find((item) => item.id === resenaId);
    if (!resena) {
        throw new ErrorApi('RESENA_NO_ENCONTRADA', 'La reseña no existe');
    }

    if (resena.comercioId !== comercioId) {
        throw new ErrorApi('SIN_PERMISO', 'Solo es posible responder reseñas de tu comercio.');
    }

    if (resena.respuesta !== null) {
        throw new ErrorApi('RESENA_YA_RESPONDIDA', 'La reseña ya tiene una respuesta.');
    }

    const texto = respuesta.trim();
    if (texto.length < 1 || texto.length > 1000) {
        throw new ErrorApi('VALIDACION_FALLIDA', 'La respuesta debe tener entre 1 y 1000 caracteres.')
    }

    resena.respuesta = texto;
    return resena;
    
}

export async function reportarResena(resenaId: string): Promise<Resena> {
    await esperar(300);
    
    const resena = RESENAS_MOCK.find((item) => item.id === resenaId);
    if (!resena) {
        throw new ErrorApi('RESENA_NO_ENCONTRADA', 'La reseña no existe');
    }
    resena.reportada = true;
    return resena;
}

export async function subirVideo(urlLocal: string): Promise<string> {
    await esperar(800);
    return urlLocal;
}