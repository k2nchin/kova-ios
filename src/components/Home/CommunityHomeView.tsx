import React, { useState } from 'react';
import {
  Users,
  Activity,
  Calendar,
  ChevronRight,
  Plus,
  MessageSquare,
  Image as ImageIcon,
  Sparkles,
  Send,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurpleMountainBanner } from '../Common/PurpleMountainBanner';
import { toast } from 'sonner';

interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

interface CommunityHomeViewProps {
  onNavigateTab: (tab: 'activity' | 'conversaciones' | 'media' | 'eventos' | 'personas' | 'channel') => void;
}

export const CommunityHomeView: React.FC<CommunityHomeViewProps> = ({ onNavigateTab }) => {
  const { activeServer, currentUser, activeChannel } = useApp();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      authorName: currentUser?.displayName || 'JuanPi1x',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timestamp: 'Ahora mismo',
      content: newPostContent.trim(),
      likes: 0,
      comments: 0,
      isLiked: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setIsPosting(false);
    toast.success('¡Publicación compartida con la comunidad!');
  };

  const handleLikePost = (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          isLiked: !p.isLiked
        };
      }
      return p;
    }));
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#07050d] text-zinc-200 scrollbar-none p-5 space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-900/30 bg-[#0c0817] shadow-2xl">
        <PurpleMountainBanner height="h-64 sm:h-72" />

        {/* Content over Banner */}
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
          <div className="flex items-start gap-4">
            {/* Glowing 4-point Diamond Star */}
            <div className="relative w-14 h-14 rounded-2xl bg-[#170c32]/80 border border-purple-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-600/40 blur-lg absolute" />
              <svg className="w-8 h-8 text-purple-300 drop-shadow-[0_0_12px_rgba(216,180,254,1)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
              </svg>
            </div>

            <div className="space-y-1 max-w-xl">
              <span className="text-[11px] font-bold text-purple-400 tracking-widest uppercase font-['Outfit']">
                BIENVENIDO A
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] drop-shadow-md">
                {activeServer?.name || 'JuanPi1x Community'}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed drop-shadow">
                Una comunidad real, gente con las mismas ideas. Habla, comparte, crea, y sé parte.
              </p>
            </div>
          </div>

          {/* Bottom Bar inside Banner: Stats & CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-purple-500/10">
            <div className="flex items-center gap-6 text-xs text-purple-200/80">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-purple-400" />
                <span><strong className="text-white">{activeServer?.members?.length || 0}</strong> Miembros</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                <span><strong className="text-white">1</strong> En línea</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-purple-400" />
                <span><strong className="text-white">Hoy</strong> Última actividad</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('channel')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Explorar</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Cards ("¿Qué quieres hacer hoy?") */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 font-['Outfit']">
          ¿Qué quieres hacer hoy?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Crear publicación */}
          <button
            onClick={() => setIsPosting(true)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0d0a17] hover:bg-[#130d24] border border-purple-950/50 hover:border-purple-600/40 transition-all text-left group cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Crear publicación
                </p>
                <p className="text-[11px] text-zinc-500">
                  Comparte con la comunidad
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-purple-400 transition-colors" />
          </button>

          {/* Card 2: Iniciar conversación */}
          <button
            onClick={() => onNavigateTab('conversaciones')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0d0a17] hover:bg-[#130d24] border border-purple-950/50 hover:border-purple-600/40 transition-all text-left group cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Iniciar conversación
                </p>
                <p className="text-[11px] text-zinc-500">
                  Habla con otros miembros
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          </button>

          {/* Card 3: Ver eventos */}
          <button
            onClick={() => onNavigateTab('eventos')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0d0a17] hover:bg-[#130d24] border border-purple-950/50 hover:border-purple-600/40 transition-all text-left group cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Calendar size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                  Ver eventos
                </p>
                <p className="text-[11px] text-zinc-500">
                  No te pierdas nada
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
          </button>

          {/* Card 4: Explorar media */}
          <button
            onClick={() => onNavigateTab('media')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0d0a17] hover:bg-[#130d24] border border-purple-950/50 hover:border-purple-600/40 transition-all text-left group cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ImageIcon size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                  Explorar media
                </p>
                <p className="text-[11px] text-zinc-500">
                  Fotos, videos y más
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-fuchsia-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* 3. Section: Actividad Reciente (Clean State) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-['Outfit'] font-black text-purple-400 text-sm">~|~</span>
            <h2 className="text-sm font-bold text-white font-['Outfit'] tracking-wide">
              Actividad reciente
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            Ver todo <ChevronRight size={13} />
          </button>
        </div>

        {/* Post Creation Box */}
        {isPosting && (
          <form
            onSubmit={handleCreatePost}
            className="p-4 rounded-2xl bg-[#0c0817] border border-purple-600/40 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-purple-500/30"
              />
              <span className="text-xs font-bold text-white">
                {currentUser?.displayName || 'JuanPi1x'}
              </span>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="¿Qué estás pensando? Comparte novedades con la comunidad..."
              rows={3}
              className="w-full bg-[#130c26] border border-purple-900/40 rounded-xl p-3 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPosting(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 cursor-pointer"
              >
                <Send size={12} />
                Publicar
              </button>
            </div>
          </form>
        )}

        {/* Posts List or Clean State Placeholder */}
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl bg-[#0c0817] border border-purple-950/50 space-y-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-9 h-9 rounded-full object-cover border border-purple-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{post.authorName}</span>
                      <span className="text-[10px] text-purple-400">👑</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">{post.timestamp} · General</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 pt-2 border-t border-white/[0.04] text-xs text-zinc-400">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      post.isLiked ? 'text-pink-500 font-semibold' : 'hover:text-white'
                    }`}
                  >
                    <Heart size={14} className={post.isLiked ? 'fill-pink-500' : ''} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                    <MessageCircle size={14} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean State: Pure Aesthetic Wireframe Ready for Data */
          <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0c0817]/40 p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">
                Aún no hay publicaciones en esta comunidad
              </p>
              <p className="text-[11px] text-zinc-500 max-w-sm">
                Sé el primero en compartir algo, organizar partidas o iniciar una conversación.
              </p>
            </div>
            <button
              onClick={() => setIsPosting(true)}
              className="mt-1 px-4 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              Crear primera publicación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
