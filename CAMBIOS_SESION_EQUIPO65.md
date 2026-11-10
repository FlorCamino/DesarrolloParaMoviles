# Integración de sesión y permisos — Equipo 65

## Cambios en esta entrega

- Las pantallas del directorio y de la ficha comparten **los mismos favoritos** que el contexto de promociones y avisos.
- Un visitante puede consultar comercios y promociones, pero para **marcar favoritos, guardar promociones, usar un QR, configurar rubros o avisos** se exige login.
- Se quitó el identificador ficticio `usuario-sin-sesion` del flujo de QR.
- Preferencias del módulo de promociones separadas por ID de usuario en `expo-sqlite/kv-store` (versión 2); un cambio de usuario remonta el proveedor y evita mostrar temporalmente preferencias del anterior.
- `src/utils/permisos.ts` reúne funciones para exigir sesión o rol socio a nivel aplicación. **La API debe comprobar permisos nuevamente en el backend.**
- La navegación del socio sigue protegida por `Stack.Protected` (ya existente).

## Atención a los otros integrantes

- Ya no utilizar `src/services/favorites.ts` desde pantallas. Leer `preferencias.comerciosFavoritos` y utilizar `alternarComercioFavorito()` del contexto.
- El almacenamiento global antiguo de favoritos NO se migra para evitar transferir datos de una cuenta a otra. Favoritos y preferencias antiguos guardados como globales tendrán que volver a seleccionarse.
- Los mocks siguen en servicios de comercios, promociones, reseñas y panel del socio; **no se reemplazaron sin el Swagger/OpenAPI real de la API de la cátedra**. No asumir rutas o formatos. Los endpoints de auth sí son reales: POST /auth/registro, POST /auth/ingreso, GET /yo.
- Las preferencias y favoritos quedan persistidos localmente por usuario; **todavía no están sincronizados con el backend**. La API de usuarios puede requerir endpoints adicionales que deben documentarse antes de integrar.

## Casos para probar en teléfono

1. Invitado: puede navegar, pero al pulsar ★, guardar promo o mostrar QR se ofrece login.
2. Vecino A: guardar comercio desde directorio; comprobar estrella en ficha, promociones y avisos. Cerrar y abrir; comprobar persistencia.
3. Cerrar sesión e ingresar con vecino B: no hereda los favoritos ni intereses del vecino A.
4. Volver a entrar con vecino A: conserva sus preferencias locales.
5. Cuenta socio: permite abrir el panel; vecino y visitante no pueden abrirlo.
6. Invalidar token: al reingresar biométricamente y recibir 401, solicita login manual.
7. Probar notificaciones en APK antes de grabar: siguen siendo un pendiente de integración de ese módulo.

## Limitaciones de esta entrega

- No fue posible compilar APK ni realizar prueba nativa aquí.
- No se adjunta Swagger de comercios/promociones/reseñas ni URL de API alcanzable desde este entorno; no se han inventado rutas ni se ha afirmado una conexión inexistente.

## Verificación realizada

- `npm test`: **12/12 aprobadas** (9 existentes y 3 nuevas de roles).
- `npm run typecheck`: **0 errores** utilizando las dependencias del ZIP original.
- ESLint: no concluyó en este entorno debido a una dependencia nativa opcional (`unrs-resolver`) ausente/incompatible al extraer `node_modules` del ZIP de Windows. Ejecutar `npm ci` y `npm run lint -- --no-cache` en la máquina de desarrollo.
