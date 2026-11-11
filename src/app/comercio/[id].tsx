import { useAvisoLogin } from '@/contexts/aviso-login-context';
import { useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BannerConexion } from "@/components/banner-conexion";
import { usePromociones } from "@/contexts/promociones-context";
import { useAuth } from "@/hooks/use-auth";
import { obtenerComercioPorIdConEstado } from "@/services/comercios";
import { obtenerUriMultimedia } from "@/services/multimedia-comercios";
import { obtenerPromocionesVigentesPorComercio } from "@/services/promociones";
import { obtenerResenasPorComercio } from "@/services/reviews";
import type { Comercio, Resena } from "@/types/business";
import type { Promocion } from "@/types/promociones";
import * as Network from "expo-network";

import { ResenasSeccion } from "@/components/resenas-seccion";

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const NOMBRES_RUBROS: Record<string, string> = {
  "rub-gastronomia": "Gastronomía",
  "rub-indumentaria": "Indumentaria",
  "rub-hogar": "Hogar",
  "rub-ferreteria": "Ferretería y construcción",
  "rub-salud": "Salud y farmacia",
  "rub-servicios": "Servicios",
  "rub-tecnologia": "Tecnología",
  "rub-libreria": "Librería",
  "rub-otros": "Otros",
};

function formatearFecha(fecha: string): string {
  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return "Fecha no disponible";
  }

  return fechaValida.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


function FotoGaleria({ uri }: { uri: string }) {
  const [uriMostrar, setUriMostrar] = useState(uri);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;

    async function cargarImagen() {
      setError(false);
      setUriMostrar(uri);

      const resultado = await obtenerUriMultimedia(uri, "imagen");

      if (vigente) {
        setUriMostrar(resultado);
      }
    }

    void cargarImagen();

    return () => {
      vigente = false;
    };
  }, [uri]);

  if (error) {
    return (
      <View style={[styles.sinImagen, styles.imagenGaleriaError]}>
        <Text style={styles.textoSinImagen}>Foto no disponible</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: uriMostrar }}
      style={styles.imagenGaleria}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}




function VideoPresentacion({ url }: { url: string }) {
  const player = useVideoPlayer(null, (player) => {
    player.loop = false;
  });

  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    async function cargarVideo() {
      setError(false);
      setCargando(true);

      try {
        const resultado = await obtenerUriMultimedia(url, "video");

        if (vigente) {
          player.replace(resultado);
          setCargando(false);
        }
      } catch (error) {
        console.warn("No se pudo cargar el video:", error);

        if (vigente) {
          setError(true);
          setCargando(false);
        }
      }
    }

    void cargarVideo();

    return () => {
      vigente = false;
    };
  }, [url, player]);

  if (error) {
    return (
      <View style={styles.videoMensaje}>
        <Text style={styles.textoSecundario}>
          No se pudo cargar el video. Necesitás conexión a internet o tenerlo descargado previamente.
        </Text>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={styles.videoMensaje}>
        <ActivityIndicator size="small" color="#1E3A8A" />
        <Text style={styles.textoSecundario}>
          Cargando video...
        </Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={styles.videoPresentacion}
      nativeControls
      contentFit="contain"
    />
  );
}



