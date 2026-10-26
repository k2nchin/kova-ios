import React, { useEffect, useRef, useState } from 'react';
import { Hash, Loader2, Paperclip, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import '../../styles/messageSearch.css';

type Result = Awaited<ReturnType<typeof api.searchMessages>>[number];

const when = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? `Hoy, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString([], { day: 'numeric', month: 'short', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};

/** Highlights the searched words inside a result. */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const term = query.trim();
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((part, index) => (part.toLowerCase() === term.toLowerCase() ? <mark key={index}>{part}</mark> : part))}</>;
};

/** Search inside the messages of the current space (Discord-style filters). */
export const MessageSearch: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { activeServer, activeChannel, setActiveChannelId, setIsDMViewActive } = useApp();
  const [query, setQuery] = useState('');
  const [author, setAuthor] = useState('');
  const [onlyHere, setOnlyHere] = useState(false);
  const [withFiles, setWithFiles] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Search as you type (debounced).
  useEffect(() => {
    if (!open || !activeServer) return;
    if (!query.trim() && !author && !withFiles) { setResults(null); setError(''); return; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const found = await api.searchMessages(activeServer.id, { q: query.trim(), author, channel: onlyHere ? activeChannel?.id : undefined, hasFile: withFiles });
        if (!cancelled) { setResults(found); setError(''); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo buscar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [open, query, author, onlyHere, withFiles, activeServer, activeChannel?.id]);

  if (!open || !activeServer) return null;
  const members = activeServer.members || [];

  const jump = (result: Result) => {
    setIsDMViewActive(false);
    setActiveChannelId(result.channelId);
    onClose();
  };

  return (
    <div className="kms-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="kms" role="dialog" aria-modal="true" aria-label="Buscar mensajes">
        <header className="kms-head">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar en ${activeServer.name}`}
            aria-label="Buscar mensajes"
          />
          {loading && <Loader2 size={16} className="animate-spin" />}
          <button type="button" className="kms-close" onClick={onClose} aria-label="Cerrar búsqueda"><X size={17} /></button>
        </header>

        <div className="kms-filters">
          <button type="button" className={onlyHere ? 'is-on' : ''} onClick={() => setOnlyHere((v) => !v)} aria-pressed={onlyHere}>
            <Hash size={13} /> En #{activeChannel?.name || 'este canal'}
          </button>
          <button type="button" className={withFiles ? 'is-on' : ''} onClick={() => setWithFiles((v) => !v)} aria-pressed={withFiles}>
            <Paperclip size={13} /> Con archivos
          </button>
          <select value={author} onChange={(event) => setAuthor(event.target.value)} aria-label="De una persona">
            <option value="">De cualquiera</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.nickname || member.displayName}</option>)}
          </select>
        </div>

        <div className="kms-results">
          {error && <p className="kms-empty">{error}</p>}
          {!error && results === null && <p className="kms-empty">Escribe para buscar en los mensajes de este espacio.</p>}
          {!error && results?.length === 0 && <p className="kms-empty">No hay mensajes que coincidan.</p>}
          {results?.map((result) => (
            <button key={result.id} type="button" className="kms-result" onClick={() => jump(result)}>
              <Avatar src={result.author.avatar} name={result.author.displayName || result.author.username} size={32} />
              <span className="kms-body">
                <span className="kms-meta">
                  <strong>{members.find((m) => m.id === result.author.id)?.nickname || result.author.displayName}</strong>
                  {result.author.verified && <VerifiedBadge size={12} />}
                  <em>#{result.channelName}</em>
                  <time>{when(result.createdAt)}</time>
                </span>
                <span className="kms-text">
                  {result.content ? <Highlight text={result.content.slice(0, 280)} query={query} /> : <i>Archivo adjunto</i>}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
