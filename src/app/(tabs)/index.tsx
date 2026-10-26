import { router } from "expo-router";
import { useEffect, useState } from "react";
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

import { buscarComercios } from "@/servicios/comercios";
import { alternarFavorito, obtenerFavoritos } from "@/servicios/favoritos";
import type { Comercio } from "@/tipos/comercio";

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

  useEffect(() => {
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
  }, []);
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

    setCargando(true);
    setError(false);

    buscarComercios(termino, rubroSeleccionado ?? undefined)
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
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F5" />

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
                color: soloFavoritos ? "#16845B" : "#536259",
                fontSize: 14,
              }}
            >
              ★ Favoritos
            </Text>
          </Pressable>
        </View>

        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#16845B" />
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
    backgroundColor: "#F5F7F5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 20,
  },
  etiqueta: {
    color: "#16845B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  titulo: {
    color: "#17352A",
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "800",
  },
  subtitulo: {
    color: "#65736B",
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
    borderColor: "#E5EAE5",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 23,
  },
  lupa: {
    fontSize: 27,
    color: "#16845B",
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#17352A",
    fontSize: 14,
    paddingVertical: 12,
  },
  limpiar: {
    color: "#65736B",
    fontSize: 18,
    padding: 5,
  },
  tituloSeccion: {
    color: "#17352A",
    fontSize: 16,
    fontWeight: "800",
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
    borderColor: "#E1E7E1",
    borderRadius: 30,
  },
  chipSeleccionado: {
    backgroundColor: "#173F30",
    borderColor: "#173F30",
  },
  textoChip: {
    color: "#58665D",
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
    color: "#17352A",
    fontSize: 20,
    fontWeight: "800",
  },
  contador: {
    color: "#7B867F",
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
    borderColor: "#DCE5DD",
    backgroundColor: "#FFFFFF",
  },
  filtroActivo: {
    borderColor: "#16845B",
    backgroundColor: "#E6F4EC",
  },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: "#A4B0A7",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActivo: {
    backgroundColor: "#16845B",
    borderColor: "#16845B",
  },
  check: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  textoFiltro: {
    color: "#536259",
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
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8ECE8",
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
    backgroundColor: "#E8F4EC",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconoTexto: {
    fontSize: 25,
    color: "#16845B",
  },
  datosComercio: {
    flex: 1,
  },
  nombreComercio: {
    color: "#17352A",
    fontSize: 15,
    fontWeight: "800",
  },
  rubroComercio: {
    color: "#758078",
    fontSize: 12,
    marginTop: 5,
  },
  flecha: {
    color: "#16845B",
    fontSize: 28,
  },
  descripcion: {
    color: "#626F66",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
  separador: {
    height: 1,
    backgroundColor: "#EDF0ED",
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
    backgroundColor: "#F1F2F1",
  },
  puntoEstado: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  puntoAbierto: {
    backgroundColor: "#16845B",
  },
  puntoCerrado: {
    backgroundColor: "#909891",
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: "700",
  },
  textoAbierto: {
    color: "#16845B",
  },
  textoCerrado: {
    color: "#6E7770",
  },
  puntuacion: {
    color: "#B58122",
    fontWeight: "800",
    fontSize: 12,
  },
  resenas: {
    color: "#808A82",
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
    color: "#16845B",
    marginBottom: 12,
  },
  tituloVacio: {
    color: "#17352A",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  textoVacio: {
    color: "#758078",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  botonReintentar: {
    marginTop: 14,
    backgroundColor: "#173F30",
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