export default function FichaComercioScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [resenasMostrar, setResenasMostrar] = useState<Resena[]>([]);
  const [errorResenas, setErrorResenas] = useState(false);

  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargandoPromociones, setCargandoPromociones] = useState(true);
  const [errorPromociones, setErrorPromociones] = useState(false);

  const [origenCache, setOrigenCache] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState<string | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  const { usuario } = useAuth();
  const pedirLogin = useAvisoLogin();
  const { preferencias, alternarComercioFavorito } = usePromociones();
  const favorito = Boolean(
    usuario && id && preferencias.comerciosFavoritos.includes(id),
  );
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);


  useEffect(() => {
    let vigente = true;

    async function cargarComercio() {
      setCargando(true);

      try {
        const resultado = id
          ? await obtenerComercioPorIdConEstado(id)
          : null;

        if (vigente) {
          setComercio(resultado?.comercio ?? null);
          setOrigenCache(resultado?.origen === "sqlite");
          setActualizadoEn(resultado?.actualizadoEn ?? null);
        }
      } catch (error) {
        console.error("Error cargando ficha:", error);

        if (vigente) {
          setComercio(null);
          setOrigenCache(false);
          setActualizadoEn(null);
        }
      } finally {
        if (vigente) {
          setCargando(false);
        }
      }
    }

    void cargarComercio();

    return () => {
      vigente = false;
    };
  }, [id]);


  useEffect(() => {
    let vigente = true;

    async function cargarResenas() {
      setErrorResenas(false);

      if (!id) {
        setResenasMostrar([]);
        return;
      }

      try {
        const resultado = await obtenerResenasPorComercio(id);

        if (vigente) {
          setResenasMostrar(resultado);
        }
      } catch (error) {
        console.warn("No se pudieron cargar las reseñas:", error);

        if (vigente) {
          setResenasMostrar([]);
          setErrorResenas(true);
        }
      }
    }

    void cargarResenas();

    return () => {
      vigente = false;
    };
  }, [id]);


  useEffect(() => {
    let vigente = true;

    async function cargarPromociones() {
      setCargandoPromociones(true);
      setErrorPromociones(false);

      if (!id) {
        setPromociones([]);
        setCargandoPromociones(false);
        return;
      }

      try {
        const resultado = await obtenerPromocionesVigentesPorComercio(id);

        if (vigente) {
          setPromociones(resultado);
        }
      } catch (error) {
        console.warn("No se pudieron cargar las promociones:", error);

        if (vigente) {
          setPromociones([]);
          setErrorPromociones(true);
        }
      } finally {
        if (vigente) {
          setCargandoPromociones(false);
        }
      }
    }

    void cargarPromociones();

    return () => {
      vigente = false;
    };
  }, [id]);


  useEffect(() => {
    let vigente = true;

    function actualizarEstadoConexion(
      estado: Network.NetworkState,
    ) {
      if (!vigente) return;

      const sinInternet =
        estado.isConnected !== true ||
        estado.isInternetReachable === false;

      setSinConexion(sinInternet);
    }

    async function comprobarConexion() {
      try {
        const estado = await Network.getNetworkStateAsync();
        actualizarEstadoConexion(estado);
      } catch (error) {
        console.warn("No se pudo comprobar la conexión:", error);

        if (vigente) {
          setSinConexion(true);
        }
      }
    }

    void comprobarConexion();

    const suscripcion = Network.addNetworkStateListener(
      actualizarEstadoConexion,
    );

    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, []);


  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);


  async function abrirEnlace(url: string | null | undefined) {
    if (!url) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("No se pudo abrir el enlace:", error);
    }
  }


  function abrirRuta(modo: "walking" | "driving") {
    if (!comercio) return;

    const destino = `${comercio.coordenadas.latitud},${comercio.coordenadas.longitud}`;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=${modo}`;

    void abrirEnlace(url);
  }


  async function cambiarFavorito() {
    if (!comercio || guardandoFavorito) return;

    if (!usuario) {
      pedirLogin("Necesitás una cuenta para guardar comercios favoritos.");
      return;
    }
    setGuardandoFavorito(true);

    try {
      await alternarComercioFavorito(comercio.id);
    } catch (error) {
      console.error("Error actualizando favorito:", error);
    } finally {
      setGuardandoFavorito(false);
    }
  }



  async function recargarResenas() {
    if (!id) return;

    setErrorResenas(false);

    try {
      const resultado = await obtenerResenasPorComercio(id);
      setResenasMostrar(resultado);
    } catch (error) {
      console.warn("Error recargando reseñas:", error);
      setErrorResenas(true);
    }
  }



  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.textoSecundario}>Cargando comercio...</Text>
      </SafeAreaView>
    );
  }

  if (!comercio) {
    return (
      <SafeAreaView style={styles.centrado}>
        <Text style={styles.tituloSeccion}>No encontramos este comercio</Text>

        <Text style={styles.textoSecundario}>
          Puede que haya sido eliminado o que el enlace no sea válido.
        </Text>
      </SafeAreaView>
    );
  }

  const horarios = [...comercio.horarios].sort((a, b) => a.dia - b.dia);
  const nombreRubro = NOMBRES_RUBROS[comercio.rubroId] ?? "Comercio";

  const datosDesactualizados = actualizadoEn
    ? ahora - new Date(actualizadoEn).getTime() > 24 * 60 * 60 * 1000
    : false;

  const videoUrl = comercio.videoUrl;

  const whatsapp = comercio.whatsapp
    ? `https://wa.me/${comercio.whatsapp.replace(/\D/g, "")}`
    : null;

  const instagram = comercio.instagram
    ? `https://www.instagram.com/${comercio.instagram
      .replace(/^@/, "")
      .replace(/\//g, "")}/`
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {origenCache && datosDesactualizados && (
          <BannerConexion
            sinConexion={sinConexion}
            origenCache={origenCache}
            actualizadoEn={actualizadoEn}
          />
        )}
        {comercio.imagenes && comercio.imagenes.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.galeria}
          >
            {comercio.imagenes.map((url, index) => (
              <FotoGaleria key={`${url}-${index}`} uri={url} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.sinImagen}>
            <Text style={styles.icono}>🏪</Text>
            <Text style={styles.textoSinImagen}>
              Este comercio todavía no tiene fotos
            </Text>
          </View>
        )}

        <View style={styles.encabezado}>
          <Text style={styles.etiqueta}>FICHA DEL COMERCIO</Text>

          <Text style={styles.titulo}>{comercio.nombre}</Text>

          <Text style={styles.rubro}>{nombreRubro}</Text>

          <View style={styles.filaPuntuacion}>
            <Text style={styles.puntuacion}>
              ★ {comercio.puntaje.toFixed(1).replace(".", ",")}
            </Text>

            <Text style={styles.textoSecundario}>
              ({comercio.cantidadResenas} reseñas)
            </Text>
          </View>

          <Pressable
            onPress={() => void cambiarFavorito()}
            disabled={guardandoFavorito}
            style={[
              styles.botonSecundario,
              favorito && {
                backgroundColor: "#E0F2FE",
                borderColor: "#1E3A8A",
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{
              selected: favorito,
              disabled: guardandoFavorito,
            }}
          >
            <Text
              style={[
                styles.textoBotonSecundario,
                favorito && { color: "#1E3A8A" },
              ]}
            >
              {guardandoFavorito
                ? "Guardando..."
                : favorito
                  ? "★ Guardado en favoritos"
                  : "☆ Agregar a favoritos"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Sobre el comercio</Text>
          <Text style={styles.descripcion}>{comercio.descripcion}</Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Promociones vigentes</Text>


          {cargandoPromociones ? (
            <Text style={styles.textoSecundario}>
              Buscando promociones...
            </Text>
          ) : errorPromociones ? (
            <Text style={styles.textoSecundario}>
              No se pudieron cargar las promociones. Necesitás conexión a internet para consultarlas.
            </Text>
          ) : promociones.length > 0 ? (
            promociones.map((promocion) => (
              <View key={promocion.id} style={styles.promocionItem}>
                <View style={styles.filaPromocion}>
                  {promocion.descuento !== null && (
                    <Text style={styles.descuento}>
                      {promocion.descuento}% OFF
                    </Text>
                  )}

                  {promocion.soloApp && (
                    <Text style={styles.etiquetaExclusiva}>
                      EXCLUSIVA DE LA APP
                    </Text>
                  )}
                </View>

                <Text style={styles.tituloPromocion}>{promocion.titulo}</Text>
                <Text style={styles.descripcion}>{promocion.detalle}</Text>

                <Text style={styles.fechaVencimiento}>
                  Válida hasta {formatearFecha(promocion.hasta)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.textoSecundario}>
              Este comercio no tiene promociones vigentes.
            </Text>
          )}

        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Contacto y ubicación</Text>

          <Text style={styles.etiquetaDato}>Dirección</Text>
          <Text style={styles.valorDato}>{comercio.direccion}</Text>

          {comercio.telefono && (
            <Pressable
              onPress={() => abrirEnlace(`tel:${comercio.telefono}`)}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonSecundario}>
                Llamar · {comercio.telefono}
              </Text>
            </Pressable>
          )}

          {whatsapp && (
            <Pressable
              onPress={() => abrirEnlace(whatsapp)}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonSecundario}>
                Contactar por WhatsApp
              </Text>
            </Pressable>
          )}

          {instagram && (
            <Pressable
              onPress={() => abrirEnlace(instagram)}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonSecundario}>
                Ver Instagram · {comercio.instagram}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => abrirRuta("walking")}
            style={styles.botonSecundario}
            accessibilityRole="button"
          >
            <Text style={styles.textoBotonSecundario}>
              Indicaciones caminando
            </Text>
          </Pressable>

          <Pressable
            onPress={() => abrirRuta("driving")}
            style={styles.botonPrincipal}
            accessibilityRole="button"
          >
            <Text style={styles.textoBotonPrincipal}>
              Indicaciones en auto
            </Text>
          </Pressable>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Horarios de atención</Text>

          {horarios.length > 0 ? (
            horarios.map((horario, index) => (
              <View
                key={`${horario.dia}-${horario.abre}-${horario.cierra}-${index}`}
                style={styles.filaHorario}
              >
                <Text style={styles.diaHorario}>{DIAS[horario.dia]}</Text>

                <Text style={styles.horaHorario}>
                  {horario.abre} - {horario.cierra}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.textoSecundario}>
              Los horarios todavía no están disponibles.
            </Text>
          )}
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Medios de pago</Text>

          {comercio.mediosDePago.length > 0 ? (
            <View style={styles.filaPagos}>
              {comercio.mediosDePago.map((medio, index) => (
                <View key={`${medio}-${index}`} style={styles.chipPago}>
                  <Text style={styles.textoPago}>
                    {medio.charAt(0).toUpperCase() +
                      medio.slice(1).replace(/_/g, " ")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.textoSecundario}>
              No se especificaron medios de pago.
            </Text>
          )}
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Reseñas</Text>

          <View style={styles.filaPuntuacion}>
            <Text style={styles.puntuacion}>
              ★ {comercio.puntaje.toFixed(1).replace(".", ",")}
            </Text>

            <Text style={styles.textoSecundario}>
              {comercio.cantidadResenas} reseñas en total
            </Text>
          </View>

          {errorResenas && (
            <Text style={styles.textoSecundario}>
              No se pudieron cargar las reseñas. Necesitás conexión a internet para consultarlas.
            </Text>
          )}

          <ResenasSeccion
            comercioId={comercio.id}
            resenas={resenasMostrar}
            onCambio={recargarResenas}
          />

        </View>

        {videoUrl ? (
          <View style={styles.tarjeta}>
            <Text style={styles.tituloSeccion}>Video de presentación</Text>

            <Text style={styles.textoSecundario}>
              Conocé un poco más sobre este comercio.
            </Text>

            <VideoPresentacion url={videoUrl} />

            <Text style={styles.textoSecundario}>
              Video de presentación de hasta 30 segundos.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contenido: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  imagen: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  galeria: {
    gap: 12,
  },
  imagenGaleria: {
    width: 300,
    height: 220,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  imagenGaleriaError: {
    width: 300,
    height: 220,
    flexShrink: 0,
  },
  sinImagen: {
    height: 180,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  icono: {
    fontSize: 42,
    color: "#1E3A8A",
    marginBottom: 8,
  },
  textoSinImagen: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  encabezado: {
    gap: 8,
    paddingVertical: 4,
  },
  etiqueta: {
    color: "#1E3A8A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  titulo: {
    color: "#1E3A8A",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  rubro: {
    color: "#64748B",
    fontSize: 13,
  },
  filaPuntuacion: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  puntuacion: {
    color: "#B45309",
    fontSize: 15,
    fontWeight: "800",
  },
  textoSecundario: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    gap: 12,
  },
  tituloSeccion: {
    color: "#1E3A8A",
    fontSize: 21,
    fontWeight: "700",
  },
  descripcion: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 22,
  },
  promocionItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  filaPromocion: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  descuento: {
    color: "#1E3A8A",
    fontSize: 15,
    fontWeight: "800",
  },
  etiquetaExclusiva: {
    color: "#1E3A8A",
    backgroundColor: "#E0F2FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: "800",
  },
  tituloPromocion: {
    color: "#1E3A8A",
    fontSize: 15,
    fontWeight: "800",
  },
  fechaVencimiento: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  etiquetaDato: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  valorDato: {
    color: "#1E3A8A",
    fontSize: 14,
    fontWeight: "600",
  },
  botonSecundario: {
    minHeight: 50,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 13,
  },
  textoBotonSecundario: {
    color: "#1E3A8A",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },
  botonPrincipal: {
    minHeight: 50,
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  filaHorario: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  diaHorario: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  horaHorario: {
    color: "#1E3A8A",
    fontSize: 13,
  },
  filaPagos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipPago: {
    backgroundColor: "#E0F2FE",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textoPago: {
    color: "#1E3A8A",
    fontSize: 12,
    fontWeight: "600",
  },
  resenaItem: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 14,
    marginTop: 4,
    gap: 9,
  },
  filaResena: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  estrellasResena: {
    color: "#B45309",
    fontSize: 15,
    fontWeight: "800",
  },
  fechaResena: {
    color: "#64748B",
    fontSize: 11,
  },
  comentarioResena: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
  respuestaComercio: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  etiquetaRespuesta: {
    color: "#1E3A8A",
    fontSize: 11,
    fontWeight: "800",
  },
  videoPresentacion: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111111",
  },
  videoMensaje: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
});
