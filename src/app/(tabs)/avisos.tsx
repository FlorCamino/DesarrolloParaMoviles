import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChipFiltro } from '@/components/chip-filtro';
import { usePromociones } from '@/contexts/promociones-context';
import { avisosRequierenBuildDesarrollo } from '@/services/notificaciones';

export default function PreferenciasScreen() {
  const {
    rubros, comercios, preferencias,
    alternarRubroInteres, alternarComercioFavorito, cambiarAvisosActivos,
  } = usePromociones();

  async function cambiarAvisos(valor: boolean) {
    const aplicado = await cambiarAvisosActivos(valor);
    if (valor && !aplicado) {
      if (avisosRequierenBuildDesarrollo()) {
        Alert.alert(
          'Avisos no disponibles en Expo Go',
          'Podés probar todas las pantallas. Para probar las notificaciones en Android necesitás la APK de desarrollo.',
        );
        return;
      }
      Alert.alert(
        'Permiso no concedido',
        'Podés habilitar las notificaciones desde la configuración del teléfono.',
      );
    }
  }

  const favoritos = comercios.filter((item) => preferencias.comerciosFavoritos.includes(item.id));

  return (
    <SafeAreaView style={styles.segura}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.sobretitulo}>PREFERENCIAS</Text>
        <Text style={styles.titulo}>Mis avisos</Text>
        <Text style={styles.bajada}>Elegí qué promociones te interesan y cuándo recibir recordatorios.</Text>

        <View style={styles.bloque}>
          <View style={styles.filaSwitch}>
            <View style={styles.textoSwitch}>
              <Text style={styles.subtitulo}>Avisos de promociones</Text>
              <Text style={styles.detalle}>Nuevas promociones relevantes y guardadas por vencer.</Text>
            </View>
            <Switch
              value={preferencias.avisosActivos}
              onValueChange={cambiarAvisos}
              trackColor={{ false: '#CBD5E1', true: '#90CDF4' }}
              thumbColor={preferencias.avisosActivos ? '#153E75' : '#F8FAFC'}
            />
          </View>
        </View>

        <Text style={styles.seccion}>Rubros de interés</Text>
        <Text style={styles.ayuda}>La app compara estos rubros con cada nueva promoción.</Text>
        <View style={styles.chipsEnvueltos}>
          {rubros.map((rubro) => (
            <ChipFiltro
              key={rubro.id}
              texto={rubro.nombre}
              seleccionado={preferencias.rubrosDeInteres.includes(rubro.id)}
              onPress={() => alternarRubroInteres(rubro.id)}
            />
          ))}
        </View>

        <Text style={styles.seccion}>Comercios favoritos</Text>
        <Text style={styles.ayuda}>También recibirás avisos cuando un favorito publique una promoción.</Text>
        {favoritos.length === 0 ? (
          <Text style={styles.vacio}>No seleccionaste comercios favoritos.</Text>
        ) : favoritos.map((comercio) => (
          <View key={comercio.id} style={styles.favorito}>
            <View style={styles.favoritoTexto}>
              <Text style={styles.nombreComercio}>{comercio.nombre}</Text>
              <Text style={styles.direccion}>{comercio.direccion}</Text>
            </View>
            <Pressable onPress={() => alternarComercioFavorito(comercio.id)}>
              <Text style={styles.quitar}>Quitar</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.explicacion}>
          <Text style={styles.explicacionTitulo}>¿Qué se guarda en el teléfono?</Text>
          <Text style={styles.explicacionTexto}>
            Promociones guardadas, favoritos, rubros de interés, estado de avisos y la última lista consultada. Se usa expo-sqlite/kv-store.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segura: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { padding: 18, paddingBottom: 40 },
  sobretitulo: { color: '#2B6CB0', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  titulo: { color: '#0F172A', fontSize: 32, fontWeight: '900', marginTop: 2 },
  bajada: { color: '#64748B', lineHeight: 21, marginTop: 4, marginBottom: 18 },
  bloque: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16 },
  filaSwitch: { flexDirection: 'row', alignItems: 'center' },
  textoSwitch: { flex: 1, paddingRight: 12 },
  subtitulo: { color: '#0F172A', fontWeight: '800', fontSize: 17 },
  detalle: { color: '#64748B', marginTop: 4, lineHeight: 19 },
  seccion: { color: '#0F172A', fontSize: 20, fontWeight: '900', marginTop: 24 },
  ayuda: { color: '#64748B', marginTop: 5, marginBottom: 12, lineHeight: 19 },
  chipsEnvueltos: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 9 },
  vacio: { color: '#64748B', fontStyle: 'italic', paddingVertical: 12 },
  favorito: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, marginBottom: 9 },
  favoritoTexto: { flex: 1 },
  nombreComercio: { color: '#0F172A', fontWeight: '800' },
  direccion: { color: '#64748B', fontSize: 13, marginTop: 3 },
  quitar: { color: '#B91C1C', fontWeight: '800' },
  explicacion: { backgroundColor: '#EAF4FF', borderRadius: 14, padding: 15, marginTop: 24 },
  explicacionTitulo: { color: '#153E75', fontWeight: '900' },
  explicacionTexto: { color: '#334E68', lineHeight: 20, marginTop: 5 },
});
