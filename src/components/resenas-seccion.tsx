import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { borrarResena, crearResena, editarResena, reportarResena } from "@/services/reviews";
import type { Resena } from "@/types/business";
import { ResenaTarjeta } from "./resena-tarjeta";
import { ResenaFormulario } from "./resenas-formulario";

interface Props {
    comercioId: string;
    resenas: Resena[];
    onCambio: () => Promise<void>;
}

export function ResenasSeccion({
    comercioId,
    resenas,
    onCambio
}: Props) {
    const { usuario } = useAuth();

    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [estrellas, setEstrellas] = useState(0);
    const [comentario, setComentario] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const miResena = usuario ? resenas.find((resena) => resena.usuarioId === usuario.id) : undefined;

    const puedeResenar = usuario?.rol !== 'comercio' && !miResena;

    function pedirLogin(mensaje: string) {
        Alert.alert('Inicia sesión primero.', mensaje, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ingresar', onPress: () => router.push('/login') },
        ]);
    }

    function abrirNueva() {
        if (!usuario) {
            pedirLogin('Necesitás una cuenta para dejar una reseña.');
            return;
        }
        setEditandoId('nueva');
        setEstrellas(0);
        setComentario('');
        setError(null);
    }

    function abrirEdicion(resena: Resena) {
        setEditandoId(resena.id);
        setEstrellas(resena.estrellas);
        setComentario(resena.comentario);
        setError(null);
    }

    function cancelar() {
        setEditandoId(null);
        setError(null);
    }

    async function guardar() {
        setError(null);

        if (estrellas < 1) {
            setError('Elige cuántas estrellas le das.');
            return;
        }

        const texto = comentario.trim();

        if (texto === '') {
            setError('Escribe un comentario.');
            return;
        }

        setGuardando(true);

        try {
            if (editandoId === 'nueva') {
                await crearResena(comercioId, estrellas, texto);
            } else if (editandoId) {
                await editarResena(editandoId, estrellas, texto);
            }

            setEditandoId(null);
            await onCambio();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar tu reseña.'
            );

            if (editandoId === 'nueva') {
                try {
                    await onCambio();
                    setEditandoId(null);
                    setError(null);
                } catch (errorActualizacion) {
                    console.warn(
                        'No se pudo actualizar la lista de reseñas:',
                        errorActualizacion
                    );
                }
            }
        } finally {
            setGuardando(false);
        }
    }

    function confirmarBorrado(resena: Resena) {
        Alert.alert('Borrar reseña', '¿Quiere borrar su reseña? Esta acción no se puede deshacer.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Borrar', style: 'destructive', onPress: async () => {
                    try {
                        await borrarResena(resena.id);
                        await onCambio();
                    } catch (error) {
                        Alert.alert('No se pudo borrar la reseña', error instanceof Error ? error.message : 'Intenta nuevamente');
                    }
                },
            },
        ]);
    }

    function confirmarReporte(resena: Resena) {
        if (!usuario) {
            pedirLogin('Necesitas una cuenta para poder reportar una reseña.');
            return;
        }
        Alert.alert('Reportar reseña', 'Se reportará la reseña como ofensiva para su revisión. Mientras tanto seguirá visible ¿Desea reportarla?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Reportar', style: 'destructive', onPress: async () => {
                    try {
                        await reportarResena(resena.id);
                        await onCambio();
                    } catch (error) {
                        Alert.alert('No se puedo reportar la reseña', error instanceof Error ? error.message : 'Intenta nuevamente');
                    }
                },
            },
        ]);
    }

    const formulario = (
        <ResenaFormulario
            estrellas={estrellas}
            comentario={comentario}
            error={error}
            guardando={guardando}
            textoGuardar={guardando ? 'Guardando...' : editandoId === 'nueva' ? 'Publicar' : 'Guardar'}
            onCambiarEstrellas={setEstrellas}
            onCambiarComentario={setComentario}
            onGuardar={guardar}
            onCancelar={cancelar}
        />
    );

    return (
        <View style={styles.contenedor}>
            {editandoId === 'nueva' ? (
                formulario
            ) : puedeResenar ? (
                <Pressable accessibilityRole="button" onPress={abrirNueva} style={({ pressed }) => [styles.botonPrincipal, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.botonPrincipalTexto}>Dejar mi reseña</Text>
                </Pressable>
            ) : null}

            {resenas.length === 0 ? (
                <Text style={styles.vacio}>Todavía no hay reseñas.</Text>
            ) : (
                resenas.map((resena) => (
                    <ResenaTarjeta
                        key={resena.id}
                        resena={resena}
                        esMia={usuario?.id === resena.usuarioId}
                        editando={editandoId === resena.id}
                        onEditar={() => abrirEdicion(resena)}
                        onBorrar={() => confirmarBorrado(resena)}
                        onReportar={() => confirmarReporte(resena)}
                    >
                        {formulario}
                    </ResenaTarjeta>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: { gap: 12 },
    vacio: { color: '#64748B', fontSize: 13 },
    botonPrincipal: { minHeight: 48, backgroundColor: '#1E3A8A', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    botonPrincipalTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});