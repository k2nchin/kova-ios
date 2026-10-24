# Kova Desktop & Mobile Client

<div align="center">
  <h3>Plataforma de comunidades con chat, voz e IA</h3>
	<p>Construido con Tauri v2, Rust, React 19, TypeScript y Tailwind CSS para escritorio, Android e iOS.</p>

  [![Version](https://img.shields.io/badge/version-1.0.13-6366f1.svg)](https://kova-k2nchin.vercel.app/downloads)
  [![Platform](https://img.shields.io/badge/platform-Windows%20x64-0078d7.svg)](https://kova-k2nchin.vercel.app/downloads)
  [![Tauri](https://img.shields.io/badge/tauri-v2.11-brightgreen.svg)](https://tauri.app/)
</div>

---

## ✨ Características Principales

- 💬 **Espacios, canales y mensajes en tiempo real**: mensajes, ediciones, reacciones, presencia y "escribiendo…" en vivo mediante Socket.IO, con mensajes directos entre amigos.
- 🎙️ **Salas de voz**: audio real entre usuarios a través de [LiveKit](https://livekit.io/), con silencio, ensordecer y push-to-talk.
- 🤖 **Kova IA**: asistente integrado (Gemini) para preguntas, resúmenes de canal, traducciones y minutas. La clave del proveedor vive solo en el servidor.
- 🧩 **Bots personalizados**: crea bots con prefijo, comandos y respuestas automáticas para tus espacios.
- 📎 **Archivos**: adjuntos, avatares, banners, historias de 24 h y sonidos propios del soundboard, guardados en Supabase Storage.
- 🔐 **Verificación en dos pasos (2FA)**: TOTP compatible con Google Authenticator, Authy y 1Password, con códigos de respaldo de un solo uso. Todo se valida en el servidor.
- 🎨 **Temas**: presets neutrales Kova (*OLED, Grafito, Acero, Plata, Carbón y Eclipse*) con la identidad monocromática oficial.
- ⚡ **Ligero**: instalador de ~10 MB gracias a Tauri v2.

---

## 📦 Descargas (Windows x64)

| Edición | Descarga Directa | Tamaño | Descripción |
| :--- | :--- | :--- | :--- |
| **Instalador Oficial** | [⬇️ Descargar Setup](https://kova-k2nchin.vercel.app/updates/Kova_1.0.13_x64-setup.exe) | **~9.6 MB** | Instalador guiado con acceso directo en Inicio y Escritorio. |
| **Página de descargas** | [Ver todas las plataformas](https://kova-k2nchin.vercel.app/downloads) | — | Versión actual, notas de la versión y suma SHA-256 del instalador. |

---

## 🚀 Desarrollo Local

### Requisitos
- [Node.js](https://nodejs.org/) 22
- [Rust](https://www.rust-lang.org/) (toolchain estable)

### Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/kova.git
cd kova

# 2. Instalar dependencias de la app y de la API
npm install
npm install --prefix server

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y configura la URL de tu backend Kova
```

### Ejecutar en desarrollo
```bash
# API de Kova (http://localhost:4000)
npm run api:dev

# Servidor web local
npm run dev

# Aplicación de escritorio Tauri
npm run tauri dev
```

### Pruebas
```bash
# Pruebas de integración de la API (levantan un servidor temporal)
npm test --prefix server
```

### Compilar para producción
```bash
# Compilar instalador y ejecutable
npm run tauri build
```

### Desarrollo y compilación móvil

Android requiere Android Studio, SDK, **JDK 17** y un dispositivo/emulador conectado:

```bash
npm run mobile:android:dev
npm run mobile:android:build
```

Si Android Studio usa un JBR más reciente, configura `JAVA_HOME` apuntando a un
JDK 17 antes de ejecutar Gradle.

iOS requiere macOS y Xcode:

```bash
npm run mobile:ios:dev
npm run mobile:ios:build
```

El esquema `kova://auth` queda reservado para devolver el resultado del OAuth
móvil. Debe registrarse como URI autorizada en la configuración móvil de Google.

---

## 🖥️ Backend (API)

La API vive en [`server/`](server/README.md) y funciona en Vercel (funciones en `api/`) o como
proceso continuo (Railway, Render, Fly…). El tiempo real por Socket.IO necesita el proceso
continuo; en Vercel el cliente recurre a consultas periódicas.

Variables principales (detalle en [`server/README.md`](server/README.md)):

| Variable | Para qué sirve |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL (obligatoria en Vercel; sin ella se usa SQLite local). |
| `KOVA_ENCRYPTION_KEY` | Cifra los secretos del 2FA. |
| `GEMINI_API_KEY` | Activa Kova IA. |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Activan las salas de voz. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Activan la subida de archivos (bucket público `kova-uploads`). |

---

## 🌐 Despliegue en Dominio Personalizado (.com)

Para vincular Kova a tu dominio `.com` (por ejemplo `kovachat.com` o `getkova.com`):

1. **Vercel / Cloudflare Pages**: Despliega la carpeta `dist/` o la Landing Page.
2. **DNS Records**:
   - `CNAME` -> `cname.vercel-dns.com` o el subdominio de tu proveedor.
   - `A Record` -> IP del proveedor de hosting.
3. Configura tu dominio `.com` en el panel del proveedor.

---

© 2026 Kova. Todos los derechos reservados.
