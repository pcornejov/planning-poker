# ♠ Planning Poker — Estimación Ágil en Tiempo Real

Una herramienta interna moderna, minimalista y ultrarrápida de **Planning Poker** diseñada para facilitar estimaciones ágiles y precisas en equipos de desarrollo. Sincronizada instantáneamente usando **Firebase Realtime Database** o un emulador de sesión local inteligente en navegador sin necesidad de configuraciones iniciales.

---

## 🎨 Características Destacadas

*   **Sincronización en Tiempo Real:** Las acciones de votación, revelado, reinicio de ronda y administración de tareas se distribuyen inmediatamente a todos los terminales.
*   **Gestión de Presencia Activa:** Monitorea y remueve automáticamente a participantes que cierren pestañas o pierdan conectividad a internet.
*   **Arquitectura Dual Resiliente (Modo Demo Local):** Si ejecutas la aplicación sin variables de entorno de Firebase en tu archivo `.env`, la aplicación entra en **Modo Demo Local**. Los cambios se sincronizarán en tiempo real entre múltiples pestañas del mismo navegador mediante `BroadcastChannel`. En cuanto añadas las variables de Firebase, cambia automáticamente al servidor real.
*   **Tablero de Métricas Avanzado:** Revela al instante el **Promedio Numérico**, la **Moda (valor más votado)** y un gráfico de **Distribución de Votos** con barras porcentuales interactivas.
*   **Indicador de Consenso:** Evalúa la dispersión de las estimaciones en tiempo real de forma matemática. Si la diferencia de opiniones supera los 3 niveles de la escala Fibonacci, se activa una advertencia sugiriendo debatir antes de volver a votar.
*   **Dark Mode Elegante:** Cambia sin fricción entre modos visuales. Guarda la preferencia en el `localStorage` del navegador.
*   **Diseño SaaS Adaptable:** Optimizada para monitores ultra-anchos en la oficina y adaptada fluidamente a través de un sistema de pestañas sensible al tacto en pantallas de celulares o tabletas.

---

## 📂 Estructura de Archivos del Proyecto

El proyecto se clasifica de manera ordenada y modular:

```text
/
├── .env.example                # Plantilla de variables de entorno (credenciales de Firebase).
├── index.html                  # Punto de entrada estático HTML de Vite.
├── metadata.json               # Configuración interna del applet.
├── package.json                # Dependencias, paquetes y scripts del proyecto.
├── tsconfig.json               # Configuración estricta de TypeScript.
├── vite.config.ts              # Bundler de Vite y resolvedores de alias.
├── README.md                   # Esta exhaustiva guía de operación.
└── src/
    ├── App.tsx                 # Orquestador del Grid visual, Toast Notification y estados.
    ├── main.tsx                # Punto de entrada de inicialización de React.
    ├── index.css               # Estilos globales, tipografías e importes de Tailwind.
    ├── firebase.ts             # Conector y evaluador del SDK de Firebase.
    ├── types.ts                # Modelos de dominio y contratos TypeScript.
    ├── components/
    │   ├── ModalSetup.tsx      # Entrada visual pidiendo el nombre del usuario.
    │   ├── ThemeToggle.tsx     # Toggler visual de tema Oscuro / Claro.
    │   ├── PanelParticipants.tsx # Listado lateral con estados de voto y presencia.
    │   ├── PanelPoker.tsx      # Tablero central con detalles de tarea y mazo Fibonacci.
    │   ├── PanelResults.tsx    # Cálculos estadísticos detallados, advertencias y distribución.
    │   └── PanelTasks.tsx      # Gestor de tareas Sprint (crear, editar, borrar y activar).
    └── services/
        └── dbService.ts        # Adaptador unificado (Firebase RTDB vs Broadcast Simulation).
```

---

## ⚡ Comandos e Instrucciones de Ejecución Local

### 1. Requisitos Previos

Asegúrate de contar con **Node.js** (versión 18 o superior) instalado en tu equipo.

### 2. Instalación de Dependencias

Ejecuta el siguiente comando en la terminal para descargar las librerías necesarias:

```bash
npm install
```

### 3. Ejecución del Servidor de Desarrollo

Una vez completado el paso anterior, inicia el servidor local de Vite:

```bash
npm run dev
```

El servidor levantará en:  
👉 **`http://localhost:3000`**

### 4. Probar Multi-Usuario al Instante (Sin configuración)

*   Abre `http://localhost:3000` en tu navegador.
*   Completa tu nombre e ingresa a la sesión.
*   **Abre una ventana de incógnito o una nueva pestaña** con la misma URL. Completa otro nombre.
*   ¡Verás ambos nombres reflejarse inmediatamente y las cartas sincronizarse en tiempo real!

---

## 🔧 Configuración de tu base de datos Firebase Realtime Database

Para habilitar la conectividad remota en la nube para todo tu equipo:

### 1. Crear un proyecto en Firebase

1.  Ve a la consola de [Firebase Console](https://console.firebase.google.com/).
2.  Haz clic en **Creación de Proyecto** y asígnale un nombre (ej: `SprintPlanningPoker`).
3.  Desactiva o activa Analytics (opcional) y finaliza la creación.

### 2. Habilitar la base de datos Realtime Database

1.  En la barra lateral izquierda, navega a **Build > Realtime Database**.
2.  Haz clic en **Crear Base de Datos**, elige la región más cercana a tu equipo y presiona Siguiente.
3.  Selecciona **Modo de Prueba** (para desarrollo rápido) o **Modo Bloqueado** y haz clic en Habilitar.

### 3. Configurar las Reglas de Seguridad en Firebase

Para producción, ve a la pestaña **Reglas (Rules)** en Realtime Database y pega estas reglas de protección rápidas de escritura libre basadas en validación para evitar sobreescrituras incorrectas:

```json
{
  "rules": {
    ".read": "true",
    ".write": "true",
    "participants": {
      "$userId": {
        ".validate": "newData.hasChildren(['id', 'name'])"
      }
    },
    "tasks": {
      "$taskId": {
        ".validate": "newData.hasChildren(['id', 'title'])"
      }
    }
  }
}
```

### 4. Copiar Variables de Entorno

Crea un archivo llamado `.env` en la raíz de tu proyecto basándote en `.env.example` y rellena tus credenciales reales provenientes del panel de configuración de tu aplicación web de Firebase:

```env
VITE_FIREBASE_API_KEY="AIzaSyA..."
VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://tu-proyecto-default-rtdb.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="tu-proyecto"
VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="382909403810"
VITE_FIREBASE_APP_ID="1:382909403810:web:8a92bbd92..."
```

---

## 🚀 Despliegue en Producción

### Despliegue rápido en Vercel

1.  Instala el cliente CLI de vercel: `npm install -g vercel`.
2.  Corre el comando en la raíz del proyecto: `vercel`.
3.  Asegúrate de agregar las variables de entorno de Firebase listadas arriba en la configuración del proyecto en el dashboard de Vercel.

### Despliegue en Firebase Hosting

1.  Instala las herramientas globales: `npm install -g firebase-tools`.
2.  Genera el build de producción optimizado: `npm run build`.
3.  Inicia sesión: `firebase login`.
4.  Genera el archivo de inicialización: `firebase init hosting`. Selecciona como directorio público **`dist`** y configúralo como una aplicación SPA de una sola página (Single Page App).
5.  Despacha tus cambios: `firebase deploy`.
