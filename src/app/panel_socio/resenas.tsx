import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipFiltro } from "@/components/chip-filtro";
import { EstadoPantalla } from "@/components/estado-pantalla";
import { useAuth } from "@/hooks/use-auth";
import { listarMisRenas, reportarResena, responderResena } from "@/services/panel-comercio";
import type { Resena } from "@/types/business";
import { formatearFechaArgentina } from "@/utils/promociones";

type Filtro = 'todas' | 'sinResponder';

export default function ResenasScreen() {
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();
    const comercioId = usuario?.comercioId ?? null;

    const [resenas, setResenas] = useState<Resena[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [filtro, setFiltro] = useState<Filtro>('todas');

    const [abiertaId, setAbiertaId] = useState<string | null>(null);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);

    const cargar = useCallback(async () =>{
        if (!comercioId) return;
        setError(false);
        try {
            setResenas(await listarMisRenas(comercioId));
        } catch {
            setError(true);
        } finally {
            setCargando(false);
        }
    }, [comercioId]);

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar]),
    );

    function abrirRespuesta(id: string) {
        setAbiertaId(id);
        setTexto('');
        setErrorRespuesta(null);
    }

    function cancelarRespuesta() {
        setAbiertaId(null);
        setTexto('');
        setErrorRespuesta(null);
    }

    function confirmarReporte(resena: Resena) {
        Alert.alert('Repotar reseña', 'La reseña se marcará como ofensiva para su revisión, ¿quiere reportarla?',
            [
                {text: 'Cancelar', style: 'cancel'},
                {
                        text: 'Reportar', style: 'destructive', onPress: async () => {
                        try {
                            await reportarResena(resena.id);
                            await cargar();
                        } catch (error) {
                            Alert.alert('No se puedo reportar', error instanceof Error ? error.message : 'Intente nuevamente.');
                        }
                    },
                },
            ],
        );
    }

    async function enviarRespuesta(resena: Resena) {
        if (!comercioId) return;

        const limpia = texto.trim();
        if (!limpia) {
            setErrorRespuesta('Escriba una respuesta.');
            return;
        }

        setEnviando(true);
        setErrorRespuesta(null);
        try {
            await responderResena(comercioId, resena.id, limpia);
            cancelarRespuesta();
            await cargar();
        } catch (error) {
            setErrorRespuesta(error instanceof Error ? error.message : 'No se pudo enviar la respuesta.');
        } finally {
            setEnviando(false);
        }
    }

    if (cargando) {
        return <EstadoPantalla cargando titulo="Cargando reseñas" detalle="Espere un momento..."/>;
    }

    if (error) {
        return (<EstadoPantalla titulo="No se pudieron cargar tus reseñas" detalle="Revisa la conexión e intenta nuevamente." textoBoton="Reintentar" onPress={cargar}/>);
    }

    const sinResponder = resenas.filter((resena) => resena.respuesta === null).length;
    const visibles = filtro === 'sinResponder' ? resenas.filter((resena) => resena.respuesta === null) : resenas;

    return (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList style={styles.lista} contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]} data={visibles} keyExtractor={(resena) => resena.id} keyboardShouldPersistTaps="handled" extraData={{ abiertaId, texto, enviando, errorRespuesta }}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            
            ListHeaderComponent={
            <View style={styles.encabezado}>
                <Text style={styles.resumen}>
                {resenas.length} reseñas {sinResponder} sin responder
                </Text>

                <View style={styles.chips}>
                <ChipFiltro
                    texto="Todas"
                    seleccionado={filtro === 'todas'}
                    onPress={() => setFiltro('todas')}
                />
                <ChipFiltro
                    texto="Sin responder"
                    seleccionado={filtro === 'sinResponder'}
                    onPress={() => setFiltro('sinResponder')}
                />
                </View>
            </View>
            }

            ListEmptyComponent={
            <Text style={styles.vacio}>
                {filtro === 'sinResponder' ? 'No hay reseñas sin responder.' : 'Todavía no tienes reseñas.'}
            </Text>
            } renderItem={({ item: resena }) => (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                <Text style={styles.nombre}>{resena.usuarioNombre}</Text>
                <Text style={styles.estrellas}>
                    {'★'.repeat(resena.estrellas)}
                    {'☆'.repeat(5 - resena.estrellas)}
                </Text>
                </View>
                <Text style={styles.fecha}>{formatearFechaArgentina(resena.creadaEn)}</Text>
                <Text style={styles.comentario}>{resena.comentario}</Text>

                {resena.respuesta !== null ? (
                <View style={styles.respuesta}>
                    <Text style={styles.respuestaEtiqueta}>Tu respuesta</Text>
                    <Text style={styles.respuestaTexto}>{resena.respuesta}</Text>
                </View>
                ) : abiertaId === resena.id ? (
                <View style={styles.formulario}>
                    <TextInput
                    style={styles.input}
                    value={texto}
                    onChangeText={setTexto}
                    placeholder="Escriba su respuesta"
                    multiline
                    maxLength={1000}
                    autoFocus
                    />
                    <Text style={styles.ayuda}>Solo es posible responder una vez y luego no se podrá editar esta respuesta.</Text>
                    {errorRespuesta && <Text style={styles.error}>{errorRespuesta}</Text>}
                    <View style={styles.acciones}>
                    <Pressable
                        accessibilityRole="button"
                        disabled={enviando}
                        onPress={cancelarRespuesta}
                        style={({ pressed }) => [styles.accion, pressed && { opacity: 0.8 }]}
                    >
                        <Text style={styles.accionTexto}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        disabled={enviando}
                        onPress={() => enviarRespuesta(resena)}
                        style={({ pressed }) => [
                        styles.accion,
                        styles.accionPrimaria,
                        (pressed || enviando) && { opacity: 0.7 },
                        ]}
                    >
                        <Text style={[styles.accionTexto, styles.accionPrimariaTexto]}>
                        {enviando ? 'Enviando...' : 'Enviar'}
                        </Text>
                    </Pressable>
                    </View>
                </View>
                ) : (
                <Pressable
                    accessibilityRole="button"
                    onPress={() => abrirRespuesta(resena.id)}
                    style={({ pressed }) => [styles.botonResponder, pressed && { opacity: 0.8 }]}
                >
                    <Text style={styles.accionTexto}>Responder</Text>
                </Pressable>
                )}

                {resena.reportada ? (
                    <Text style={styles.reportadaTexto}>Reportada, en revisión.</Text>
                ) : (
                    <Pressable accessibilityRole="button" onPress={() => confirmarReporte(resena)} style={({pressed}) => [styles.reportar, pressed && {opacity: 0.8}]}>
                        <Text style={styles.reportarTexto}>Reportar reseña</Text>
                    </Pressable>
                )}
            </View>
            )}
        />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    lista: { backgroundColor: '#F3F6FC' },
    content: { padding: 20 },
    encabezado: { gap: 12, marginBottom: 14 },
    resumen: { fontSize: 16, fontWeight: '700', color: '#172E62' },
    chips: { flexDirection: 'row', gap: 8 },
    separador: { height: 14 },
    vacio: { fontSize: 14, color: '#64748B' },
    card: { padding: 16, gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 18 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    nombre: { flex: 1, fontSize: 16, fontWeight: '700', color: '#172E62' },
    estrellas: { fontSize: 15, color: '#F59E0B' },
    fecha: { fontSize: 12, color: '#94A3B8' },
    comentario: { fontSize: 14, color: '#334155', lineHeight: 20 },
    respuesta: { marginTop: 8, padding: 12, gap: 4, backgroundColor: '#F0F5FF', borderRadius: 12 },
    respuestaEtiqueta: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#2455B8' },
    respuestaTexto: { fontSize: 14, color: '#334155', lineHeight: 20 },
    formulario: { marginTop: 8, gap: 8 },
    input: { minHeight: 90, padding: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, fontSize: 15, textAlignVertical: 'top', color: '#0F172A' },
    ayuda: { fontSize: 12, color: '#64748B' },
    error: { fontSize: 13, color: '#B91C1C' },
    acciones: { flexDirection: 'row', gap: 10 },
    accion: { flex: 1, minHeight: 44, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    accionPrimaria: { backgroundColor: '#2455B8', borderColor: '#2455B8' },
    accionTexto: { fontSize: 14, fontWeight: '600', color: '#2455B8' },
    accionPrimariaTexto: { color: '#FFFFFF' },
    botonResponder: { minHeight: 44, marginTop: 8, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    reportar: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
    reportarTexto: { fontSize: 13, fontWeight: '600', color: '#B91C1C' },
    reportadaTexto: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
});