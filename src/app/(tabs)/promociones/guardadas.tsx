import { FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { EstadoPantalla } from '@/components/estado-pantalla';
import { TarjetaPromocion } from '@/components/tarjeta-promocion';
import { usePromociones } from '@/contexts/promociones-context';

export default function PromocionesGuardadasScreen() {
  const router = useRouter();
  const { promociones, comercios, preferencias, alternarPromocionGuardada } = usePromociones();
  const guardadas = promociones.filter((item) => preferencias.promocionesGuardadas.includes(item.id));

  return (
    <FlatList
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      data={guardadas}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TarjetaPromocion
          promocion={item}
          comercio={comercios.find((comercio) => comercio.id === item.comercioId)}
          guardada
          onAbrir={() => router.push({ pathname: '/(tabs)/promociones/[id]', params: { id: item.id } })}
          onGuardar={() => alternarPromocionGuardada(item)}
        />
      )}
      ListEmptyComponent={
        <EstadoPantalla
          titulo="Todavía no guardaste promociones"
          detalle="Tocá la estrella de una promoción para verla aquí y recibir su recordatorio."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { padding: 18, flexGrow: 1 },
});
