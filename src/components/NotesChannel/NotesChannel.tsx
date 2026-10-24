import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Tag,
  Clock,
  Sparkles,
  Save,
  Check,
  Eye,
  Edit3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotesChannel: React.FC = () => {
  const { notes, addNote, updateNote, activeChannel, askKovaAI } = useApp();
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  const activeDoc = notes.find((n) => n.id === activeNoteId) || notes[0];

  const handleTitleChange = (newTitle: string) => {
    if (!activeDoc) return;
    updateNote(activeDoc.id, newTitle, activeDoc.content);
  };

  const handleContentChange = (newContent: string) => {
    if (!activeDoc) return;
    updateNote(activeDoc.id, activeDoc.title, newContent);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 1500);
  };

  const handleCreateNewNote = () => {
    const title = `Nueva Nota #${notes.length + 1}`;
    const content = `# ${title}\n\nEscribe aquí tus ideas, notas de reuniones o especificaciones técnicas...`;
    addNote(title, content, ['Documentación']);
  };

  const handleAskAIImprove = () => {
    if (!activeDoc) return;
    askKovaAI(`Mejora la estructura y el formato de la siguiente nota: "${activeDoc.title}"\n${activeDoc.content.slice(0, 300)}`);
  };

  return (
    <div className="kova-notes-view flex-1 h-full w-full bg-[#06020e] flex flex-col justify-between select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header */}
      <div className="h-12 px-4 border-b border-purple-950/40 bg-[#080312]/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-sm text-purple-100 font-['Outfit']">{activeChannel.name}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">
            Docs & Notas Vivas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Preview / Edit mode */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-1 px-3 py-1 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 hover:text-white rounded-lg text-xs font-medium border border-purple-900/40 transition-all cursor-pointer"
          >
            {isPreviewMode ? <Edit3 className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5 text-purple-400" />}
            <span>{isPreviewMode ? 'Editar' : 'Vista Previa'}</span>
          </button>

          <button
            onClick={handleCreateNewNote}
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/30 border border-purple-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Nota</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content: Notes List Sidebar + Markdown Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left note selector */}
        <div className="w-64 border-r border-purple-950/40 bg-[#080312] p-3 space-y-2 overflow-y-auto shrink-0 custom-scrollbar">
          <div className="text-[11px] font-bold text-purple-400/60 uppercase tracking-wider px-1">
            Notas del Canal ({notes.length})
          </div>

          {notes.map((note) => {
            const isSelected = activeDoc?.id === note.id;
            return (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full p-2.5 rounded-xl text-left transition-all border block cursor-pointer ${
                  isSelected
                    ? 'bg-purple-900/30 border-purple-500/50 text-purple-100 shadow-sm shadow-purple-900/40'
                    : 'bg-purple-950/10 border-purple-950/30 hover:bg-purple-950/30 text-purple-300/70 hover:text-purple-100'
                }`}
              >
                <div className="text-xs font-bold truncate">{note.title}</div>
                <div className="text-[10px] text-purple-400/50 mt-1 truncate flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {note.lastEdited}
                </div>
                {note.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/30 text-purple-300 font-mono border border-purple-800/30"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Editor Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#06020e] custom-scrollbar">
          {activeDoc ? (
            <div className="max-w-3xl w-full mx-auto space-y-4">
              {/* Title input */}
              <input
                type="text"
                value={activeDoc.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-white font-['Outfit'] focus:outline-none border-b border-purple-950/50 pb-2 placeholder-purple-400/30 focus:border-purple-500/50 transition-colors"
                placeholder="Título del documento..."
              />

              {/* Status info */}
              <div className="flex items-center justify-between text-xs text-purple-400/60 pb-2">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-purple-400" /> {activeDoc.lastEdited}
                </span>
                {isSavedToast && (
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] animate-pulse">
                    <Check className="w-3 h-3" /> Auto-guardado
                  </span>
                )}
              </div>

              {/* Content Box */}
              {isPreviewMode ? (
                <div className="p-4 rounded-xl bg-[#090414] border border-purple-950/50 text-purple-100 text-sm whitespace-pre-wrap leading-relaxed select-text font-sans">
                  {activeDoc.content}
                </div>
              ) : (
                <textarea
                  value={activeDoc.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={18}
                  className="w-full bg-[#090414] border border-purple-950/50 rounded-xl p-4 text-purple-100 font-mono text-xs leading-6 resize-none focus:outline-none focus:border-purple-500/50 shadow-inner"
                  placeholder="Escribe el contenido en Markdown..."
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-purple-400/40 text-sm">
              Selecciona una nota o crea una nueva
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
