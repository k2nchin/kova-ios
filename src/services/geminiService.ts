// Kova AI client. Provider credentials remain on the backend and are never
// shipped in the browser or stored in localStorage.
import { api } from './apiClient';

// Kova IA's system instructions live on the server (server/ai.mjs).

/**
 * Ask Kova IA through the authenticated backend proxy.
 */
export async function askGemini(
  prompt: string,
  context?: { channelName?: string; serverName?: string; recentMessages?: string[] }
): Promise<string> {
  const response = await api.askAI(prompt, {
    ...context,
    recentMessages: context?.recentMessages?.slice(-6),
  });
  if (!response.text?.trim()) throw new Error('El servidor de IA devolvió una respuesta vacía.');
  return response.text.trim();
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
