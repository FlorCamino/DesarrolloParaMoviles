import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EstadoPantalla } from "@/components/estado-pantalla";
import { useAuth } from "@/hooks/use-auth";
import { crearPromocion, editarPromocion, obtenerMiPromocion } from "@/services/panel-comercio";

const DIA = 24 * 60 * 60 * 1000;


export default function PromocionFormularioScreen() {
    const {id} = useLocalSearchParams<{id?: string}>();
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();
    const comercioId = usuario?.comercioId ?? null;

    const [titulo, setTitulo] = useState('');
    const [detalle, setDetalle] = useState('');
    const [descuento, setDescuento] = useState('');
    const [dias, setDias] = useState('7');
    const [soloApp, setSoloApp] = useState(false);
    const [desdePromo, setDesdePromo] = useState<string | null>(null);

    const [cargando, setCargando] = useState(Boolean(id));
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !comercioId) return;

        obtenerMiPromocion(comercioId, id)
            .then((promocion) => {
                setTitulo(promocion.titulo);
                setDetalle(promocion.detalle);
                setDescuento(promocion.descuento === null ? '' : String(promocion.descuento));
                setSoloApp(promocion.soloApp);
                setDesdePromo(promocion.desde);

                const inicio = Math.max(Date.now(), new Date(promocion.desde).getTime());
                const diasRestantes = Math.ceil((new Date(promocion.hasta).getTime() - inicio) / DIA);
                setDias(String(Math.max(1, diasRestantes)));
            })
            .catch((error) => setError(error instanceof Error ? error.message : 'No se pudo cargar la promoción'))
            .finally(() => setCargando(false));
    }, [id, comercioId]);

async function guardar() {
    if (!comercioId) return;
    setError(null);

    const tituloLimpio = titulo.trim();
    const detalleLimpio = detalle.trim();

    if (!tituloLimpio) return setError('La promoción debe tener un título.');
    if (!detalleLimpio) return setError('La promoción debe tener una descripción.');

    let descuentoNumero: number | null = null;
    if (descuento.trim() !== '') {
        descuentoNumero = Number(descuento);
        if (!Number.isInteger(descuentoNumero) || descuentoNumero < 1 || descuentoNumero > 100) {
            return setError('El descuento debe ser un número entero entre 1 y 100.')
        }
    }

    const diasNumero = Number(dias);
    if (!Number.isInteger(diasNumero) || diasNumero < 1 || diasNumero > 365) {
        return setError('La duración debe ser un número entero de días entre 1 y 365.')
    }

    const inicio = desdePromo ? Math.max(Date.now(), new Date(desdePromo).getTime()) : Date.now();
    const datos = {
        titulo: tituloLimpio,
        detalle: detalleLimpio,
        descuento: descuentoNumero,
        hasta: new Date(inicio + diasNumero * DIA).toISOString(),
        soloApp,
    };

    setGuardando(true);
    try {
        if (id) {
            await editarPromocion(comercioId, id, datos);
        } else {
            await crearPromocion(comercioId, datos);
        }
        router.back();
    } catch (error) {
        setError (error instanceof Error ? error.message : 'No se puedo guardar la promoción.');
    } finally {
        setGuardando(false);
    }
}

if (cargando) {
    return <EstadoPantalla cargando titulo="Cargando promoción" detalle="Espere un momento..." />
}

return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: 20 + insets.bottom}]} keyboardShouldPersistTaps="handled">
            <Text style={styles.etiqueta}>Título</Text>
            <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ej: 25% en grifería"
                maxLength={80}
                />

                <Text style={styles.etiqueta}>Detalle</Text>
                <TextInput
                    style={[styles.input, styles.inputGrande]}
                    value={detalle}
                    onChangeText={setDetalle}
                    placeholder="Condiciones, días o límites, etc."
                    multiline
                    maxLength={300}
                />
                
                <Text style={styles.etiqueta}>Descuento %</Text>
                <TextInput
                    style={styles.input}
                    value={descuento}
                    onChangeText={setDescuento}
                    placeholder="Ej: 20"
                    keyboardType="number-pad"
                    maxLength={3}
                />

                <Text style={styles.etiqueta}>Dura (días desde hoy)</Text>
                <TextInput
                    style={styles.input}
                    value={dias}
                    onChangeText={setDias}
                    placeholder="Ej: 15"
                    keyboardType="number-pad"
                    maxLength={3}
                />

                <View style={styles.filaSwitch}>
                    <View style={styles.flex}>
                        <Text style={styles.etiqueta}>Requiere código QR</Text>
                        <Text style={styles.ayuda}>El cliente genera el código en la app y lo muestra en el mostrador.</Text>
                    </View>
                    <Switch value={soloApp} onValueChange={setSoloApp} />
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <Pressable accessibilityRole="button" disabled={guardando} onPress={guardar} style={({pressed}) => [styles.boton, (pressed || guardando) && {opacity: 0.7}]}>
                    <Text style={styles.botonTexto}>{guardando ? 'Guardando...' : id ? 'Guardar cambios' : 'Crear promoción'}</Text>
                </Pressable>
        </ScrollView>
    </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
    flex: {flex: 1},
    content: {padding: 20, gap: 8, backgroundColor: '#F3F6FC'},
    etiqueta: {fontSize: 14, fontWeight: '700', color: '#172E62', marginTop: 8},
    ayuda: {fontSize: 12, color: '#64748B'},
    input: {minHeight: 48, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, fontSize: 15, color: '#0F172A'},
    inputGrande: {minHeight: 96, paddingTop: 12, textAlignVertical: 'top'},
    filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8},
    error: {fontSize: 14, color: '#B91C1C', marginTop: 8},
    boton: {minHeight: 52, marginTop: 16, backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center', alignItems: 'center'},
    botonTexto: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'}
});