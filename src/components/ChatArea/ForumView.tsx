import React, { useCallback, useEffect, useState } from 'react';
import { MessagesSquare, Pin, Plus, Settings2, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type ForumPost } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { useApp, permissionsIn, messageFromApi } from '../../context/AppContext';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import '../../styles/forum.css';

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/** Forum channel: posts as cards with tags; replies open in the thread drawer. */
export const ForumView: React.FC = () => {
  const { activeChannel, activeServer, currentUser, openThread } = useApp();
  const canManage = permissionsIn(activeServer, currentUser.id).has('MANAGE_CHANNELS');
  const canPost = activeChannel.canSend !== false;
  const [posts, setPosts] = useState<ForumPost[] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '', tags: [] as string[] });
  const [tagDraft, setTagDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const channelId = activeChannel.id;

  const load = useCallback(() => api.getForumPosts(channelId).then((result) => { setPosts(result.posts); setTags(result.tags); }).catch(() => setPosts([])), [channelId]);

  useEffect(() => {
    void load();
    const socket = getSocket();
    const onChange = (payload: { channelId?: string; parentMessageId?: string }) => { if (!payload?.channelId || payload.channelId === channelId) void load(); };
    socket.on('message:created', onChange);
    socket.on('thread:message', onChange);
    return () => { socket.off('message:created', onChange); socket.off('thread:message', onChange); };
  }, [channelId, load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createForumPost(channelId, draft);
      setDraft({ title: '', content: '', tags: [] });
      setIsComposing(false);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar.');
    } finally {
      setBusy(false);
    }
  };

  const saveTags = async (next: string[]) => {
    try { setTags((await api.setForumTags(channelId, next)).tags); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron guardar las etiquetas.'); }
  };

  const open = (post: ForumPost) => {
    openThread(messageFromApi({ ...post, content: `${post.title}\n\n${post.content}` }, currentUser));
  };

  const shown = (posts || []).filter((post) => !filter || post.tags.includes(filter));

  return (
    <main className="kforum">
      <header className="kforum-head">
        <MessagesSquare size={20} />
        <div>
          <h1>{activeChannel.name}</h1>
          <p>{activeChannel.topic || 'Foro: cada tema en su propia conversación.'}</p>
        </div>
        {canManage && <button type="button" className="kforum-ghost" onClick={() => setIsEditingTags(!isEditingTags)} title="Etiquetas del foro"><Settings2 size={15} /></button>}
        {canPost && <button type="button" className="kforum-primary" onClick={() => setIsComposing(true)}><Plus size={15} /> Nueva publicación</button>}
      </header>

      {isEditingTags && (
        <div className="kforum-tagedit">
          <span><Tag size={13} /> Etiquetas disponibles</span>
          {tags.map((tag) => <button key={tag} type="button" className="kforum-chip is-removable" onClick={() => void saveTags(tags.filter((t) => t !== tag))}>{tag} <X size={11} /></button>)}
          <form onSubmit={(event) => { event.preventDefault(); if (tagDraft.trim()) { void saveTags([...tags, tagDraft.trim()]); setTagDraft(''); } }}>
            <input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Nueva etiqueta" maxLength={24} />
          </form>
        </div>
      )}

      {tags.length > 0 && (
        <div className="kforum-filters" role="toolbar" aria-label="Filtrar por etiqueta">
          <button type="button" className={`kforum-chip ${!filter ? 'is-on' : ''}`} onClick={() => setFilter(null)}>Todas</button>
          {tags.map((tag) => <button key={tag} type="button" className={`kforum-chip ${filter === tag ? 'is-on' : ''}`} onClick={() => setFilter(filter === tag ? null : tag)}>{tag}</button>)}
        </div>
      )}

      {isComposing && (
        <form className="kforum-compose" onSubmit={submit}>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Título" maxLength={120} required autoFocus />
          <textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Cuéntalo con detalle…" rows={4} maxLength={10000} required />
          {tags.length > 0 && (
            <div className="kforum-filters">
              {tags.map((tag) => {
                const on = draft.tags.includes(tag);
                return <button key={tag} type="button" className={`kforum-chip ${on ? 'is-on' : ''}`} onClick={() => setDraft({ ...draft, tags: on ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag].slice(0, 5) })}>{tag}</button>;
              })}
            </div>
          )}
          <div className="kforum-compose-actions">
            <button type="button" className="kforum-ghost" onClick={() => setIsComposing(false)}>Cancelar</button>
            <button type="submit" className="kforum-primary" disabled={busy || !draft.title.trim() || !draft.content.trim()}>Publicar</button>
          </div>
        </form>
      )}

      <div className="kforum-list custom-scrollbar">
        {posts === null ? <p className="kforum-empty">Cargando publicaciones…</p> : shown.length === 0 ? (
          <div className="kforum-empty">
            <MessagesSquare size={28} />
            <p>{filter ? 'Nada con esta etiqueta todavía.' : 'Aún no hay publicaciones. ¡Abre el primer tema!'}</p>
          </div>
        ) : shown.map((post) => (
          <button key={post.id} type="button" className="kforum-post" onClick={() => open(post)}>
            <div className="kforum-post-main">
              <strong>{post.pinned && <Pin size={13} />} {post.title}</strong>
              {post.tags.length > 0 && <span className="kforum-post-tags">{post.tags.map((tag) => <em key={tag}>{tag}</em>)}</span>}
              <p>{post.content}</p>
              <span className="kforum-post-meta">
                <Avatar src={post.author.avatar} name={post.author.displayName || post.author.username} size={18} />
                {post.author.displayName || post.author.username}
                {post.author.verified && <VerifiedBadge size={12} />}
                <span>· {ago(post.createdAt)}</span>
              </span>
            </div>
            <div className="kforum-post-side">
              <b>{post.replies}</b>
              <small>{post.replies === 1 ? 'respuesta' : 'respuestas'}</small>
              <small>{ago(post.lastActivityAt)}</small>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
};
