# Kova Desktop & Mobile Client

<div align="center">
  <h3>Next-Generation Voice, Chat & AI Collaboration Platform</h3>
	<p>Construido con Tauri v2, Rust, React 19, TypeScript y Tailwind CSS para escritorio, Android e iOS.</p>

  [![Version](https://img.shields.io/badge/version-1.0.13-6366f1.svg)](https://kova-k2nchin.vercel.app/downloads)
  [![Platform](https://img.shields.io/badge/platform-Windows%20x64-0078d7.svg)](https://github.com/)
  [![Tauri](https://img.shields.io/badge/tauri-v2.11-brightgreen.svg)](https://tauri.app/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
</div>

---

## ✨ Características Principales

- 🎙️ **Canales de Voz & Texto de Alta Fidelidad**: Engine de audio en Rust de ultra baja latencia con procesamiento DSP.
- 🤖 **Kova AI Assistant & Bots de Discord**:
  - Integración nativa con **Gemini 2.5 & Flash** para respuestas inteligentes en tiempo real.
  - Directorio de aplicaciones con bots precargados (*Midjourney, MEE6, Carl-bot, FredBoat, Kova AI*).
  - **Creador de Bots Personalizados**: Crea tus propios bots con prefijos personalizados, roles, avatares y respuestas con IA.
- 🔐 **Autenticación en Dos Pasos (2FA)**:
  - Compatible con Google Authenticator, Authy y 1Password.
  - Códigos de respaldo de emergencia con descarga segura.
  - Verificación estricta en el inicio de sesión.
- 🎨 **Temas Ultra Profundos & Personalización Visual**:
  - Presets neutrales Kova: *OLED, Grafito, Acero, Plata, Carbón y Eclipse*.
  - Todos los temas usan la identidad monocromática oficial de Kova.
- ⚡ **Ligero y Veloz**: Menos de 10 MB de consumo de binario, inicio instantáneo gracias a la arquitectura Tauri v2.

---

## 📦 Descargas (Windows x64)

| Edición | Descarga Directa | Tamaño | Descripción |
| :--- | :--- | :--- | :--- |
| **Instalador Oficial** | [⬇️ Descargar Setup](https://kova-k2nchin.vercel.app/updates/Kova_1.0.13_x64-setup.exe) | **~9.6 MB** | Instalador guiado con acceso directo en Inicio y Escritorio. |
| **Página de descargas** | [Ver todas las plataformas](https://kova-k2nchin.vercel.app/downloads) | — | Versión actual, notas de la versión y suma SHA-256 del instalador. |
| **Portable (ZIP)** | Próximamente | — | Paquete comprimido listo para descomprimir y usar sin instalación. |

---

## 🚀 Desarrollo Local

### Requisitos
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (toolchain estable)

### Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/kova.git
cd kova

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y configura la URL de tu backend Kova
```

### Ejecutar en desarrollo
```bash
# Servidor web local
npm run dev

# Aplicación de escritorio Tauri
npm run tauri dev
```

### Compilar para producción
```bash
# Compilar instalador y ejecutable
npm run tauri build

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
```

---

## 🌐 Despliegue en Dominio Personalizado (.com)

Para vincular Kova a tu dominio `.com` (por ejemplo `kovachat.com` o `getkova.com`):

1. **GitHub Pages / Vercel**: Despliega la carpeta `dist/` o la Landing Page en Vercel o Cloudflare Pages.
2. **DNS Records**:
   - `CNAME` -> `cname.vercel-dns.com` o tu subdominio de GitHub Pages (`tu-usuario.github.io`).
   - `A Record` -> IP del proveedor de hosting.
3. Configura el archivo `CNAME` en la raíz de tu hosting con tu dominio `.com`.

---

© 2026 Kova. Todos los derechos reservados.
