# Arquitectura y autenticación: API de la cátedra

Contrato consultado: http://localhost:3000/docs (9 de noviembre de 2026).

## Responsabilidad 1

- `services/http.ts`: transporte JSON, sobre `{ datos, meta }`, errores con código/estado/mensaje, Bearer opcional y tiempo máximo de 15 segundos.
- `services/api.ts`: dirección del servidor y entrada común para los servicios.
- `services/auth.ts`: POST `/auth/registro`, POST `/auth/ingreso` y GET `/yo`. El formulario usa `password`; el servicio lo transforma a `contrasena`.
- Registro e ingreso guardan la sesión en SecureStore. Nunca se guarda la contraseña.
- El reingreso biométrico consulta `/yo`; un 401 elimina la sesión. Sin conexión se permite abrir con la sesión local, y el servidor sigue autorizando cada operación remota.
- Las cuentas de comercio las crea el Centro Comercial; el registro público crea vecinos.

## Dirección del servidor

Copiar `.env.example` a `.env.local` y configurar `EXPO_PUBLIC_API_URL`:

- Computadora: `http://localhost:3000`.
- Emulador Android estándar: `http://10.0.2.2:3000`.
- Teléfono físico: `http://IP-LAN-DE-LA-COMPUTADORA:3000`, en una red accesible y con el servidor escuchando conexiones externas.

Reiniciar Expo al cambiar la configuración. Sin variable, en desarrollo se intenta el host de Metro; en un build se exige una URL explícita accesible desde el dispositivo. Para la entrega, definirla en el entorno de EAS antes de compilar. No colocar secretos en variables EXPO_PUBLIC.

## Responsabilidades de los otros módulos

Los servicios de comercios, promociones, reseñas y panel todavía usan mocks. Sus responsables deben migrarlos utilizando `solicitarApi<T>(ruta, opciones, token)`; pasar el token de la sesión activa cuando el endpoint lo exija. La respuesta conserva `meta` para implementar paginación. No importar mocks desde las pantallas ni guardar contraseñas para autenticar peticiones.

## Comprobaciones pendientes en teléfono

1. Registrar una cuenta, cerrar la app y reingresar con biometría.
2. Cerrar sesión e ingresar con la misma cuenta; verificar contraseña incorrecta y email repetido.
3. Probar alternativa manual sin biometría, cancelación biométrica y sesión inválida.
4. Abrir sin conexión y comprobar los estados de carga/error de ingreso.
5. Verificar acceso al panel sólo para una cuenta comercio con comercio asociado.
6. Compilar el APK preview con una URL accesible y repetir el recorrido sin Metro.

La conexión exitosa de registro/login y la biometría todavía no fueron verificadas en un dispositivo. Las pruebas HTTP automatizadas cubren Bearer, sobre de respuesta, errores HTTP, red y respuesta inválida; las consultas al servidor local verificaron salud y rechazos 401.
