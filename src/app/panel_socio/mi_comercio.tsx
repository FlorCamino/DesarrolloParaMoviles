import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipFiltro } from '@/components/chip-filtro';
import { EstadoPantalla } from '@/components/estado-pantalla';
import { useAuth } from '@/hooks/use-auth';
import { agregarImagen, editarMiComercio, obtenerMiComercio, subirVideo } from '@/services/panel-comercio';

import type { Coordenadas } from '@/types/business';

const MEDIOS = [
    { id: 'efectivo', nombre: 'Efectivo'},
    { id: 'debito', nombre: 'Débito'},
    { id: 'credito', nombre: 'Crédito'},
    { id: 'transferencia', nombre: 'Transferencia bancaria'},
    { id: 'billetera_virtual', nombre: 'Billetera virtual'},
];

const MAX_FOTOS = 8;

export default function MiComercioScreen() {
    const {usuario} = useAuth();
    const insets = useSafeAreaInsets();
    const comercioId = usuario?.comercioId ?? null;

    const [descripcion, setDescripcion] = useState('');
    const [direccion, setDireccion] = useState('');
    const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
    const [direccionOriginal, setDireccionOriginal] = useState('');
    const [ubicacionNueva, setUbicacionNueva] = useState(false);
    const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
    const [telefono, setTelefono] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [instagram, setInstagram] = useState('');
    const [medios, setMedios] = useState<string[]>([]);
    const [imagenes, setImagenes] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [subiendoVideo, setSubiendoVideo] = useState(false);

    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [agregandoFoto, setAgregandoFoto] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!comercioId) return;

        obtenerMiComercio(comercioId)
        .then((comercio) => {
            setDescripcion(comercio.descripcion);
            setDireccion(comercio.direccion);
            setCoordenadas(comercio.coordenadas);
            setDireccionOriginal(comercio.direccion);
            setTelefono(comercio.telefono ?? '');
            setWhatsapp(comercio.whatsapp ?? '');
            setInstagram(comercio.instagram ?? '');
            setMedios(comercio.mediosDePago);
            setImagenes(comercio.imagenes);
            setVideoUrl(comercio.videoUrl);
        })
        .catch(() => setErrorCarga(true))
        .finally(() => setCargando(false));
    }, [comercioId]);

    function alternarMedio(id: string) {
        setMedios((actuales) =>
        actuales.includes(id) ? actuales.filter((medio) => medio !== id) : [...actuales, id],
        );
    }

    function quitarFoto(url: string) {
    setImagenes((actuales) => actuales.filter((item) => item !== url));
    }

    async function agregarFoto() {
        setError(null);
        if (imagenes.length >= MAX_FOTOS) {
        setError(`Se pueden cargar hasta ${MAX_FOTOS} fotos.`);
        return;
        }

    setAgregandoFoto(true);
    try {
        const resultado = await ImagePicker.launchImageLibraryAsync({mediaTypes: ['images'], quality: 0.7,});
        if (resultado.canceled) return;

        const url = await agregarImagen(resultado.assets[0].uri);
        setImagenes((actuales) => [...actuales, url]);
        } catch {
            setError('No pudimos cargar la foto. Intentá de nuevo.');
        } finally {
            setAgregandoFoto(false);
        }
    }

    async function elegirVideo() {
        setError(null);
        setSubiendoVideo(true);
        try {
        const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
        if (resultado.canceled) return;

        const video = resultado.assets[0];
        const segundos = Math.round((video.duration ?? 0) / 1000);

        if (segundos > 30) {
            setError(`El video dura ${segundos} segundos. Tiene que durar un máximo de 30 segundos.`);
            return;
        }
        if (video.mimeType && video.mimeType !== 'video/mp4') {
            setError('El video tiene que ser archivo MP4.');
            return;
        }
        if (video.fileSize && video.fileSize > 30 * 1024 * 1024) {
            setError('El video pesa más de 30 MB. Elige uno más corto.');
            return;
        }

        setVideoUrl(await subirVideo(video.uri));
        } catch {
        setError('No se pudo subir el video. Intentá nuevamente.');
        } finally {
        setSubiendoVideo(false);
        }
    }

    function confirmarUbicacion() {
        Alert.alert('Ubicar tu comercio', 'Se utilizará el lugar en donde estés parado ahora para ubicar tu comercio. ¿Continuar?', 
            [
                {text: 'Cancelar', style: 'cancel'},
                {text: 'Si, estoy en mi comercio.', onPress: usarMiUbicacion},
            ],
        );
    }

    async function usarMiUbicacion() {
        setError(null);
        setBuscandoUbicacion(true);
        try {
            const permiso = await Location.requestForegroundPermissionsAsync();
            if (permiso.status !== 'granted') {
                setError('Se necesita el permiso de ubicación para poder ubicar tu comercio. Puedes otorgarlo en Ajustes.');
                return;
            }

            const posicion = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.High});
            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;
            
            setCoordenadas({
                latitud: Number(lat.toFixed(6)),
                longitud: Number(lon.toFixed(4)),
            });

            const resultadosDireccion = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lon,
            });

            if (resultadosDireccion.length > 0) {
                const d = resultadosDireccion[0];
                const calleNumero = [d.street, d.streetNumber].filter(Boolean).join(' ');
                const localidad = d.city || d.subregion || '';
                const direccionArmada = [calleNumero, localidad].filter(Boolean).join(', ');

                if (direccionArmada) {
                    setDireccion(direccionArmada);
                }
            }

            setUbicacionNueva(true);
        } catch {
            setError('No se pudo obtener tu ubicación. Revisa que el GPS esté activado.');
        } finally {
            setBuscandoUbicacion(false);
        }
    }

    function verEnMapa() {
        if (!coordenadas) return;
        Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${coordenadas.latitud},${coordenadas.longitud}`
        );
    }

    async function guardar() {
        if (!comercioId) return;
        if (!coordenadas) return;
        setError(null);

        const descripcionLimpia = descripcion.trim();
        const direccionLimpia = direccion.trim();
        if (!descripcionLimpia) return setError('Escribí una descripción.');
        if (!direccionLimpia) return setError('Escribí la dirección.');

        const vacioANull = (texto: string) => (texto.trim() === '' ? null : texto.trim());

        setGuardando(true);
        try {
            await editarMiComercio(comercioId, {
                descripcion: descripcionLimpia,
                direccion: direccionLimpia,
                coordenadas: coordenadas,
                telefono: vacioANull(telefono),
                whatsapp: vacioANull(whatsapp),
                instagram: vacioANull(instagram),
                mediosDePago: medios,
                imagenes,
                videoUrl,
            });
            Alert.alert('Listo', 'Guardamos los cambios de tu comercio.', [
            { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return <EstadoPantalla cargando titulo="Cargando tu comercio" detalle="Un momento..." />;
    }

    if (errorCarga) {
        return (
            <EstadoPantalla
                titulo="No pudimos cargar tu comercio"
                detalle="Volvé atrás e intentá de nuevo."
                textoBoton="Volver"
                onPress={() => router.back()}
            />
        );
    }

    return (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.etiqueta}>Descripción</Text>
            <TextInput style={[styles.input, styles.inputGrande]} value={descripcion} onChangeText={setDescripcion} multiline maxLength={2000}/>

            <Text style={styles.etiqueta}>Dirección</Text>
            <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} maxLength={160} />

            {direccion.trim() !== direccionOriginal && !ubicacionNueva && (
                <Text style={styles.aviso}>Has cambiado la dirección. Si mudaste tu local, actualiza también su ubicación en el mapa.</Text>
            )}

            <Text style={styles.etiqueta}>Ubicación en el mapa</Text>
            <Text style={styles.ayuda}>{ubicacionNueva ? 'Ubicación actualizada. Se guardará al tocar "Guardar cambios"' : 'Para que te puedan encontrar tus clientes en el mapa.'}</Text>

            <Pressable accessibilityRole='button' disabled={buscandoUbicacion} onPress={confirmarUbicacion} style={({pressed}) => [styles.botonSecundario, (pressed || buscandoUbicacion) && {opacity: 0.8}]}>
                <Text style={styles.botonSecundarioTexto}>{buscandoUbicacion ? 'Buscando tu ubicación...' : 'Estoy en mi comercio: Usar mi ubicación'}</Text>
            </Pressable>
            <Pressable accessibilityRole='button' onPress={verEnMapa} style={({pressed}) => [styles.botonSecundario, pressed && {opacity: 0.8}]}>
                <Text style={styles.botonSecundarioTexto}>Ver en Google Maps</Text>
            </Pressable>

            <Text style={styles.etiqueta}>Teléfono (opcional)</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" maxLength={40} />

        <Text style={styles.etiqueta}>WhatsApp (opcional)</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="5493442421000"
          keyboardType="number-pad"
          maxLength={15}
        />
        <Text style={styles.ayuda}>Solo números, con el código de país (54 9 ...).</Text>

        <Text style={styles.etiqueta}>Instagram (opcional)</Text>
        <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} placeholder="@mi_comercio" autoCapitalize="none" autoCorrect={false}/>

        <Text style={styles.etiqueta}>Medios de pago</Text>
        <View style={styles.chips}>
            {MEDIOS.map((medio) => (
                <ChipFiltro key={medio.id} texto={medio.nombre} seleccionado={medios.includes(medio.id)} onPress={() => alternarMedio(medio.id)}/>
            ))}
        </View>

        <Text style={styles.etiqueta}>Fotos ({imagenes.length}/{MAX_FOTOS})</Text>
        {imagenes.length === 0 && <Text style={styles.ayuda}>Todavía no se han añadido fotos.</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotos}>
          {imagenes.map((url) => (
            <View key={url} style={styles.foto}>
                <Image source={{ uri: url }} style={styles.fotoImagen} />
                <Pressable accessibilityRole="button" onPress={() => quitarFoto(url)} style={({ pressed }) => [styles.fotoQuitar, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.fotoQuitarTexto}>Quitar</Text>
                </Pressable>
            </View>
        ))}
        </ScrollView>
        <Pressable accessibilityRole="button" disabled={agregandoFoto} onPress={agregarFoto} style={({ pressed }) => [styles.botonSecundario, (pressed || agregandoFoto) && { opacity: 0.7 }]} >
            <Text style={styles.botonSecundarioTexto}>{agregandoFoto ? 'Cargando foto...' : 'Agregar foto'}</Text>
        </Pressable>

        <Text style={styles.etiqueta}>Video de presentación (hasta 30 segundos)</Text>
        <Text style={styles.ayuda}>Breve video de presentación de tu comercio, lo más buscado por los clientes. Formato MP4, de hasta 30 MB.</Text>
        <Text style={videoUrl ? styles.videoCargado : styles.ayuda}>
            {videoUrl ? 'Video subido' : 'Todavía se ha subido un video.'}
        </Text>
        <Pressable accessibilityRole="button" disabled={subiendoVideo} onPress={elegirVideo} style={({ pressed }) => [styles.botonSecundario, (pressed || subiendoVideo) && { opacity: 0.7 }]}>
            <Text style={styles.botonSecundarioTexto}>
                {subiendoVideo ? 'Cargando video...' : videoUrl ? 'Cambiar video' : '+ Elegir video'}
            </Text>
        </Pressable>
        {videoUrl && (
            <Pressable accessibilityRole="button" onPress={() => setVideoUrl(null)} style={({ pressed }) => [styles.fotoQuitar, pressed && { opacity: 0.8 }]} >
                <Text style={styles.fotoQuitarTexto}>Quitar video</Text>
            </Pressable>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable accessibilityRole="button" disabled={guardando} onPress={guardar} style={({ pressed }) => [styles.boton, (pressed || guardando) && { opacity: 0.7 }]}>
            <Text style={styles.botonTexto}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Text>
        </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: 20, gap: 8, backgroundColor: '#F3F6FC' },
    etiqueta: { fontSize: 14, fontWeight: '700', color: '#172E62', marginTop: 8 },
    ayuda: { fontSize: 12, color: '#64748B' },
    input: { minHeight: 48, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, fontSize: 15, color: '#0F172A' },
    inputGrande: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fotos: { gap: 10, paddingVertical: 4 },
    foto: { width: 120, gap: 6 },
    fotoImagen: { width: 120, height: 120, borderRadius: 14, backgroundColor: '#E2E9F4' },
    fotoQuitar: { minHeight: 36, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    fotoQuitarTexto: { fontSize: 13, fontWeight: '600', color: '#B91C1C' },
    botonSecundario: { minHeight: 48, backgroundColor: '#F0F5FF', borderWidth: 1, borderColor: '#DCE6FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    botonSecundarioTexto: { fontSize: 14, fontWeight: '600', color: '#2455B8' },
    error: { fontSize: 14, color: '#B91C1C', marginTop: 8 },
    boton: { minHeight: 52, marginTop: 16, backgroundColor: '#2455B8', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    botonTexto: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    videoCargado: { fontSize: 14, fontWeight: '600', color: '#047857' },
    aviso: { padding: 10, fontSize: 13, color: '#9C4221', backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#F6AD55', borderRadius: 10 },
});