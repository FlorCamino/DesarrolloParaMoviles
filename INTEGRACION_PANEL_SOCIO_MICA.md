# Integración del módulo Panel del Socio (Comercio + QR + Reseñas)
Se añadieron las funciones del socio conservando el trabajo previo del grupo. Todo funciona actualmente con datos de prueba; **queda pendiente la conexión a la API**.

## Se agregó:
- **Panel del comercio**, visible solo para cuentas con rol `comercio` desde el botón en la pantalla de Inicio.
- **Mis promociones:** listado con `FlatList` y estadísticas del uso de las promociones (usos totales, promos activas y promo más usada)
	- Creación, edición y baja lógica de promociones, una promoción vencida no se puede editar.
- **Validar Código QR** del cliente:
	- Escaneo de QR con `expo-camera` o ingreso manual
	- Vibración de éxito o error con `expo-haptics`
	- Autenticación con huella o patrón antes de mostrar la cámara para escanear el QR (`expo-local-authentication)
	- Bloqueo de validación si no hay conexión de internet
- **Mi comercio:**
	- Descripción, dirección, teléfono, WhatsApp, Instagram y medios de pago
	- Subir o eliminar hasta 8 fotos con `expo-image-picker`
	- Video de presentación (MP4, máximo 30 segundos y 30 MB)
	- Ubicación en el mapa con `expo-location` y avisa si se cambia la dirección sin actualizarla
- **Horarios:**
	- Varios tramos por día (para aquellos que corten por el mediodía), validación formato `HH:MM`, apertura anterior al cierre y tramos solapados.
- **Reseñas:**
	- Listado con filtro "Sin responder", validación de respuesta única por reseña y botón para reportar reseñas ofensivas
		- *Nota:* Hueco en el PRD, no menciona quién puede reportar la reseña, si el comercio o el usuario o ambos ni qué sucede cuando se las reporta.
- Margen inferior (safe area) en listas y formularios para que los botones de Android no tapen el contenido.

## Archivos modificados
- `package.json` -> se agregan `expo-camera` y `expo-image-picker`; `expo-install` hizo cambios en las versiones de parche de otros paquetes de Expo
- `package-lock.json`
- `app.json` -> plugins de `expo-camera` y `expo-image-picker`, con mensajes de permiso
- `src/app/(tabs)/index.tsx` -> botón "Ir al panel de mi comercio" visible para el rol `comercio`

## Carpetas y archivos nuevos
- `src/app/panel_socio`
	- `_layout.tsx`
	- `index.tsx` (menu del panel)
	- `promociones.tsx` (lista y estadística)
	- `promocion_formulario` (crear y editar)
	- `validar_codigo.tsx`
	- `mi_comercio.tsx`
	- `horarios.tsx`
	- `resenas.tsx`
- `src/services/panel-comercio.ts`
## Para probar:
```
npm install
npx expo start -c
```

1. Abrir Expo Go en el teléfono y escanear el QR.
2. Iniciar sesión con cuenta de comercio (`tornillo@mail.com`  - contraseña `123456`) y entrar a **Inicio -> Ir al panel de mi comercio** 
	1. **Mis promociones:** crear, editar y dar de baja una promoción, ver las estadísticas
	2. **Validar código:** confirmar la huella y validar `CCU-441-512-1123` (código de Marta para "15% en pinturas"). Repetirlo debería dar "ya validado".
	3. **Mi comercio:** cambiar un dato, agregar una foto y video, actualizar ubicación
	4. **Horarios:** cambiar la hora de un día, agregar un tramo, probar horarios inválidos
	5. **Reseñas:** responder una reseña y reportar otra

 El panel no debería aparecer si uno entra con una cuenta de vecino (`marta@mail.com` - contraseña `123456`).

**Los datos de prueba viven en memoria, al recargar vuelven al valor original.**

## Pendientes
- **Conexión a la API real**
- **Reseñas del vecino:** crear, editar, borrar y reportar
- **Detección de conexión**
- **Cierre por vacaciones**