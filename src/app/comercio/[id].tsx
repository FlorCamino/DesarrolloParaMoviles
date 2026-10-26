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

import { obtenerComercioPorId } from "@/servicios/comercios";
import { alternarFavorito, obtenerFavoritos } from "@/servicios/favoritos";
import { obtenerPromocionesVigentesPorComercio } from "@/servicios/promociones";
import type { Comercio, Promocion } from "@/tipos/comercio";

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

const RESENAS_EJEMPLO = [
  {
    id: "res-2210",
    comercioId: "com-118",
    usuarioNombre: "Marta G.",
    estrellas: 5,
    comentario:
      "Tenían el tornillo raro que no conseguía en ningún lado. Excelente atención.",
    respuesta: "¡Gracias por tu comentario! Siempre estamos para ayudarte.",
    creadaEn: "2026-10-18T17:05:00-03:00",
  },
  {
    id: "res-2211",
    comercioId: "com-118",
    usuarioNombre: "Carlos M.",
    estrellas: 4,
    comentario: "Muy buena atención y bastante variedad de herramientas.",
    respuesta: null,
    creadaEn: "2026-10-14T11:30:00-03:00",
  },
  {
    id: "res-2212",
    comercioId: "com-118",
    usuarioNombre: "Lucía R.",
    estrellas: 5,
    comentario:
      "Me asesoraron muy bien para elegir la pintura. Volvería a comprar.",
    respuesta: "¡Muchas gracias por confiar en nosotros!",
    creadaEn: "2026-10-08T16:20:00-03:00",
  },
  {
    id: "res-2213",
    comercioId: "com-205",
    usuarioNombre: "Sofía P.",
    estrellas: 5,
    comentario: "Las facturas son riquísimas y siempre están frescas.",
    respuesta: null,
    creadaEn: "2026-10-20T09:15:00-03:00",
  },
];

function FotoGaleria({ uri }: { uri: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View style={[styles.sinImagen, styles.imagenGaleriaError]}>
        <Text style={styles.textoSinImagen}>Foto no disponible</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.imagenGaleria}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}

function VideoPresentacion({ url }: { url: string }) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
  });

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

  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargandoPromociones, setCargandoPromociones] = useState(true);

  const [favorito, setFavorito] = useState(false);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  useEffect(() => {
    let vigente = true;

    async function cargarComercio() {
      setCargando(true);

      try {
        const resultado = id ? await obtenerComercioPorId(id) : null;

        if (vigente) {
          setComercio(resultado);
        }
      } catch (error) {
        console.error("Error cargando comercio:", error);

        if (vigente) {
          setComercio(null);
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

    async function cargarPromociones() {
      setCargandoPromociones(true);

      try {
        if (!id) {
          if (vigente) {
            setPromociones([]);
          }
          return;
        }

        const resultado = await obtenerPromocionesVigentesPorComercio(id);

        if (vigente) {
          setPromociones(resultado);
        }
      } catch (error) {
        console.error("Error cargando promociones:", error);

        if (vigente) {
          setPromociones([]);
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

    obtenerFavoritos()
      .then((ids) => {
        if (vigente && id) {
          setFavorito(ids.includes(id));
        }
      })
      .catch((error) => {
        console.error("Error cargando favoritos:", error);
      });

    return () => {
      vigente = false;
    };
  }, [id]);

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

  async function cambiarFavorito() {
    if (!comercio || guardandoFavorito) return;

    setGuardandoFavorito(true);

    try {
      const actualizados = await alternarFavorito(comercio.id);
      setFavorito(actualizados.includes(comercio.id));
    } catch (error) {
      console.error("Error actualizando favorito:", error);
    } finally {
      setGuardandoFavorito(false);
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

  const videoUrl = comercio.videoUrl;

  const whatsapp = comercio.whatsapp
    ? `https://wa.me/${comercio.whatsapp.replace(/\D/g, "")}`
    : null;

  const instagram = comercio.instagram
    ? `https://www.instagram.com/${comercio.instagram
        .replace(/^@/, "")
        .replace(/\//g, "")}/`
    : null;

  const resenasMostrar = RESENAS_EJEMPLO.filter(
    (resena) => resena.comercioId === comercio.id,
  ).sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.textoSecundario}>Buscando promociones...</Text>
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
            onPress={() =>
              abrirEnlace(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${comercio.direccion}, Concepción del Uruguay, Entre Ríos`,
                )}`,
              )
            }
            style={styles.botonPrincipal}
            accessibilityRole="button"
          >
            <Text style={styles.textoBotonPrincipal}>Cómo llegar</Text>
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

          {resenasMostrar.length > 0 ? (
            resenasMostrar.map((resena) => (
              <View key={resena.id} style={styles.resenaItem}>
                <View style={styles.filaResena}>
                  <Text style={styles.valorDato}>{resena.usuarioNombre}</Text>

                  <Text style={styles.estrellasResena}>
                    {"★".repeat(resena.estrellas)}
                    {"☆".repeat(5 - resena.estrellas)}
                  </Text>
                </View>

                <Text style={styles.fechaResena}>
                  {formatearFecha(resena.creadaEn)}
                </Text>

                <Text style={styles.comentarioResena}>{resena.comentario}</Text>

                {resena.respuesta ? (
                  <View style={styles.respuestaComercio}>
                    <Text style={styles.etiquetaRespuesta}>
                      Respuesta del comercio
                    </Text>

                    <Text style={styles.comentarioResena}>
                      {resena.respuesta}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.textoSecundario}>
              Este comercio todavía no tiene reseñas de ejemplo.
            </Text>
          )}
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
