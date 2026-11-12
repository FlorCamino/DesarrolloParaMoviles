import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Resena } from "@/types/business";
import { formatearFechaArgentina } from "@/utils/promociones";

interface Props {
    resena: Resena;
    esMia: boolean;
    editando: boolean;
    onEditar: () => void;
    onBorrar: () => void;
    onReportar: () => void;
    children?: ReactNode;
}

export function ResenaTarjeta({
    resena,
    esMia,
    editando,
    onEditar,
    onBorrar,
    onReportar,
    children
}: Props) {
    return (
        <View style={styles.resenaItem}>
            <View style={styles.filaResena}>
                <Text style={styles.nombre}>{esMia ? 'Tu reseña' : resena.usuarioNombre}</Text>
                <Text style={styles.estrellasResena}>
                    {'★'.repeat(resena.estrellas)}
                    {'☆'.repeat(5 - resena.estrellas)}
                </Text>
            </View>

            {editando ? (
                children
            ) : (
                <>
                    <Text style={styles.fecha}>{formatearFechaArgentina(resena.creadaEn)}</Text>
                    {resena.estadoSincronizacion === 'pendiente' && (
                        <Text style={styles.pendiente}>
                            Pendiente de sincronización
                        </Text>
                    )}

                    {resena.estadoSincronizacion === 'error' && (
                        <Text style={styles.errorSincronizacion}>
                            No se pudo enviar esta reseña. Revisá los datos.
                        </Text>
                    )}
                    <Text style={styles.comentario}>{resena.comentario}</Text>

                    {resena.respuesta ? (
                        <View style={styles.respuestaComercio}>
                            <Text style={styles.etiquetaRespuesta}>Respuesta del comercio</Text>
                            <Text style={styles.comentario}>{resena.respuesta}</Text>
                        </View>
                    ) : null}

                    {esMia ? (
                        <View style={styles.acciones}>
                            <Pressable accessibilityRole="button" onPress={onEditar} style={({ pressed }) => [styles.accion, pressed && { opacity: 0.8 }]}>
                                <Text style={styles.accionTexto}>Editar</Text>
                            </Pressable>

                            <Pressable accessibilityRole="button" onPress={onBorrar} style={({ pressed }) => [styles.accion, pressed && { opacity: 0.8 }]}>
                                <Text style={styles.accionTexto}>Borrar</Text>
                            </Pressable>
                        </View>
                    ) : resena.reportada ? (
                        <Text style={styles.reportada}>Reportada. Actualmente en revisión.</Text>
                    ) : (
                        <Pressable accessibilityRole="button" onPress={onReportar} style={({ pressed }) => [styles.reportar, pressed && { opacity: 0.8 }]}>
                            <Text style={styles.reportarTexto}>Reportar reseña</Text>
                        </Pressable>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    resenaItem: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 14, marginTop: 4, gap: 9 },
    filaResena: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    nombre: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
    estrellasResena: { color: '#B45309', fontSize: 15, fontWeight: '800' },
    fecha: { color: '#64748B', fontSize: 11 },
    pendiente: {
        color: '#B45309',
        fontSize: 11,
        fontWeight: '600',
    },
    errorSincronizacion: {
        color: '#B91C1C',
        fontSize: 11,
        fontWeight: '600',
    },
    comentario: { color: '#64748B', fontSize: 13, lineHeight: 20 },
    respuestaComercio: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, gap: 6 },
    etiquetaRespuesta: { color: '#1E3A8A', fontSize: 11, fontWeight: '800' },

    acciones: { flexDirection: 'row', gap: 10 },
    accion: { flex: 1, minHeight: 44, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    accionTexto: { color: '#1E3A8A', fontSize: 14, fontWeight: '600' },
    accionPeligro: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    accionPeligroTexto: { color: '#B91C1C' },

    reportar: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
    reportarTexto: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
    reportada: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
});