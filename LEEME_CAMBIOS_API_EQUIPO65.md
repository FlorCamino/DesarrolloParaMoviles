# Equipo 65 — Parche de integración de API (9/11/2026)

Este ZIP contiene **únicamente los archivos nuevos/modificados**. Copiar su contenido sobre la raíz del proyecto `TFI-DesMov-Equipo65`, conservando las carpetas. No borrar los demás archivos.

## Cambios
- Catálogo real (`GET /comercios`, con paginación), guardado en SQLite para uso offline cuando corresponde.
- Rubros y promociones reales (`GET /rubros` y `/promociones`); se combinan vigentes y próximas. Los modos de prueba `vacio` y `error` permanecen para el comportamiento de demostración.
- Generación de QR real (`POST /promociones/:id/usos`), validación real en el panel (`POST /mi-comercio/usos/validar`). El servidor controla la sesión y evita reutilizaciones.
- Ficha de reseñas de la API y funciones de crear/editar/borrar/reportar para conectar a la interfaz del vecino. **La interfaz del vecino aún no incorpora esos botones**; siguen pendientes.
- Panel de socio conectado a su CRUD real, gestión de horarios, respuestas a reseñas y subida `multipart/form-data` de imágenes/videos mediante `POST /archivos`.
- Favoritos y preferencias sincronizados con `GET/PATCH /yo` y `PUT/DELETE /yo/favoritos/:comercioId`; siguen almacenándose por usuario para el modo offline. Las operaciones de edición exigen conexión a la API.
- Cliente HTTP actual con `fetch` y Bearer sin añadir Axios, porque el cambio solicitado es conectar la API sin reescribir la arquitectura existente.

## Antes de ejecutar
1. Abrir Docker Desktop y comprobar `http://localhost:3000/salud` desde la PC.
2. En `.env.local` colocar `EXPO_PUBLIC_API_URL=http://IP_REAL_DE_TU_PC:3000`. La IP debe ser alcanzable desde el Samsung en la misma Wi-Fi. `.env.example` es una plantilla; no es la configuración activa.
3. En la PC: `npm install`, `npx expo start --clear` y probar en móvil.
4. Para que las URLs de archivos devueltas por el backend sean accesibles desde el teléfono, configurar `URL_PUBLICA=http://IP_REAL_DE_TU_PC:3000` en el entorno de Docker Compose, y recrear los contenedores. Comprobar el valor con el README del backend. Si la API está publicada, usar HTTPS.
5. No copiar secretos del backend (`JWT_SECRETO`) a la app.

## Recorridos de prueba
- Invitado: listar comercios/promociones; no puede guardar favoritos ni generar QR.
- Vecino `marta@mail.com``demo1234`: login, favorito (ficha y avisos), salir/volver a entrar, generar QR de promoción vigente.
- Socio `tornillo@demo.ar``demo1234`: login, entrar al panel, editar datos, crear promoción con fecha futura, validar QR del vecino, verificar cantidad de usos y persistencia después de reiniciar Docker/app.
- Probar sin red con caché creada previamente. Comprobar errores de API para operaciones que sí necesitan red.

## Aún pendiente / límites
- No se ejecutó el backend Docker ni una prueba real de dispositivo desde este entorno. Se verificaron TypeScript y las pruebas automatizadas existentes; no son pruebas extremo a extremo.
- La UI de **crear/editar/borrar/reportar reseñas** del vecino todavía debe conectarse a las funciones ya añadidas en `src/services/reviews.ts`.
- No se implementó la cola SQLite de reseñas sin conexión ni el uso explícito de `expo-file-system` para guardar fotos/video offline.
- El ordenamiento por distancia, navegación caminando/en auto, corrección del ícono y build APK final siguen pendientes.
- Los datos seed de promociones pueden haber vencido en la fecha actual: crear promociones vigentes de prueba desde el panel.
- Si antes de la copia ya había preferencias/favoritos locales del usuario, la API se considera fuente de verdad para esos datos cuando hay conexión.
