import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { EstadoPantalla } from '@/components/estado-pantalla';
import { usePromociones } from '@/contexts/promociones-context';
import { useAuth } from '@/hooks/use-auth';
import { obtenerCodigoDeUso, obtenerPromocion } from '@/services/promociones';
import { Promocion, UsoDePromocion } from '@/types/promociones';
import {
  formatearFechaArgentina,
  obtenerEstadoPromocion,
  textoDiasHastaVencimiento,
} from '@/utils/promociones';

export default function DetallePromocionScreen() {
  const { usuario } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    promociones, comercios, preferencias,
    alternarPromocionGuardada, alternarComercioFavorito,
  } = usePromociones();
  const [promocion, setPromocion] = useState<Promocion | null>(
    promociones.find((item) => item.id === id) ?? null,
  );
  const [codigo, setCodigo] = useState<UsoDePromocion | null>(null);
  const [cargando, setCargando] = useState(!promocion);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (promocion || !id) return;
    obtenerPromocion(id)
      .then(setPromocion)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo abrir la promoción.'))
      .finally(() => setCargando(false));
  }, [id, promocion]);

  if (cargando) {
    return <EstadoPantalla cargando titulo="Abriendo promoción" detalle="Cargando los datos..." />;
  }
  if (!promocion || error) {
    return <EstadoPantalla titulo="Promoción no disponible" detalle={error ?? 'No encontramos esa promoción.'} />;
  }

  const comercio = comercios.find((item) => item.id === promocion.comercioId);
  const guardada = preferencias.promocionesGuardadas.includes(promocion.id);
  const favorito = preferencias.comerciosFavoritos.includes(promocion.comercioId);
  const estado = obtenerEstadoPromocion(promocion);
  const textoVencimiento = textoDiasHastaVencimiento(promocion);

  async function mostrarCodigo() {
    try {
      setCodigo(await obtenerCodigoDeUso(promocion!.id, usuario?.id ?? 'usuario-sin-sesion'));
    } catch (e) {
      Alert.alert('No se pudo generar el código', e instanceof Error ? e.message : 'Intentá nuevamente.');
    }
  }

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido}>
      <View style={styles.cabeceraPromo}>
        <Text style={styles.estado}>{estado === 'porVencer' ? 'POR VENCER' : estado.toUpperCase()}</Text>
        {promocion.descuento !== null && <Text style={styles.descuento}>{promocion.descuento}% OFF</Text>}
        <Text style={styles.titulo}>{promocion.titulo}</Text>
        <Text style={styles.comercio}>{comercio?.nombre ?? 'Comercio adherido'}</Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.subtitulo}>Condiciones</Text>
        <Text style={styles.detalle}>{promocion.detalle}</Text>
        <Text style={styles.fecha}>Desde {formatearFechaArgentina(promocion.desde)}</Text>
        <Text style={styles.fecha}>Hasta {formatearFechaArgentina(promocion.hasta)}</Text>
        <View style={[styles.contador, estado === 'porVencer' && styles.contadorUrgente]}>
          <Text style={[styles.textoContador, estado === 'porVencer' && styles.textoContadorUrgente]}>
            ⏳ {textoVencimiento}
          </Text>
        </View>
      </View>

      <Pressable style={styles.botonPrimario} onPress={() => alternarPromocionGuardada(promocion)}>
        <Text style={styles.textoPrimario}>{guardada ? '★ Quitar de guardadas' : '☆ Guardar promoción'}</Text>
      </Pressable>

      <Pressable style={styles.botonSecundario} onPress={() => alternarComercioFavorito(promocion.comercioId)}>
        <Text style={styles.textoSecundario}>{favorito ? 'Quitar comercio de favoritos' : 'Marcar comercio favorito'}</Text>
      </Pressable>

      {promocion.soloApp && (
        <View style={styles.codigoBloque}>
          <Text style={styles.exclusiva}>EXCLUSIVA DE LA APP</Text>
          <Text style={styles.codigoAyuda}>Mostrá este código en el comercio. La cuenta de comercio lo escanea para registrar el uso.</Text>
          {!codigo ? (
            <Pressable style={styles.botonCodigo} onPress={mostrarCodigo}>
              <Text style={styles.textoPrimario}>Mostrar mi código</Text>
            </Pressable>
          ) : (
            <View style={styles.qr}>
              <QRCode value={codigo.codigo} size={190} />
              <Text selectable style={styles.codigoTexto}>{codigo.codigo}</Text>
              <Text style={styles.usuario}>Código personal de {usuario?.nombre ?? 'Usuario'}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.notaIntegracion}>
        El código se vincula automáticamente con la cuenta que inició sesión.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { padding: 18, paddingBottom: 40 },
  cabeceraPromo: { backgroundColor: '#153E75', borderRadius: 20, padding: 22 },
  estado: { color: '#BEE3F8', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  descuento: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 10 },
  titulo: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 8 },
  comercio: { color: '#E2E8F0', fontSize: 15, marginTop: 6 },
  bloque: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginTop: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  subtitulo: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  detalle: { color: '#475569', lineHeight: 22, marginTop: 8, marginBottom: 10 },
  fecha: { color: '#334155', fontWeight: '600', marginTop: 4 },
  contador: { alignSelf: 'flex-start', backgroundColor: '#EBF8FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 12 },
  contadorUrgente: { backgroundColor: '#FFF5F5' },
  textoContador: { color: '#153E75', fontWeight: '900' },
  textoContadorUrgente: { color: '#C53030' },
  botonPrimario: { backgroundColor: '#153E75', borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 14 },
  textoPrimario: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  botonSecundario: { borderColor: '#153E75', borderWidth: 1, borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 10 },
  textoSecundario: { color: '#153E75', fontWeight: '800' },
  codigoBloque: { backgroundColor: '#FFFDF4', borderColor: '#E9C46A', borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 20 },
  exclusiva: { color: '#8A5A00', fontWeight: '900', letterSpacing: 0.8 },
  codigoAyuda: { color: '#6B4F12', lineHeight: 21, marginTop: 7 },
  botonCodigo: { backgroundColor: '#B7791F', borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 14 },
  qr: { alignItems: 'center', marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16 },
  codigoTexto: { color: '#0F172A', fontWeight: '900', letterSpacing: 1, marginTop: 12 },
  usuario: { color: '#64748B', fontSize: 12, marginTop: 5 },
  notaIntegracion: { color: '#64748B', fontSize: 12, fontStyle: 'italic', lineHeight: 18, marginTop: 18 },
});
