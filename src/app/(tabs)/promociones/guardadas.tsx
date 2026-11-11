
import { useAvisoLogin } from '@/contexts/aviso-login-context';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { EstadoPantalla } from '@/components/estado-pantalla';
import { TarjetaPromocion } from '@/components/tarjeta-promocion';
import { usePromociones } from '@/contexts/promociones-context';
import { useAuth } from '@/hooks/use-auth';

export default function PromocionesGuardadasScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const pedirLogin = useAvisoLogin();

  const {
    promociones,
    comercios,
    preferencias,
    alternarPromocionGuardada,
  } = usePromociones();

  const guardadas = usuario
    ? promociones.filter((item) =>
        preferencias.promocionesGuardadas.includes(item.id)
      )
    : [];

  async function quitarGuardada(promocion: (typeof promociones)[number]) {
    try {
      await alternarPromocionGuardada(promocion);
    } catch (error) {
      console.error('Error al quitar la promoción guardada:', error);
      Alert.alert(
        'No se pudo actualizar',
        'Ocurrió un problema al quitar esta promoción de tus guardadas. Intentá nuevamente.'
      );
    }
  }

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
          onAbrir={() =>
            router.push({
              pathname: '/(tabs)/promociones/[id]',
              params: { id: item.id },
            })
          }
          onGuardar={() => {
            if (usuario) {
              void quitarGuardada(item);
            } else {
              pedirLogin('Necesitás una cuenta para guardar promociones.');
            }
          }}
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
