// Custom emojis (:name:) and stickers ([sticker:id]) inside message text.
import React from 'react';
import type { Expression, Server } from '../types';

export const STICKER_MESSAGE = /^\[sticker:([\w-]+)\]$/;
const EMOJI_TOKEN = /:([a-z0-9_]{2,32}):/g;

/** Every custom emoji/sticker of your spaces; the active space wins name clashes. */
export function expressionIndex(servers: Server[], activeServerId?: string) {
  const emojis = new Map<string, Expression>();
  const stickers = new Map<string, Expression>();
  const ordered = [...servers].sort((a) => (a.id === activeServerId ? 1 : -1));
  for (const server of ordered) {
    for (const item of server.expressions || []) {
      if (item.kind === 'emoji') emojis.set(item.name, item);
      else stickers.set(item.id, item);
    }
  }
  return { emojis, stickers };
}

/** Message text with :name: swapped for the space's emoji images. */
export function renderWithEmojis(text: string, emojis: Map<string, Expression>): React.ReactNode {
  if (!emojis.size || !text.includes(':')) return text;
  const parts: React.ReactNode[] = [];
  let last = 0;
  const onlyEmojis = text.replace(EMOJI_TOKEN, (token, name) => (emojis.has(name) ? '' : token)).trim() === '';
  for (const match of text.matchAll(EMOJI_TOKEN)) {
    const emoji = emojis.get(match[1]);
    if (!emoji) continue;
    if (match.index! > last) parts.push(text.slice(last, match.index));
    parts.push(<img key={`${match.index}-${emoji.id}`} src={emoji.url} alt={`:${emoji.name}:`} title={`:${emoji.name}:`} className={`kova-custom-emoji ${onlyEmojis ? 'is-big' : ''}`} draggable={false} />);
    last = match.index! + match[0].length;
  }
  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
