import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstadoPantalla } from '@/components/estado-pantalla';
import { useAuth } from '@/hooks/use-auth';
import { login } from '@/services/auth';
import { validarCodigo } from '@/services/panel-comercio';

type Resultado = 
    | { ok: true; titulo: string | null; codigo: string; usos: number | null }
    | { ok: false; mensaje: string };

type Acceso = 'verificando' | 'concedido' | 'denegado' | 'contrasena';

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
    const [contrasena, setContrasena] = useState('');
    const [errorContrasena, setErrorContrasena] = useState<string | null>(null);
    const [verificandoContrasena, setVerificandoContrasena] = useState(false);

    const verificarIdentidad = useCallback(async () => {
      setAcceso('verificando');
      try {
        const nivel = await LocalAuthentication.getEnrolledLevelAsync();
        if (nivel === LocalAuthentication.SecurityLevel.NONE) {
          setAcceso('contrasena');
          return;
        }
        const respuesta = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirmá tu identidad para validar códigos',
          cancelLabel: 'Cancelar',
        });
        setAcceso(respuesta.success ? 'concedido' : 'denegado');
      } catch {
        setAcceso('denegado');
      }
    }, []);

    useEffect(() => {
      const inicio = setTimeout(() => void verificarIdentidad(), 0);
      return () => clearTimeout(inicio);
    }, [verificarIdentidad]);

    async function confirmarConContrasena() {
      if (!usuario || contrasena === '') return;
      setErrorContrasena(null);
      setVerificandoContrasena(true);
      try {
        const sesion = await login({email: usuario.email, password: contrasena});
        if (sesion.usuario.id !== usuario.id) {
          throw new Error('La contraseña no corresponde a esta cuenta.');
        }
        setContrasena('');
        setAcceso('concedido');
      } catch (error) {
        setErrorContrasena(error instanceof Error ? error.message : 'No se pudo verificar la contraseña.');
      } finally {
        setVerificandoContrasena(false);
      }
    }

    async function validar(codigo: string) {
        if (!comercioId || ocupado.current) return;
        ocupado.current = true;
        setProcesando(true);

        try {
            const {promocion, uso} = await validarCodigo(comercioId, codigo);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setResultado({ok: true, titulo: promocion?.titulo ?? null, codigo: uso.codigo, usos: promocion?.usos ?? null});
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
        <View style={styles.accesoPantalla}>
          <Text style={styles.accesoTitulo}>No se pudo confirmar tu identidad</Text>
          <Text style={styles.accesoDetalle}>Para validar códigos se necesita tu huella o el bloqueo de pantalla. También es posible confirmar con tu contraseña.</Text>
          <Pressable accessibilityRole="button" onPress={verificarIdentidad} style={styles.boton}>
            <Text style={styles.botonTexto}>Intentar nuevamente</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setAcceso('contrasena')} style={styles.botonSecundario}>
            <Text style={styles.botonSecundarioTexto}>Usar mi contraseña</Text>
          </Pressable>
        </View>
      );
    }

    if (acceso === 'contrasena') {
      return (
        <ScrollView contentContainerStyle={[styles.accesoPantalla, {paddingBottom: 20 + insets.bottom}]} keyboardShouldPersistTaps='handled'>
          <Text style={styles.accesoTitulo}>Confirma tu contraseña</Text>
          <Text style={styles.accesoDetalle}>Para validar el código QR, confirma tu identidad escribiendo la contraseña de tu cuenta.</Text>
          <TextInput style={[styles.input, styles.inputAncho]} value={contrasena} onChangeText={setContrasena} placeholder='Contraseña' secureTextEntry autoCapitalize='none' autoCorrect={false}/>
          {errorContrasena && <Text style={styles.error}>{errorContrasena}</Text>}
          <Pressable accessibilityRole='button' disabled={verificandoContrasena || contrasena === ''} onPress={confirmarConContrasena} style={({pressed}) => [styles.boton, (pressed || verificandoContrasena || contrasena === '') && {opacity: 0.6},]}>
            <Text style={styles.botonTexto}>{verificandoContrasena ? 'Verificando...' : 'Confirmar'}</Text>
          </Pressable>
        </ScrollView>
      )
    }

  
  const camaraLista = permiso?.granted === true;

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
              <Text style={styles.resultadoTexto}>{resultado.titulo ?? 'No se pudo cargar el detalle de la promoción, pero el código quedó registrado.'}</Text>
              <Text style={styles.resultadoTexto}>Código: {resultado.codigo}</Text>
              {resultado.usos !== null && (
                <Text style={styles.resultadoTexto}>Usos de esta promoción: {resultado.usos}</Text>
              )}

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
          <Text style={styles.ayuda}>{camaraLista ? 'Apunte la cámara hacia el código QR del cliente.' : 'Escriba el código del cliente para validarlo.'}</Text>

          {camaraLista ? (
            <View style={styles.camara}>
              <CameraView style={styles.camara} facing='back' barcodeScannerSettings={{barcodeTypes: ['qr']}} onBarcodeScanned={procesando ? undefined : ({ data }) => validar(data)}/>
            </View>
          ) : (
            <View style={styles.sinCamara}>
              <Text style={styles.sinCamaraTexto}>{permiso ? 'La cámara no está habilitada. Puedes validar escribiendo el código.' : 'Preparando la cámara...'}</Text>
              {permiso && (
                <Pressable accessibilityRole='button' onPress={permiso.canAskAgain ? pedirPermiso : () => Linking.openSettings()} style={styles.botonSecundario}>
                  <Text style={styles.botonSecundarioTexto}>{permiso.canAskAgain ? 'Dar permiso de cámara' : 'Abrir ajustes'}</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.etiqueta}>{camaraLista ? 'Si no se puede escanear, escriba el código manualmente' : 'Código del cliente'}</Text>
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
  sinCamara: { padding: 16, gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E9F4', borderRadius: 16, alignItems: 'center' },
  sinCamaraTexto: { fontSize: 14, color: '#536582', textAlign: 'center' },
  etiqueta: { fontSize: 14, fontWeight: '700', color: '#172E62', marginTop: 8 },
  input: { minHeight: 48, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, fontSize: 15, color: '#0F172A' },
  inputAncho: { alignSelf: 'stretch' },
  error: { fontSize: 14, color: '#B91C1C', textAlign: 'center' },
  boton: { minHeight: 52, paddingHorizontal: 24, alignSelf: 'stretch', backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center',
  alignItems: 'center', marginTop: 8 },
  botonSecundario: { minHeight: 52, paddingHorizontal: 24, alignSelf: 'stretch', backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  botonSecundarioTexto: { fontSize: 16, fontWeight: '600', color: '#2455B8' },
  accesoPantalla: { flexGrow: 1, padding: 24, gap: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F6FC' },
  accesoTitulo: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  accesoDetalle: { fontSize: 15, lineHeight: 22, color: '#64748B', textAlign: 'center' },
  botonTexto: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  resultado: { padding: 24, gap: 8, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  resultadoOk: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  resultadoError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  resultadoIcono: { fontSize: 48, fontWeight: '800', color: '#0F172A' },
  resultadoTitulo: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  resultadoTexto: { fontSize: 15, color: '#334155', textAlign: 'center' },
});