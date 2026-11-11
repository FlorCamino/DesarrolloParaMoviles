import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  cargando?: boolean;
  titulo: string;
  detalle: string;
  textoBoton?: string;
  onPress?: () => void;
}

export function EstadoPantalla({
  cargando = false,
  titulo,
  detalle,
  textoBoton,
  onPress,
}: Props) {
  return (
    <View style={styles.contenedor}>
      {cargando && <ActivityIndicator size="large" color="#153E75" />}
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.detalle}>{detalle}</Text>
      {textoBoton && onPress && (
        <Pressable style={styles.boton} onPress={onPress}>
          <Text style={styles.textoBoton}>{textoBoton}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 28 },
  titulo: { color: '#0F172A', fontSize: 20, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  detalle: { color: '#64748B', fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  boton: { backgroundColor: '#153E75', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  textoBoton: { color: '#FFFFFF', fontWeight: '700' },
});
