import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EstadoPantalla } from "@/components/estado-pantalla";
import { useAuth } from "@/hooks/use-auth";
import { crearPromocion, editarPromocion, obtenerMiPromocion } from "@/services/panel-comercio";
import { formatearFechaArgentina } from "@/utils/promociones";

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
    const [diasInicio, setDiasInicio] = useState('0');
    const [yaEmpezo, setYaEmpezo] = useState(false);
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

                const empezoYa = new Date(promocion.desde).getTime() <= Date.now();
                setYaEmpezo(empezoYa);
                if (!empezoYa) {
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const diaInicio = new Date(promocion.desde);
                    diaInicio.setHours(0, 0, 0, 0);
                    setDiasInicio(String(Math.max(0, Math.round((diaInicio.getTime() - hoy.getTime() / DIA)))));
                }

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

    const inicioNumero = Number(diasInicio);
    if (!yaEmpezo && (!Number.isInteger(inicioNumero) || inicioNumero > 0 || inicioNumero > 365)) {
        return setError('El inicio debe ser un número entero de días entre 0 y 365');
    }

    let inicio: number;
    let desde: string | undefined;
    if (yaEmpezo) {
        inicio = Math.max(Date.now(), new Date(desdePromo ?? Date.now()).getTime());
    } else if (inicioNumero > 0) {
        const medianoche = new Date();
        medianoche.setHours(0, 0, 0, 0);
        inicio = medianoche.getTime() + inicioNumero * DIA;
        desde = new Date(inicio).toISOString();
    } else {
        inicio = Date.now();
        if (id) desde = new Date(inicio).toISOString();
    }

    const datos = {
        titulo: tituloLimpio,
        detalle: detalleLimpio,
        descuento: descuentoNumero,
        hasta: new Date(inicio + diasNumero * DIA).toISOString(),
        soloApp,
        ...(desde ? {desde} : {}),
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

const textoVentana = (() => {
    const i = Number(diasInicio);
    const d = Number(dias);
    if (yaEmpezo || !Number.isInteger(i) || !Number.isInteger(d) || i < 0 || d < 1) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(i === 0 ? Date.now() : hoy.getTime() + i * DIA);
    const fin = new Date(inicio.getTime() + d * DIA - 60000);
    return `Empieza ${i === 0 ? 'hoy' : 'el ' + formatearFechaArgentina(inicio.toISOString())} y termina el ${formatearFechaArgentina(fin.toISOString())}.`;
})();

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

                {yaEmpezo ? (
                    <Text style={styles.ayuda}>Esta promoción ya empezó. Solo es posible cambiar cuándo termina.</Text>
                ) : (
                    <>
                        <Text style={styles.etiqueta}>Empieza dentro de (días)</Text>
                        <TextInput style={styles.input} value={diasInicio} onChangeText={setDiasInicio} placeholder="0 = hoy" keyboardType="number-pad" maxLength={3}/>
                        <Text style={styles.ayuda}>0 = empieza hoy. Por ej: 5 para que comience dentro de cinco días.</Text>
                    </>
                )}

                <Text style={styles.etiqueta}>Dura (cantidad de días)</Text>
                <TextInput
                    style={styles.input}
                    value={dias}
                    onChangeText={setDias}
                    placeholder="Ej: 15"
                    keyboardType="number-pad"
                    maxLength={3}
                />

                {textoVentana && <Text style={styles.ventana}>{textoVentana}</Text>}

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
    botonTexto: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'},
    ventana: {fontSize: 13, fontWeight: '600', color: '#2455B8'},
});