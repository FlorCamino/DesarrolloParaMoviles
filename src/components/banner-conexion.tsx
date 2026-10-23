import { StyleSheet, Text, View } from 'react-native';

interface Props {
  sinConexion: boolean;
  origenCache: boolean;
  actualizadoEn: string | null;
}

export function BannerConexion({ sinConexion, origenCache, actualizadoEn }: Props) {
  if (!sinConexion && !origenCache) return null;

  const fecha = actualizadoEn
    ? new Date(actualizadoEn).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <View style={styles.contenedor} accessibilityRole="alert">
      <Text style={styles.titulo}>{sinConexion ? 'Sin conexión' : 'No se pudo actualizar'}</Text>
      <Text style={styles.texto}>
        {origenCache
          ? `Mostramos datos guardados${fecha ? ` del ${fecha}` : ''}.`
          : 'Conectate para consultar las promociones.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#FFF7E6',
    borderColor: '#F6AD55',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  titulo: { color: '#9C4221', fontWeight: '800' },
  texto: { color: '#7B341E', marginTop: 2 },
});
