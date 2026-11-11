# Equipo 65 – Desarrollo para Móviles

**Universidad Nacional de Entre Ríos (UNER)**  
**Trabajo Final Integrador**

## 👥 Integrantes

- Janet Casaretto
- Damian Ottone
- Micaela Zalazar
- Franco Challiol
- Florencia Camino

---

# 🏪 Directorio de Comercios – Concepción del Uruguay

Aplicación móvil desarrollada con **React Native y Expo** para facilitar la búsqueda y consulta de comercios de Concepción del Uruguay, Entre Ríos, Argentina.

Permite a los vecinos consultar información de establecimientos locales y a los comerciantes gestionar sus comercios, con funcionalidades diferenciadas según el tipo de usuario.

## 📱 Funcionalidades principales

- Autenticación de usuarios y persistencia segura de sesión.
- Acceso biométrico en dispositivos compatibles.
- Consulta y visualización del directorio de comercios.
- Gestión de información para comerciantes.
- Navegación diferenciada para vecinos y comerciantes.
- Integración con una API REST.

## 🛠️ Tecnologías utilizadas

**Aplicación móvil**
- React Native y Expo
- TypeScript
- Expo Router
- Expo SecureStore
- Expo Local Authentication
- Expo SQLite

**Backend (proporcionado por la cátedra)**
- API REST
- Docker

## 🚀 Instalación y ejecución

### Requisitos previos

- Node.js y npm
- Git
- Docker Desktop
- Android Studio (emulador) o dispositivo físico con Expo Go compatible

### 1. Clonar el repositorio e instalar dependencias

```bash
npm install
```

### 2. Configurar las variables de entorno

Crear un archivo llamado `.env` en la raíz del proyecto, al mismo nivel que `package.json`.

Este archivo contiene la configuración necesaria para conectar la aplicación móvil con el backend.

Ejemplo de configuración, utilizando `EXPO_PUBLIC_API_URL` como nombre de variable:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:PUERTO
```

**Importante:** utilizar el nombre de variable definido en el código del proyecto y reemplazar la dirección y el puerto por los correspondientes al backend.

La dirección depende del entorno de ejecución:

| Entorno | Dirección del backend |
|---|---|
| Emulador Android | `http://10.0.2.2:PUERTO` |
| Dispositivo físico | `http://IP_LOCAL_PC:PUERTO` |
| iOS Simulator (macOS) | `http://localhost:PUERTO` |

Para un dispositivo físico, el teléfono y la computadora deben estar conectados a la misma red y el backend debe ser accesible desde ella.

**Nota:** el archivo `.env` debe configurarse antes de iniciar Expo. Si se modifica, reiniciar el servidor de desarrollo.

### 3. Iniciar el backend

El backend es proporcionado por el equipo de cátedra y se ejecuta mediante Docker.

Desde el directorio que contiene su archivo `compose.yaml` o `docker-compose.yml`, ejecutar:

```bash
docker compose up -d
```

Verificar que los contenedores estén activos:

```bash
docker ps
```

### 4. Iniciar la aplicación móvil

Desde la raíz del proyecto:

```bash
npx expo start
```

Para ejecutarla directamente en un emulador Android:

```bash
npx expo start --android
```

Para utilizar un dispositivo físico, abrir Expo Go y escanear el código QR generado en la terminal.

**Importante:** la versión de Expo Go debe ser compatible con el SDK de Expo utilizado por el proyecto.

## 🧪 Verificación del proyecto

Ejecutar los siguientes comandos para comprobar los tipos, analizar el código y correr las pruebas automatizadas:

```bash
npm run typecheck
npm run lint
npm test
```

## 📚 Sobre el proyecto

Desarrollado por el **Equipo 65** como Trabajo Final Integrador de la materia **Desarrollo para Móviles** de la **Universidad Nacional de Entre Ríos (UNER)**.

El proyecto integra conceptos de desarrollo móvil, navegación, autenticación, almacenamiento seguro y consumo de servicios REST.

**Proyecto de uso académico y educativo.**