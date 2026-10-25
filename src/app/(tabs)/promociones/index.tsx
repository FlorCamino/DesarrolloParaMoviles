import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BannerConexion } from '@/components/banner-conexion';
import { ChipFiltro } from '@/components/chip-filtro';
import { EstadoPantalla } from '@/components/estado-pantalla';
import { TarjetaPromocion } from '@/components/tarjeta-promocion';
import { usePromociones } from '@/contexts/promociones-context';
import { FiltroEstado, ModoDemo } from '@/types/promociones';
import { promocionCoincideConFiltro } from '@/utils/promociones';

const filtros: { id: FiltroEstado; texto: string }[] = [
  { id: 'todas', texto: 'Todas' },
  { id: 'vigentes', texto: 'Vigentes' },
  { id: 'proximas', texto: 'Próximas' },
  { id: 'porVencer', texto: 'Por vencer' },
];

export default function PromocionesScreen() {
  const router = useRouter();
  const {
    promociones, rubros, comercios, preferencias, cargando, error,
    sinConexion, origenCache, actualizadoEn, cargar, alternarPromocionGuardada,
  } = usePromociones();
  const [filtro, setFiltro] = useState<FiltroEstado>('todas');
  const [rubroId, setRubroId] = useState<string>('todos');

  const promocionesFiltradas = useMemo(
    () => promociones.filter((promocion) => {
      const comercio = comercios.find((item) => item.id === promocion.comercioId);
      const coincideRubro = rubroId === 'todos' || comercio?.rubroId === rubroId;
      return coincideRubro && promocionCoincideConFiltro(promocion, filtro);
    }),
    [promociones, comercios, filtro, rubroId],
  );

  const ejecutarCaso = (modo: ModoDemo) => cargar(modo);

  return (
    <SafeAreaView style={styles.segura}>
      <FlatList
        data={promocionesFiltradas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contenido}
        refreshing={cargando}
        onRefresh={() => cargar('normal')}
        ListHeaderComponent={
          <>
            <View style={styles.encabezado}>
              <View style={styles.encabezadoTexto}>
                <Text style={styles.sobretitulo}>COMERCIO CERCA</Text>
                <Text style={styles.titulo}>Promociones</Text>
                <Text style={styles.bajada}>Beneficios de comercios de tu ciudad.</Text>
              </View>
              <Pressable
                style={styles.botonGuardadas}
                onPress={() => router.push('/(tabs)/promociones/guardadas')}
              >
                <Text style={styles.textoGuardadas}>★ Guardadas</Text>
              </Pressable>
            </View>

            <BannerConexion
              sinConexion={sinConexion}
              origenCache={origenCache}
              actualizadoEn={actualizadoEn}
            />

            <Text style={styles.etiqueta}>Estado</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaChips}>
              {filtros.map((item) => (
                <ChipFiltro
                  key={item.id}
                  texto={item.texto}
                  seleccionado={filtro === item.id}
                  onPress={() => setFiltro(item.id)}
                />
              ))}
            </ScrollView>

            <Text style={styles.etiqueta}>Rubro</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaChips}>
              <ChipFiltro texto="Todos" seleccionado={rubroId === 'todos'} onPress={() => setRubroId('todos')} />
              {rubros.map((rubro) => (
                <ChipFiltro
                  key={rubro.id}
                  texto={rubro.nombre}
                  seleccionado={rubroId === rubro.id}
                  onPress={() => setRubroId(rubro.id)}
                />
              ))}
            </ScrollView>

            {__DEV__ && (
              <View style={styles.panelPruebas}>
                <Text style={styles.pruebasTitulo}>Casos exigidos por la cátedra</Text>
                <View style={styles.pruebasFila}>
                  <Pressable onPress={() => ejecutarCaso('normal')}><Text style={styles.prueba}>Normal</Text></Pressable>
                  <Pressable onPress={() => ejecutarCaso('vacio')}><Text style={styles.prueba}>Vacío</Text></Pressable>
                  <Pressable onPress={() => ejecutarCaso('error')}><Text style={styles.prueba}>Error</Text></Pressable>
                </View>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TarjetaPromocion
            promocion={item}
            comercio={comercios.find((comercio) => comercio.id === item.comercioId)}
            guardada={preferencias.promocionesGuardadas.includes(item.id)}
            onAbrir={() => router.push({ pathname: '/(tabs)/promociones/[id]', params: { id: item.id } })}
            onGuardar={() => alternarPromocionGuardada(item)}
          />
        )}
        ListEmptyComponent={
          cargando ? (
            <EstadoPantalla cargando titulo="Buscando promociones" detalle="Consultando el servicio..." />
          ) : error ? (
            <EstadoPantalla titulo="No pudimos cargar" detalle={error} textoBoton="Reintentar" onPress={() => cargar('normal')} />
          ) : (
            <EstadoPantalla titulo="No hay promociones" detalle="Probá con otro estado o rubro." />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segura: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { padding: 18, paddingBottom: 36, flexGrow: 1 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  encabezadoTexto: { flex: 1, paddingRight: 10 },
  sobretitulo: { color: '#2B6CB0', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  titulo: { color: '#0F172A', fontSize: 32, fontWeight: '900', marginTop: 2 },
  bajada: { color: '#64748B', fontSize: 14, marginTop: 3 },
  botonGuardadas: { backgroundColor: '#FFF8E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  textoGuardadas: { color: '#9A6700', fontWeight: '800' },
  etiqueta: { color: '#334155', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  filaChips: { marginBottom: 16 },
  panelPruebas: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 11, marginBottom: 16 },
  pruebasTitulo: { color: '#3730A3', fontSize: 12, fontWeight: '800', marginBottom: 7 },
  pruebasFila: { flexDirection: 'row', gap: 18 },
  prueba: { color: '#4338CA', fontWeight: '700', textDecorationLine: 'underline' },
});
