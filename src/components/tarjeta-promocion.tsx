import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ComercioResumen, Promocion } from '@/types/promociones';
import {
  formatearFechaArgentina,
  obtenerEstadoPromocion,
  textoDiasHastaVencimiento,
} from '@/utils/promociones';

interface Props {
  promocion: Promocion;
  comercio?: ComercioResumen;
  guardada: boolean;
  onAbrir: () => void;
  onGuardar: () => void;
}

const etiquetas = {
  vigente: 'Vigente',
  proxima: 'Próximamente',
  porVencer: 'Por vencer',
  vencida: 'Vencida',
};

export function TarjetaPromocion({ promocion, comercio, guardada, onAbrir, onGuardar }: Props) {
  const estado = obtenerEstadoPromocion(promocion);
  const textoVencimiento = textoDiasHastaVencimiento(promocion);

  return (
    <Pressable style={({ pressed }) => [styles.tarjeta, pressed && { opacity: 0.8 }]} onPress={onAbrir} accessibilityRole="button">
      <View style={styles.filaSuperior}>
        <View style={[styles.estado, estado === 'porVencer' && styles.estadoUrgente]}>
          <Text style={[styles.textoEstado, estado === 'porVencer' && styles.textoUrgente]}>
            {etiquetas[estado]}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.botonGuardar}
          accessibilityLabel={guardada ? 'Quitar promoción guardada' : 'Guardar promoción'}
          hitSlop={10}
          onPress={(evento) => {
            evento.stopPropagation();
            onGuardar();
          }}
        >
          <Text style={[styles.guardar, guardada && styles.guardada]}>{guardada ? '★' : '☆'}</Text>
        </Pressable>
      </View>

      <Text style={styles.comercio}>{comercio?.nombre ?? 'Comercio'}</Text>
      <Text style={styles.titulo}>{promocion.titulo}</Text>
      <Text style={styles.detalle} numberOfLines={2}>{promocion.detalle}</Text>

      <View style={styles.pie}>
        <Text style={styles.fecha}>
          {estado === 'proxima'
            ? `Comienza ${formatearFechaArgentina(promocion.desde)}`
            : `Hasta ${formatearFechaArgentina(promocion.hasta)}`}
        </Text>
        <Text style={[styles.dias, estado === 'porVencer' && styles.diasUrgentes]}>
          ⏳ {textoVencimiento}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E9F4',
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  filaSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estado: { backgroundColor: '#E6FFFA', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  estadoUrgente: { backgroundColor: '#FFF5F5' },
  textoEstado: { color: '#237A6B', fontSize: 12, fontWeight: '800' },
  textoUrgente: { color: '#C53030' },
  guardar: { fontSize: 29, color: '#94A3B8' },
  botonGuardar: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F6FC', borderRadius: 14 },
  guardada: { color: '#D69E2E' },
  comercio: { color: '#64748B', fontSize: 13, fontWeight: '700', marginTop: 8 },
  titulo: { color: '#172E62', fontSize: 20, lineHeight: 27, fontWeight: '700', marginTop: 5, letterSpacing: -0.4 },
  detalle: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 7 },
  pie: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E9F4' },
  fecha: { color: '#475569', fontSize: 13 },
  dias: { color: '#153E75', fontSize: 13, fontWeight: '800' },
  diasUrgentes: { color: '#C53030' },
});
