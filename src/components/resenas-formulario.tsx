import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    estrellas: number;
    comentario: string;
    error: string | null;
    guardando: boolean;
    textoGuardar: string;
    onCambiarEstrellas: (estrellas: number) => void;
    onCambiarComentario: (comentario: string) => void;
    onGuardar: () => void;
    onCancelar: () => void;
}

export function ResenaFormulario({
    estrellas,
    comentario,
    error,
    guardando,
    textoGuardar,
    onCambiarEstrellas,
    onCambiarComentario,
    onGuardar,
    onCancelar,
}: Props) {
    return (
        <View style={styles.formulario}>
            <View style={styles.estrellasFila}>{[1, 2, 3, 4, 5].map((numero) => (
                <Pressable key={numero} accessibilityRole="button" accessibilityLabel={`${numero} ${numero === 1 ? 'estrella' : 'estrellas'}`} hitSlop={6} onPress={() => onCambiarEstrellas(numero)}>
                    <Text style={[styles.estrellaGrande, numero <= estrellas && styles.estrellaActiva]}>{numero <= estrellas ? '★' : '☆'}</Text>
                </Pressable>
            ))}
            </View>

            <TextInput style={styles.input} value={comentario} onChangeText={onCambiarComentario} placeholder="Contá tu experiencia en el comercio..." multiline maxLength={1000}/>

            {error && <Text style={styles.error}>{error}</Text> }

            <View style={styles.acciones}>
                <Pressable accessibilityRole="button" disabled={guardando} onPress={onCancelar} style={({pressed}) => [styles.accion, pressed && {opacity: 0.8}]}>
                    <Text style={styles.accionTexto}>Cancelar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={guardando} onPress={onGuardar} style={({pressed}) => [styles.accion, styles.accionPrimaria, (pressed || guardando) && {opacity: 0.7}]}>
                    <Text style={[styles.accionTexto, styles.accionPrimariaTexto]}>{textoGuardar}</Text>
                </Pressable>
            </View>
        </View>
    );
}



const styles = StyleSheet.create({
    formulario: { gap: 10, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12 },
    estrellasFila: { flexDirection: 'row', gap: 6 },
    estrellaGrande: { fontSize: 34, color: '#94A3B8' },
    estrellaActiva: { color: '#B45309' },
    input: { minHeight: 90, padding: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, fontSize: 14, textAlignVertical: 'top', color: '#0F172A' },
    error: { color: '#B91C1C', fontSize: 13 },
    acciones: { flexDirection: 'row', gap: 10 },
    accion: { flex: 1, minHeight: 44, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    accionTexto: { color: '#1E3A8A', fontSize: 14, fontWeight: '600' },
    accionPrimaria: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
    accionPrimariaTexto: { color: '#FFFFFF' },
});