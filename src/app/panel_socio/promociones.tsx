import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EstadoPantalla } from "@/components/estado-pantalla";
import { useAuth } from "@/hooks/use-auth";
import { darDeBajaPromocion, listarMisPromociones } from "@/services/panel-comercio";
import type { EstadoPromocion, Promocion } from "@/types/promociones";
import { formatearFechaArgentina, obtenerEstadoPromocion } from "@/utils/promociones";


const ETIQUETAS: Record<EstadoPromocion, string> = {
    vigente: 'Vigente',
    proxima: 'Próxima',
    porVencer: 'Por vencer',
    vencida: 'Vencida',
};

const COLORES: Record<EstadoPromocion, string> = {
    vigente: '#10B981',
    proxima: '#2455B8',
    porVencer: '#F59E0B',
    vencida: '#94A3B8',
};

export default function MisPromocionesScreen() {
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();
    const comercioId = usuario?.comercioId ?? null;

    const [promociones, setPromociones] = useState<Promocion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    const cargar = useCallback(async () => {
        if (!comercioId) return;
        setError(false);
        try {
            setPromociones(await listarMisPromociones(comercioId));
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

    function confirmarBaja(promocion: Promocion) {
        Alert.alert('Dar de baja', `¿Quiere dar de baja "${promocion.titulo}"? Dejara de mostrarse a los vecinos.`, [
            {text: 'Cancelar', style: 'cancel'},
            {text: 'Dar de baja', style: 'destructive',
                onPress: async () => {
                    if (!comercioId) return;
                    try {
                        await darDeBajaPromocion(comercioId, promocion.id);
                        await cargar();
                    } catch (error) {
                        Alert.alert('No se pudo dar de baja la promoción.', error instanceof Error ? error.message : 'Intenta nuevamente');
                    }
                },
            },
        ]);
    }

    if (cargando) {
        return <EstadoPantalla cargando titulo="Cargando promociones" detalle="Espere un momento..." />;
    }

    if (error) {
        return(
            <EstadoPantalla
                titulo="No se pudieron cargar tus promociones"
                detalle="Revisa tu conexión e intenta nuevamente."
                textoBoton="Reintentar"
                onPress={cargar}
            />
        );
    }

    const usosTotales = promociones.reduce((total, promocion) => total + promocion.usos, 0);
    const activas = promociones.filter((promocion) => {
        const estado = obtenerEstadoPromocion(promocion);
        return estado === 'vigente' || estado === 'porVencer';
    }).length;
    const masUsada = [...promociones].sort((a, b) => b.usos - a.usos)[0];

    return (
        <FlatList
            style={styles.lista}
            contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}
            data={promociones}
            keyExtractor={(promocion) => promocion.id}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.encabezado}>
                    <Pressable accessibilityRole="button" onPress={() => router.push('/panel_socio/promocion_formulario')} style={({pressed}) => [styles.botonNueva, pressed && {opacity: 0.8}]}>
                        <Text style={styles.botonNuevaTexto}>Nueva promoción</Text>
                    </Pressable>

                    <View style={styles.fila}>
                        <View style={styles.estadistica}>
                            <Text style={styles.estadisticaNumero}>{usosTotales}</Text>
                            <Text style={styles.estadisticaTexto}>Usos totales</Text>
                        </View>
                        <View style={styles.estadistica}>
                            <Text style={styles.estadisticaNumero}>{activas}</Text>
                            <Text style={styles.estadisticaTexto}>Activas actualmente</Text>
                        </View>
                    </View>

                    {masUsada && (
                        <View style={styles.destacada}>
                            <Text style={styles.destacadaEtiqueta}>Más usada</Text>
                            <Text style={styles.destacadaTitulo}>{masUsada.titulo}</Text>
                            <Text style={styles.destacadaUsos}>{masUsada.usos}</Text>
                        </View>
                    )}

                    <Text style={styles.seccion}>Todas mis promociones</Text>
                </View>
            }
            ListEmptyComponent={<Text style={styles.vacio}>Aún no has creado una promoción.</Text>}
            renderItem={({ item: promocion }) => {
                const estado = obtenerEstadoPromocion(promocion);
                const etiqueta = promocion.activa ? ETIQUETAS[estado] : 'Dada de baja';
                const color = promocion.activa ? COLORES[estado] : '#94A3B8'
                const puedeEditar = promocion.activa && estado !== 'vencida';

                return (
                    <View style={styles.card}>
                        <View style={styles.cardTop}>
                            <Text style={styles.titulo}>{promocion.titulo}</Text>
                            <View style={[styles.badge, {backgroundColor: color }]}>
                                <Text style={styles.badgeTexto}>{etiqueta}</Text>
                            </View>
                        </View>

                        <Text style={styles.detalle}>
                            {promocion.descuento !== null ? `${promocion.descuento}% de descuento.` : ''}
                            {promocion.soloApp ? 'Con código QR' : 'Sin código'}
                        </Text>
                        <Text style={styles.detalle}>
                            Del {formatearFechaArgentina(promocion.desde)} al {formatearFechaArgentina(promocion.hasta)}
                        </Text>
                        <Text style={styles.usos}>{promocion.usos}</Text>

                        {(puedeEditar || promocion.activa) && (
                        <View style={styles.acciones}>
                            {puedeEditar && (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() =>
                                router.push({ pathname: '/panel_socio/promocion_formulario', params: { id: promocion.id } })
                                }
                                style={({ pressed }) => [styles.accion, pressed && { opacity: 0.8 }]}
                            >
                                <Text style={styles.accionTexto}>Editar</Text>
                            </Pressable>
                            )}
                            {promocion.activa && (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => confirmarBaja(promocion)}
                                style={({ pressed }) => [styles.accion, styles.accionPeligro, pressed && { opacity: 0.8 }]}
                            >
                                <Text style={[styles.accionTexto, styles.accionPeligroTexto]}>Dar de baja</Text>
                            </Pressable>
                            )}
                        </View>)}
                    </View>
                );
            }}
        />
    );
}




const styles = StyleSheet.create({
lista: { backgroundColor: '#F3F6FC' },
  content: { padding: 20 },
  encabezado: { gap: 14, marginBottom: 14 },
  separador: { height: 14 },
  botonNueva: { minHeight: 50, backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  botonNuevaTexto: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  fila: { flexDirection: 'row', gap: 12 },
  estadistica: { flex: 1, padding: 16, gap: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 18 },
  estadisticaNumero: { fontSize: 28, fontWeight: '800', color: '#2455B8' },
  estadisticaTexto: { fontSize: 13, color: '#536582' },
  destacada: { padding: 18, gap: 4, backgroundColor: '#172E62', borderRadius: 18 },
  destacadaEtiqueta: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#B9CEF5' },
  destacadaTitulo: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  destacadaUsos: { fontSize: 14, color: '#D9E7FF' },
  seccion: { fontSize: 18, fontWeight: '700', color: '#172E62', marginTop: 6 },
  vacio: { fontSize: 14, color: '#64748B' },
  card: { padding: 16, gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  titulo: { flex: 1, fontSize: 16, fontWeight: '700', color: '#172E62' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTexto: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  detalle: { fontSize: 13, color: '#536582' },
  usos: { fontSize: 14, fontWeight: '700', color: '#2455B8' },
  acciones: { flexDirection: 'row', gap: 10, marginTop: 8 },
  accion: { flex: 1, minHeight: 44, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  accionTexto: { fontSize: 14, fontWeight: '600', color: '#2455B8' },
  accionPeligro: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  accionPeligroTexto: { color: '#B91C1C' },
});