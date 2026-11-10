import { router } from 'expo-router';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const AvisoLoginContext = createContext<((mensaje: string) => void) | null>(null);

export function AvisoLoginProvider({ children }: PropsWithChildren) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const cerrar = () => setMensaje(null);

  function ingresar() {
    cerrar();
    router.push('/login');
  }

  return (
    <AvisoLoginContext.Provider value={setMensaje}>
      {children}
      <Modal visible={mensaje !== null} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={styles.fondo}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessible={false} />
          <View style={styles.tarjeta} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={styles.contenido} bounces={false}>
              <Image source={require('@/assets/images/logo-directorio-comercios.png')} style={styles.logo} accessible={false} />
              <Text style={styles.titulo} accessibilityRole="header">Iniciá sesión</Text>
              <Text style={styles.mensaje}>{mensaje}</Text>
              <Pressable accessibilityRole="button" onPress={ingresar} style={({ pressed }) => [styles.boton, styles.primario, pressed && styles.presionado]}>
                <Text style={styles.textoPrimario}>Ingresar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={cerrar} style={({ pressed }) => [styles.boton, styles.secundario, pressed && styles.presionado]}>
                <Text style={styles.textoSecundario}>Seguir explorando</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AvisoLoginContext.Provider>
  );
}

export function useAvisoLogin() {
  const mostrar = useContext(AvisoLoginContext);
  if (!mostrar) throw new Error('useAvisoLogin requiere AvisoLoginProvider.');
  return mostrar;
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  tarjeta: { width: '100%', maxWidth: 400, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  contenido: { padding: 24, gap: 12 },
  logo: { width: 64, height: 64, alignSelf: 'center', borderRadius: 18, marginBottom: 4 },
  titulo: { color: '#1E3A8A', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  mensaje: { color: '#64748B', fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 12 },
  boton: { minHeight: 52, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primario: { backgroundColor: '#1E3A8A' },
  secundario: { borderWidth: 1, borderColor: '#1E3A8A' },
  textoPrimario: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  textoSecundario: { color: '#1E3A8A', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  presionado: { opacity: 0.75 },
});
