# ⚡ Kova Desktop Client

<div align="center">
  <h3>Next-Generation Voice, Chat & AI Collaboration Platform</h3>
  <p>Construido con Tauri v2, Rust, React 19, TypeScript y Tailwind CSS.</p>

  [![Version](https://img.shields.io/badge/version-1.0.0-6366f1.svg)](https://github.com/)
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
  - *Dark Carmesí (Blood Moon Abyss)*
  - *Abyss Blue (Profundidad Marina)*
  - *Emerald Void (Bosque Nocturno)*
  - *Amethyst Eclipse (Vacío Amatista)*
  - *Cyber Amber (Eclipse Dorado)*
  - *OLED Puro, Synthwave 80s, Matrix Terminal y Discord Classic*.
- ⚡ **Ligero y Veloz**: Menos de 10 MB de consumo de binario, inicio instantáneo gracias a la arquitectura Tauri v2.

---

## 📦 Descargas (Windows x64)

| Edición | Descarga Directa | Tamaño | Descripción |
| :--- | :--- | :--- | :--- |
| **Instalador Oficial** | [⬇️ Descargar Setup](https://github.com/k2nchin/kova/releases/download/v1.0.0/Kova-v1.0.0-Setup.exe) | **~2.1 MB** | Instalador guiado con acceso directo en Inicio y Escritorio. |
| **Portable (ZIP)** | [⬇️ Descargar Portable](https://github.com/k2nchin/kova/releases/download/v1.0.0/Kova-v1.0.0-Windows-Portable.zip) | **~2.7 MB** | Paquete comprimido listo para descomprimir y usar sin instalación. |
| **Todas las Versiones** | [Ver Release v1.0.0 en GitHub](https://github.com/k2nchin/kova/releases/tag/v1.0.0) | — | Registro oficial de cambios y sumas de verificación. |

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
# Edita .env y añade tu VITE_GEMINI_API_KEY
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
