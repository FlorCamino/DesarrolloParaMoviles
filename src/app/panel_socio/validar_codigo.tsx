import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstadoPantalla } from '@/components/estado-pantalla';
import { useAuth } from '@/hooks/use-auth';
import { validarCodigo } from '@/services/panel-comercio';

type Resultado = 
    | { ok: true; titulo: string; codigo: string; usos: number}
    | { ok: false; mensaje: string};

type Acceso = 'verificando' | 'concedido' | 'denegado';

export default function ValidarCodigoScreen() {
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();
    const comercioId = usuario?.comercioId ?? null;

    const [permiso, pedirPermiso] = useCameraPermissions();
    const [codigoManual, setCodigoManual] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [resultado, setResultado] = useState<Resultado | null>(null);

    const ocupado = useRef(false);

    const [acceso, setAcceso] = useState<Acceso>('verificando');

    const verificarIdentidad = useCallback(async () => {
      setAcceso('verificando');
      try {
        const resultado = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirmá tu identidad para validar códigos',
          cancelLabel: 'Cancelar',
        });
        setAcceso(resultado.success ? 'concedido' : 'denegado');
      } catch {
        setAcceso('denegado');
      }
    }, []);

    useEffect(() => {
      verificarIdentidad();
    }, [verificarIdentidad]);

    async function validar(codigo: string) {
        if (!comercioId || ocupado.current) return;
        ocupado.current = true;
        setProcesando(true);

        try {
            const {promocion, uso} = await validarCodigo(comercioId, codigo);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setResultado({ok: true, titulo: promocion.titulo, codigo: uso.codigo, usos: promocion.usos});
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setResultado({ok: false, mensaje: error instanceof Error ? error.message : 'No se pudo validar el código.'});
        } finally {
            setProcesando(false);
        }
    }

    function escanearOtroCodigo() {
        setResultado(null);
        setCodigoManual('');
        ocupado.current = false;
    }

    if (acceso === 'verificando') {
      return (
        <EstadoPantalla cargando titulo="Verificando su identidad" detalle="Utiliza tu huella o el patrón de bloqueo de pantalla del teléfono."/>
      );
    }

    if (acceso === 'denegado') {
      return (
        <EstadoPantalla titulo="No se pudo confirmar tu identidad" detalle="Para validar los códigos QR se necesita tu huella o patrón de bloqueo de pantalla. Si no tienes uno configurado, actívalo en Ajustes." textoBoton="Intentar nuevamente" onPress={verificarIdentidad}/>
      );
    }


    if (!permiso) {
        return <EstadoPantalla cargando titulo="Preparando la cámara" detalle="Espere un momento..."/>
    }

    if (!permiso.granted) {
        return (
            <EstadoPantalla titulo="Se necesita acceder a la cámara" detalle="Para escanear el código QR se requiere acceso a la cámara del dispostivo." textoBoton={permiso.canAskAgain ? 'Dar permiso' : 'Abrir ajustes'} onPress={permiso.canAskAgain ? pedirPermiso : () => Linking.openSettings()}/>
        );
    }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}
      keyboardShouldPersistTaps="handled">
      {resultado ? (
        <View style={[styles.resultado, resultado.ok ? styles.resultadoOk : styles.resultadoError]}>
          <Text style={styles.resultadoIcono}>{resultado.ok ? '✓' : '✕'}</Text>
          {resultado.ok ? (
            <>
              <Text style={styles.resultadoTitulo}>Código válido</Text>
              <Text style={styles.resultadoTexto}>{resultado.titulo}</Text>
              <Text style={styles.resultadoTexto}>Código: {resultado.codigo}</Text>
              <Text style={styles.resultadoTexto}>Usos de esta promoción: {resultado.usos}</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultadoTitulo}>No se pudo validar</Text>
              <Text style={styles.resultadoTexto}>{resultado.mensaje}</Text>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={escanearOtroCodigo}
            style={({ pressed }) => [styles.boton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.botonTexto}>Escanear otro código</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.ayuda}>Apunte la cámara hacia el código QR del cliente.</Text>
          <View style={styles.marcoCamara}>
            <CameraView
              style={styles.camara}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={procesando ? undefined : ({ data }) => validar(data)}
            />
          </View>

          <Text style={styles.etiqueta}>Si no se puede escanear, escriba el código manualmente</Text>
          <TextInput
            style={styles.input}
            value={codigoManual}
            onChangeText={setCodigoManual}
            placeholder="CCU-000-000-0000"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Pressable
            accessibilityRole="button"
            disabled={procesando || codigoManual.trim() === ''}
            onPress={() => validar(codigoManual)}
            style={({ pressed }) => [
              styles.boton,
              (pressed || procesando || codigoManual.trim() === '') && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.botonTexto}>{procesando ? 'Validando...' : 'Validar código'}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, backgroundColor: '#F3F6FC', flexGrow: 1 },
  ayuda: { fontSize: 14, color: '#536582' },
  marcoCamara: { height: 320, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0F172A' },
  camara: { flex: 1 },
  etiqueta: { fontSize: 14, fontWeight: '700', color: '#172E62', marginTop: 8 },
  input: { minHeight: 48, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, fontSize: 15, color: '#0F172A' },
  boton: { minHeight: 52, paddingHorizontal: 24, alignSelf: 'stretch', backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  botonTexto: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  resultado: { padding: 24, gap: 8, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  resultadoOk: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  resultadoError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  resultadoIcono: { fontSize: 48, fontWeight: '800', color: '#0F172A' },
  resultadoTitulo: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  resultadoTexto: { fontSize: 15, color: '#334155', textAlign: 'center' },
});