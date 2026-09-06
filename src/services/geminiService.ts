// Google Gemini API Client Service for Kova AI
// Connects Kova AI Assistant directly to Google's official Gemini models

const DEFAULT_GEMINI_KEY = '';
const MODELS_TO_TRY = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

export function getGeminiApiKey(): string {
  try {
    const fromStorage = localStorage.getItem('kova.gemini_api_key');
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  } catch {}
  return import.meta.env.VITE_GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
}

export function setGeminiApiKey(key: string): void {
  try {
    localStorage.setItem('kova.gemini_api_key', key.trim());
  } catch {}
}

const KOVA_SYSTEM_INSTRUCTION = `Eres Kova IA, el asistente inteligente oficial de Kova (plataforma de comunicación, chat y voz online al estilo Discord).

Instrucciones de comportamiento:
1. Tu nombre oficial es Kova IA. Si te preguntan quién eres o cómo te llamas, responde siempre que eres Kova IA.
2. Responde de forma concisa, útil, profesional y enérgica en español.
3. Si te piden código, proporciona código limpio, moderno y comentado en bloques con su lenguaje (ej. \`\`\`typescript o \`\`\`rust).
4. Conoce las características de Kova: canales de texto, salas de voz HD de baja latencia con WebRTC, Soundboard para reproducir y subir sonidos en vivo, notas colaborativas Markdown, historias de 24h, roles de servidor personalizables y temas oscuros.
5. Sé directo, evita introducciones largas innecesarias y usa formato Markdown claro con viñetas y negritas cuando aporte claridad.`;

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * Ask Kova IA using live Google Gemini API
 */
export async function askGemini(
  prompt: string,
  context?: { channelName?: string; serverName?: string; recentMessages?: string[] }
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return '⚠️ No se encontró una clave de API configurada.';
  }

  let enrichedPrompt = prompt;
  if (context?.channelName || context?.serverName || context?.recentMessages?.length) {
    const meta: string[] = [];
    if (context.serverName) meta.push(`Espacio/Servidor: ${context.serverName}`);
    if (context.channelName) meta.push(`Canal actual: #${context.channelName}`);
    if (context.recentMessages?.length) {
      meta.push(`Mensajes recientes del canal:\n${context.recentMessages.slice(-6).join('\n')}`);
    }
    enrichedPrompt = `[Contexto del canal]:\n${meta.join('\n')}\n\n[Pregunta o petición del usuario]:\n${prompt}`;
  }

  const payload = {
    systemInstruction: {
      parts: [{ text: KOVA_SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: enrichedPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  for (const model of MODELS_TO_TRY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson: GeminiGenerateResponse = await res.json().catch(() => ({}));
        console.warn(`[Kova IA] Falló ${model}:`, errJson.error?.message || res.statusText);
        continue;
      }

      const data: GeminiGenerateResponse = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err) {
      console.warn(`[Kova IA] Excepción consultando ${model}:`, err);
    }
  }

  return '✦ **Kova IA**: No pude responder en este momento. Por favor verifica tu conexión a internet.';
}

/**
 * Summarize real conversation messages using Gemini
 */
export async function summarizeConversationWithGemini(
  channelName: string,
  messages: Array<{ author: string; content: string; timestamp?: string }>
): Promise<string> {
  const conversation = messages
    .filter((m) => m.content && m.content.trim())
    .map((m) => `[${m.author}]: ${m.content}`)
    .join('\n');

  if (!conversation.trim()) {
    return `✦ **Resumen de #${channelName}**:\n\nNo hay mensajes recientes suficientes en este canal para generar un resumen.`;
  }

  const prompt = `Analiza la siguiente conversación en el canal #${channelName} de Kova y genera un resumen conciso y bien estructurado con los siguientes apartados:
1. 📌 **Temas Principales**
2. 💡 **Decisiones y Acuerdos Clave**
3. 🚀 **Tareas o Pendientes (si los hay)**

Conversación:
${conversation}`;

  return askGemini(prompt, { channelName });
}

/**
 * Translate message using Gemini
 */
export async function translateTextWithGemini(
  text: string,
  targetLanguage: string
): Promise<string> {
  const langNames: Record<string, string> = {
    en: 'inglés (English)',
    ja: 'japonés (日本語)',
    fr: 'francés (Français)',
    de: 'alemán (Deutsch)',
    pt: 'portugués (Português)',
    it: 'italiano (Italiano)',
    zh: 'chino mandarín (中文)',
    es: 'español',
  };

  const targetName = langNames[targetLanguage.toLowerCase()] || targetLanguage;
  const prompt = `Traduce el siguiente mensaje al ${targetName} manteniendo el tono natural, coloquial y exacto del chat. Devuelve ÚNICAMENTE el texto traducido sin explicaciones ni notas adicionales:\n\n"${text}"`;

  return askGemini(prompt);
}

/**
 * Generate Structured Meeting Minutes in Markdown using Gemini
 */
export async function generateMeetingMinutesWithGemini(
  channelName: string,
  serverName: string,
  participants: string[],
  messages: Array<{ author: string; content: string }>
): Promise<{ title: string; content: string }> {
  const conversation = messages.map((m) => `${m.author}: ${m.content}`).join('\n');
  const now = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const title = `Minuta #${channelName} - ${now}`;

  if (!conversation.trim()) {
    return {
      title,
      content: `# 📋 Minuta del Canal #${channelName}\n**Fecha:** ${now}\n**Espacio:** ${serverName}\n**Participantes:** ${participants.join(', ')}\n\n*No hubo suficientes mensajes registrados en la sesión para generar la minuta automática.*`,
    };
  }

  const prompt = `Genera una Minuta Ejecutiva en Markdown basada en esta sesión de trabajo en Kova.
Canal: #${channelName}
Servidor: ${serverName}
Participantes: ${participants.join(', ')}
Fecha: ${now}

Conversación registrada:
${conversation}

Formato esperado:
# 📋 Minuta Ejecutiva: #${channelName}
**Fecha:** ${now}
**Espacio:** ${serverName}
**Participantes:** ${participants.join(', ')}

## 📌 1. Resumen Ejecutivo
(2-3 oraciones clave)

## 🎯 2. Temas Tratados y Discusión
(Puntos tratados con viñetas)

## ✅ 3. Decisiones y Acuerdos
(Acuerdos tomados)

## 📋 4. Plan de Acción y Tareas
(Lista de tareas con casillas de verificación [ ] o [x])`;

  const content = await askGemini(prompt, { channelName, serverName });

  return {
    title,
    content,
  };
}
