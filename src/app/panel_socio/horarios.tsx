import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EstadoPantalla } from "@/components/estado-pantalla";
import { useAuth } from "@/hooks/use-auth";
import { editarMisHorarios, obtenerMiComercio } from "@/services/panel-comercio";
import type { Horario } from "@/types/business";

const DIAS: {dia: Horario['dia']; nombre: string} [] = [
    { dia: 0, nombre: 'Domingo'},
    { dia: 1, nombre: 'Lunes'},
    { dia: 2, nombre: 'Martes'},
    { dia: 3, nombre: 'Miercoles'},
    { dia: 4, nombre: 'Jueves'},
    { dia: 5, nombre: 'Viernes'},
    { dia: 6, nombre: 'Sabado'},
];

function formatearHora(texto: string): string {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);
    return digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos;
}

export default function HorariosScreen() {
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();
    const comercioId = usuario?.comercioId ?? null;

    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!comercioId) return;

        obtenerMiComercio(comercioId)
            .then((comercio) => setHorarios(comercio.horarios.map((tramo)=> ({...tramo}))))
            .catch(() => setErrorCarga(true))
            .finally(() => setCargando(false));
    }, [comercioId]);

    function agregarTramo(dia: Horario['dia']) {
        setHorarios((actuales) => [...actuales, {dia, abre: '09:00', cierra: '18:00'}]);
    }

    function quitarTramo(indice: number) {
        setHorarios((actuales) => actuales.filter((_, i) => i !== indice));
    }

    function cambiarHora(indice: number, campo: 'abre' | 'cierra', texto: string) {
        const valor = formatearHora(texto);
        setHorarios((actuales) => 
            actuales.map((tramo, i) => {
                if (i !== indice) return tramo;
                return campo === 'abre' ? {...tramo, abre: valor} : {...tramo, cierra: valor};
            }),
        );
    }

    async function guardar() {
        if (!comercioId) return;
        setError(null);
        setGuardando(true);

        try {
            await editarMisHorarios(comercioId, horarios);
            Alert.alert('Listo', 'Los horarios se guardaron correctamente.', [{text: 'OK', onPress: () => router.back()}]);
        } catch (error) {
            setError(error instanceof Error ? error.message: 'No se han podido guardar los horarios.');
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return <EstadoPantalla cargando titulo="Cargando horarios" detalle="Espere un momento..."/>;
    }

    if (errorCarga) {
        return (<EstadoPantalla titulo="No se pudieron cargar tus horarios." detalle="Vuelve atrás e intenta nuevamente." textoBoton="Volver" onPress={() => router.back()}/>);
    }

    return (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
            <ScrollView contentContainerStyle={[styles.content, {paddingBottom: 20 + insets.bottom}]} keyboardShouldPersistTaps="handled">
                <Text style={styles.ayuda}>Cada día puede tener más de un tramo (ej: mañana y tarde). Los días sin tramos aparecen como Cerrado.</Text>

                {DIAS.map(({dia, nombre}) => {
                    const tramosDelDia = horarios
                        .map((tramo, indice) => ({tramo, indice}))
                        .filter(({tramo}) => tramo.dia === dia);
                    
                    return (
                        <View key={dia} style={styles.card}>
                            <View style={styles.cabecera}>
                                <Text style={styles.dia}>{nombre}</Text>
                                <Pressable accessibilityRole="button" onPress={() => agregarTramo(dia)} style={({pressed}) => [styles.botonAgregar, pressed && {opacity: 0.8}]}>
                                    <Text style={styles.botonAgregarTexto}>Nuevo tramo</Text>
                                </Pressable>
                            </View>

                            {tramosDelDia.length === 0 && <Text style={styles.cerrado}>Cerrado</Text>}
                            {tramosDelDia.map(({tramo, indice}) => (
                                <View key={indice} style={styles.tramo}>
                                    <TextInput style={styles.inputHora} value={tramo.abre} onChangeText={(texto) => cambiarHora(indice, 'abre', texto)} placeholder="08:00" keyboardType="number-pad" maxLength={5}/>
                                    
                                    <Text style={styles.separador}>a</Text>
                                    
                                    <TextInput style={styles.inputHora} value={tramo.cierra} onChangeText={(texto) => cambiarHora(indice, 'cierra', texto)} placeholder="12:00" keyboardType="number-pad" maxLength={5}></TextInput>

                                    <Pressable accessibilityRole="button" onPress={() => quitarTramo(indice)} style={({pressed}) => [styles.botonQuitar, pressed && {opacity: 0.8}]}>
                                        <Text style={styles.botonQuitarTexto}>Quitar</Text>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    );
                })}

                {error && <Text style={styles.error}>{error}</Text>}

                <Pressable accessibilityRole="button" disabled={guardando} onPress={guardar} style={({pressed}) => [styles.boton, (pressed || guardando) && {opacity: 0.8}]}>
                    <Text style={styles.botonTexto}>{guardando ? 'Guardando...' : 'Guardar horarios'}</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 12, backgroundColor: '#F3F6FC' },
  ayuda: { fontSize: 13, color: '#536582' },
  card: { padding: 14, gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 16 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dia: { fontSize: 16, fontWeight: '700', color: '#172E62' },
  botonAgregar: { minHeight: 36, paddingHorizontal: 12, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 10, justifyContent: 'center' },
  botonAgregarTexto: { fontSize: 13, fontWeight: '600', color: '#2455B8' },
  cerrado: { fontSize: 14, color: '#94A3B8' },
  tramo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputHora: { flex: 1, minHeight: 46, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 10, fontSize: 15, textAlign: 'center', color: '#0F172A' },
  separador: { fontSize: 14, color: '#536582' },
  botonQuitar: { minHeight: 46, paddingHorizontal: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, justifyContent: 'center' },
  botonQuitarTexto: { fontSize: 13, fontWeight: '600', color: '#B91C1C' },
  error: { fontSize: 14, color: '#B91C1C' },
  boton: { minHeight: 52, marginTop: 8, backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  botonTexto: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});