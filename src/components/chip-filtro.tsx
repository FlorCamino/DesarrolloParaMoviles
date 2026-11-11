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
      style={({ pressed }) => [styles.chip, seleccionado && styles.chipSeleccionado, pressed && { opacity: 0.75 }]}
    >
      <Text style={[styles.texto, seleccionado && styles.textoSeleccionado]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: '#DCE6FA',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 44,
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  chipSeleccionado: {
    backgroundColor: '#2455B8',
    borderColor: '#2455B8',
  },
  texto: { color: '#334155', fontSize: 14, fontWeight: '600' },
  textoSeleccionado: { color: '#FFFFFF' },
});
