import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  texto: string;
  seleccionado: boolean;
  onPress: () => void;
}

export function ChipFiltro({ texto, seleccionado, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      onPress={onPress}
      style={[styles.chip, seleccionado && styles.chipSeleccionado]}
    >
      <Text style={[styles.texto, seleccionado && styles.textoSeleccionado]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  chipSeleccionado: {
    backgroundColor: '#153E75',
    borderColor: '#153E75',
  },
  texto: { color: '#334155', fontSize: 14, fontWeight: '600' },
  textoSeleccionado: { color: '#FFFFFF' },
});
