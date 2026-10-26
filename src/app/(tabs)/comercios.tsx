import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buscarComercios } from "@/services/businesses";
import { alternarFavorito, obtenerFavoritos } from "@/services/favorites";
import type { Comercio } from "@/types/business";

type OpcionRubro = {
  id: string | null;
  nombre: string;
};

const RUBROS: OpcionRubro[] = [
  { id: null, nombre: "Todos" },
  { id: "rub-gastronomia", nombre: "Gastronomía" },
  { id: "rub-indumentaria", nombre: "Indumentaria" },
  { id: "rub-hogar", nombre: "Hogar" },
  { id: "rub-ferreteria", nombre: "Ferretería y construcción" },
  { id: "rub-salud", nombre: "Salud y farmacia" },
  { id: "rub-servicios", nombre: "Servicios" },
  { id: "rub-tecnologia", nombre: "Tecnología" },
  { id: "rub-libreria", nombre: "Librería" },
  { id: "rub-otros", nombre: "Otros" },
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

function estaAbiertoAhora(comercio: Comercio): boolean {
  const ahora = new Date();
  const diaActual = ahora.getDay();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  return comercio.horarios.some((horario) => {
    if (horario.dia !== diaActual) {
      return false;
    }

    const [horaAbre, minutoAbre] = horario.abre.split(":").map(Number);
    const [horaCierra, minutoCierra] = horario.cierra.split(":").map(Number);

    const apertura = horaAbre * 60 + minutoAbre;
    const cierre = horaCierra * 60 + minutoCierra;

    return minutosActuales >= apertura && minutosActuales < cierre;
  });
}

export default function HomeScreen() {
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [guardandoFavorito, setGuardandoFavorito] = useState<string | null>(
    null,
  );

  useFocusEffect(useCallback(() => {
    let vigente = true;

    obtenerFavoritos()
      .then((ids) => {
        if (vigente) {
          setFavoritos(ids);
        }
      })
      .catch((error) => {
        console.error("Error cargando favoritos:", error);
      });

    return () => {
      vigente = false;
    };
  }, []));
  const [termino, setTermino] = useState("");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(
    null,
  );
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    Promise.resolve().then(() => {
      if (!vigente) return [];
      setCargando(true);
      setError(false);
      return buscarComercios(termino, rubroSeleccionado ?? undefined);
    })
      .then((resultado) => {
        if (vigente) {
          setComercios(resultado);
        }
      })
      .catch(() => {
        if (vigente) {
          setComercios([]);
          setError(true);
        }
      })
      .finally(() => {
        if (vigente) {
          setCargando(false);
        }
      });

    return () => {
      vigente = false;
    };
  }, [termino, rubroSeleccionado, intento]);

  const comerciosVisibles = comercios.filter((comercio) => {
    const coincideAbiertos = !soloAbiertos || estaAbiertoAhora(comercio);
    const coincideFavoritos = !soloFavoritos || favoritos.includes(comercio.id);

    return coincideAbiertos && coincideFavoritos;
  });

  function mostrarFicha(comercio: Comercio) {
    router.push({
      pathname: "/comercio/[id]",
      params: { id: comercio.id },
    });
  }

  async function cambiarFavorito(comercioId: string) {
    if (guardandoFavorito !== null) {
      return;
    }

    setGuardandoFavorito(comercioId);

    try {
      const actualizados = await alternarFavorito(comercioId);
      setFavoritos(actualizados);
    } catch (error) {
      console.error("Error guardando favorito:", error);
    } finally {
      setGuardandoFavorito(null);
    }
  }

  function limpiarFiltros() {
    setTermino("");
    setRubroSeleccionado(null);
    setSoloAbiertos(false);
    setSoloFavoritos(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.etiqueta}>DESCUBRÍ TU CIUDAD</Text>

          <Text style={styles.titulo}>Comercios cerca tuyo</Text>

          <Text style={styles.subtitulo}>
            Encontrá lo que necesitás y apoyá a los comercios locales.
          </Text>
        </View>

        <View style={styles.buscador}>
          <Text style={styles.lupa}>⌕</Text>

          <TextInput
            value={termino}
            onChangeText={setTermino}
            placeholder="Buscar comercios o productos..."
            placeholderTextColor="#858D87"
            style={styles.input}
            returnKeyType="search"
            accessibilityLabel="Buscar comercios por nombre o descripción"
          />

          {termino.length > 0 && (
            <Pressable
              onPress={() => setTermino("")}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              hitSlop={8}
            >
              <Text style={styles.limpiar}>✕</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.tituloSeccion}>Explorá por rubro</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rubros}
        >
          {RUBROS.map((rubro) => {
            const seleccionado = rubroSeleccionado === rubro.id;

            return (
              <Pressable
                key={rubro.nombre}
                onPress={() => setRubroSeleccionado(rubro.id)}
                style={[styles.chip, seleccionado && styles.chipSeleccionado]}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
              >
                <Text
                  style={[
                    styles.textoChip,
                    seleccionado && styles.textoChipSeleccionado,
                  ]}
                >
                  {rubro.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.filaResultados}>
          <View style={styles.encabezadoResultados}>
            <Text style={styles.tituloResultados}>Directorio</Text>

            <Text style={styles.contador}>
              {comerciosVisibles.length}{" "}
              {comerciosVisibles.length === 1 ? "comercio" : "comercios"}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <Pressable
            onPress={() => setSoloAbiertos((actual) => !actual)}
            style={[styles.filtroAbiertos, soloAbiertos && styles.filtroActivo]}
            accessibilityRole="button"
            accessibilityState={{ selected: soloAbiertos }}
          >
            <View
              style={[styles.checkbox, soloAbiertos && styles.checkboxActivo]}
            >
              {soloAbiertos && <Text style={styles.check}>✓</Text>}
            </View>

            <Text style={styles.textoFiltro}>Abierto ahora</Text>
          </Pressable>

          <Pressable
            onPress={() => setSoloFavoritos((actual) => !actual)}
            style={[
              styles.filtroAbiertos,
              soloFavoritos && styles.filtroActivo,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: soloFavoritos }}
          >
            <Text
              style={{
                color: soloFavoritos ? "#1E3A8A" : "#64748B",
                fontSize: 14,
              }}
            >
              ★ Favoritos
            </Text>
          </Pressable>
        </View>

        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.textoVacio}>Cargando comercios...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <Text style={styles.tituloVacio}>
              No pudimos cargar los comercios
            </Text>

            <Text style={styles.textoVacio}>
              Revisá la conexión e intentá nuevamente.
            </Text>

            <Pressable
              onPress={() => setIntento((actual) => actual + 1)}
              style={styles.botonReintentar}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotonReintentar}>Volver a intentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={comerciosVisibles}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.lista,
              comerciosVisibles.length === 0 && styles.listaVacia,
            ]}
            renderItem={({ item }) => {
              const abierto = estaAbiertoAhora(item);
              const nombreRubro = NOMBRES_RUBROS[item.rubroId] ?? "Comercio";

              return (
                <Pressable
                  onPress={() => mostrarFicha(item)}
                  style={({ pressed }) => [
                    styles.tarjeta,
                    pressed && styles.tarjetaPresionada,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver comercio ${item.nombre}`}
                >
                  <View style={styles.tarjetaCabecera}>
                    <View style={styles.iconoComercio}>
                      <Text style={styles.iconoTexto}>▦</Text>
                    </View>

                    <View style={styles.datosComercio}>
                      <Text style={styles.nombreComercio}>{item.nombre}</Text>

                      <Text style={styles.rubroComercio}>{nombreRubro}</Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={favoritos.includes(item.id) ? 'Quitar de favoritos' : 'Guardar favorito'}
                      disabled={guardandoFavorito !== null}
                      onPress={(event) => { event.stopPropagation(); void cambiarFavorito(item.id); }}
                      style={{ padding: 12 }}>
                      <Text style={styles.favorito}>{favoritos.includes(item.id) ? '★' : '☆'}</Text>
                    </Pressable>
                    <Text style={styles.flecha}>›</Text>
                  </View>

                  <Text style={styles.descripcion} numberOfLines={2}>
                    {item.descripcion}
                  </Text>

                  <View style={styles.separador} />

                  <View style={styles.pieTarjeta}>
                    <View
                      style={[
                        styles.estado,
                        abierto ? styles.estadoAbierto : styles.estadoCerrado,
                      ]}
                    >
                      <View
                        style={[
                          styles.puntoEstado,
                          abierto ? styles.puntoAbierto : styles.puntoCerrado,
                        ]}
                      />

                      <Text
                        style={[
                          styles.textoEstado,
                          abierto ? styles.textoAbierto : styles.textoCerrado,
                        ]}
                      >
                        {abierto ? "Abierto ahora" : "Cerrado"}
                      </Text>
                    </View>

                    <Text style={styles.puntuacion}>
                      ★ {item.puntaje > 0 ? item.puntaje.toFixed(1) : "—"}
                      <Text style={styles.resenas}>
                        {" "}
                        ({item.cantidadResenas})
                      </Text>
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.vacio}>
                <Text style={styles.emojiVacio}>⌕</Text>

                <Text style={styles.tituloVacio}>No encontramos comercios</Text>

                <Text style={styles.textoVacio}>
                  Probá con otro nombre o seleccioná un rubro diferente.
                </Text>

                <Pressable
                  onPress={limpiarFiltros}
                  style={styles.botonReintentar}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotonReintentar}>
                    Limpiar filtros
                  </Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  header: {
    paddingTop: 18,
    paddingBottom: 20,
  },
  etiqueta: {
    color: "#1E3A8A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  titulo: {
    color: "#1E3A8A",
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "800",
  },
  subtitulo: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  buscador: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 23,
  },
  lupa: {
    fontSize: 27,
    color: "#1E3A8A",
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#1E3A8A",
    fontSize: 14,
    paddingVertical: 12,
  },
  limpiar: {
    color: "#64748B",
    fontSize: 18,
    padding: 5,
  },
  tituloSeccion: {
    color: "#1E3A8A",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 12,
  },
  rubros: {
    gap: 8,
    paddingBottom: 22,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 30,
  },
  chipSeleccionado: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  textoChip: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  textoChipSeleccionado: {
    color: "#FFFFFF",
  },
  filaResultados: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  encabezadoResultados: {
    flexShrink: 1,
  },
  tituloResultados: {
    color: "#1E3A8A",
    fontSize: 20,
    fontWeight: "800",
  },
  contador: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  filtroAbiertos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  filtroActivo: {
    borderColor: "#1E3A8A",
    backgroundColor: "#E0F2FE",
  },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActivo: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  check: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  textoFiltro: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  lista: {
    paddingBottom: 24,
    gap: 12,
  },
  listaVacia: {
    flexGrow: 1,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tarjetaPresionada: {
    opacity: 0.8,
  },
  tarjetaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconoComercio: {
    width: 48,
    height: 48,
    backgroundColor: "#E0F2FE",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconoTexto: {
    fontSize: 25,
    color: "#1E3A8A",
  },
  datosComercio: {
    flex: 1,
  },
  nombreComercio: {
    color: "#1E3A8A",
    fontSize: 15,
    fontWeight: "700",
  },
  rubroComercio: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 5,
  },
  favorito: { color: "#1E3A8A", fontSize: 24 },
  flecha: {
    color: "#1E3A8A",
    fontSize: 28,
  },
  descripcion: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
  separador: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 13,
  },
  pieTarjeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoAbierto: {
    backgroundColor: "#E7F6EC",
  },
  estadoCerrado: {
    backgroundColor: "#F1F5F9",
  },
  puntoEstado: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  puntoAbierto: {
    backgroundColor: "#1E3A8A",
  },
  puntoCerrado: {
    backgroundColor: "#94A3B8",
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: "700",
  },
  textoAbierto: {
    color: "#1E3A8A",
  },
  textoCerrado: {
    color: "#64748B",
  },
  puntuacion: {
    color: "#B45309",
    fontWeight: "800",
    fontSize: 12,
  },
  resenas: {
    color: "#64748B",
    fontWeight: "500",
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  vacio: {
    alignItems: "center",
    paddingTop: 45,
    paddingHorizontal: 20,
  },
  emojiVacio: {
    fontSize: 42,
    color: "#1E3A8A",
    marginBottom: 12,
  },
  tituloVacio: {
    color: "#1E3A8A",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  textoVacio: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  botonReintentar: {
    marginTop: 14,
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  textoBotonReintentar: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
});
