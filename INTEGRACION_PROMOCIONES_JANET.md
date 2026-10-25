# Integración del módulo Promociones — Janet

Este proyecto conserva el trabajo de Florencia (arquitectura, login, biometría, inicio y exploración) e incorpora la Tarea 4 dentro de la estructura compartida de Expo SDK 57.

## Qué se agregó

- Pestaña **Promos** con icono nativo.
- Pestaña **Avisos** con icono nativo.
- Listado y detalle de promociones.
- Filtros por estado y por rubro.
- Estados: vigente, próxima, por vencer y vencida.
- Contador de días hasta el vencimiento.
- Promociones guardadas y comercios favoritos.
- Preferencias de rubros de interés.
- Persistencia local con `expo-sqlite/kv-store`.
- Uso de caché cuando no hay conexión.
- Código QR asociado al usuario autenticado.
- Avisos de promociones nuevas y recordatorios de vencimiento.
- Casos de demostración de carga normal, lista vacía y error.
- Pruebas automáticas de fechas, estados y filtros.

## Archivos compartidos modificados

- `package.json`
- `package-lock.json`
- `app.json`
- `tsconfig.json`
- `src/app/(tabs)/_layout.tsx`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/hooks/use-color-scheme.web.ts` (comentario de compatibilidad con ESLint)

## Carpetas y archivos nuevos del módulo

- `src/app/(tabs)/promociones/`
- `src/app/(tabs)/avisos.tsx`
- `src/components/banner-conexion.tsx`
- `src/components/chip-filtro.tsx`
- `src/components/estado-pantalla.tsx`
- `src/components/tarjeta-promocion.tsx`
- `src/contexts/promociones-context.tsx`
- `src/mocks/promociones.ts`
- `src/services/notificaciones.ts`
- `src/services/persistencia-promociones.ts`
- `src/services/promociones.ts`
- `src/types/promociones.ts`
- `src/types/assets.d.ts`
- `src/utils/promociones.ts`
- `pruebas/promociones.test.ts`
- `eslint.config.js`

## Cómo abrir y probar

```bash
cd DesarrolloParaMoviles-development_nueva
npm install
npx expo start -c
```

En el Samsung, abrir Expo Go y escanear el QR. El listado, filtros, guardados, favoritos, QR y contador funcionan en Expo Go.

Las notificaciones Android no se ejecutan dentro de Expo Go desde Expo SDK 53. La aplicación informa esta limitación sin cerrarse. Para demostrarlas hace falta una development build/APK; el resto del módulo puede evaluarse normalmente.

## Verificaciones realizadas

```bash
npm test
npm run typecheck
npx expo-doctor
npx expo export --platform android
```

Resultados de esta entrega:

- 6 de 6 pruebas automáticas aprobadas.
- TypeScript aprobado sin errores.
- ESLint aprobado sin errores.
- Expo Doctor: 21 de 21 controles aprobados.
- Compilación del bundle Android completada.

## Nota sobre la API

El archivo `src/services/promociones.ts` simula temporalmente las respuestas de la futura API usando datos de `src/mocks/promociones.ts`. Cuando el equipo reciba la API, sólo se reemplaza la implementación de ese servicio; las pantallas, filtros, contexto y componentes pueden mantenerse.
