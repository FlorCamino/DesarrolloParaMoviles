import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from '@/hooks/use-auth';


const SECCIONES = [
    {titulo: 'Promociones', detalle: 'Ver, crear y editar promociones.', ruta: '/panel_socio/promociones'},
    {titulo: 'Validar código QR', detalle: 'Escanear el código QR del cliente.', ruta: '/panel_socio/validar_codigo'},
    {titulo: 'Mi comercio', detalle: 'Contacto, medios de pago y fotos.', ruta: '/panel_socio/mi_comercio'},
    {titulo: 'Horarios', detalle: 'Horarios de atención', ruta: '/panel_socio/horarios'},
    {titulo: 'Reseñas', detalle: 'Ver y responder a reseñas de los clientes.', ruta: '/panel_socio/resenas'},
] as const;

export default function PanelScreen() {
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();

    if (!usuario || usuario.rol !== 'comercio') {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: 20 + insets.bottom}]}>
            <Text style={styles.saludo}>Hola, {usuario.nombre}</Text>
            {SECCIONES.map((seccion) => (
                <Pressable
                    key={seccion.titulo}
                    disabled={seccion.ruta === null}
                    onPress={() => seccion.ruta && router.push(seccion.ruta)}
                    style={({pressed}) => [styles.card, pressed && {opacity: 0.8}]}>
                        <Text style={styles.titulo}>{seccion.titulo}</Text>
                        <Text style={styles.detalle}>{seccion.detalle}</Text>
                        {seccion.ruta === null && <Text style={styles.proximamente}>Próximamente</Text>}
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {padding: 20, gap: 14, backgroundColor: '#F3F6FC'},
    saludo: {fontSize: 22, fontWeight: '800', color: '#172E62'},
    card: {padding: 18, gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 18},
    titulo: {fontSize: 18, fontWeight: '700', color: '#172E62'},
    detalle: {fontSize: 14, color: '#536582'},
    proximamente: { fontSize: 12, fontWeight: '600', color: '#94A3B8'}
});

