import React, { useState } from 'react';
import { Play, Terminal, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';

interface LiveCodeRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  language?: string;
}

export const LiveCodeRunnerModal: React.FC<LiveCodeRunnerModalProps> = ({
  isOpen,
  onClose,
  initialCode = `// Kova Interactive Code Playground
const items = ['Audio WebRTC', 'Chat en tiempo real', 'Notas Markdown', 'Soundboard FX'];
const filtered = items.filter(item => item.length > 5);

console.log("🚀 Módulos activos en Kova:", filtered);
console.log("⚡ Latencia estimada: < 1.2ms");
return \`Total de módulos analizados: \${filtered.length}\`;`,
  language = 'javascript',
}) => {
  const { sendMessage } = useApp();
  const [code, setCode] = useState(initialCode);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [execResult, setExecResult] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleRunCode = () => {
    soundFx.playSoundboardFx('arcade');
    setOutputLogs([]);
    setExecResult('Ejecución desactivada: Kova requiere un runner aislado en el backend.');
    setExecutionTimeMs(null);
    setIsError(true);
  };

  const handleShareToChat = () => {
    const summary = `// Resultado de ejecución Kova Playground:\n${
      execResult ? `> Retorno: ${execResult}\n` : ''
    }${outputLogs.length > 0 ? `> Logs:\n${outputLogs.join('\n')}` : ''}`;

    sendMessage(`He ejecutado este código en el Playground de Kova 🚀`, {
      language: 'javascript',
      code: `${code}\n\n${summary}`,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-[560px] rounded-3xl bg-[#0d071c] border border-purple-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(147,51,234,0.25)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-purple-950/40 bg-[#080312] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-900/30 text-purple-400 border border-purple-700/40">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Playground de Código en Vivo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  JS Engine
                </span>
              </h2>
              <p className="text-[11px] text-purple-400/60">Ejecuta y comparte código directamente en el canal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-purple-950/40 text-purple-400/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor + Console Split */}
        <div className="flex-1 grid grid-rows-2 p-4 gap-3 overflow-hidden bg-[#06020e]">
          {/* Code Editor */}
          <div className="flex flex-col bg-[#0d071c] rounded-2xl border border-purple-950/50 overflow-hidden">
            <div className="px-3 py-1.5 bg-[#080312] border-b border-purple-950/40 flex items-center justify-between text-xs text-purple-400/70">
              <span className="font-mono text-[11px] text-purple-300 font-semibold">Entrada de Código</span>
              <button
                onClick={handleRunCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar</span>
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full p-3 bg-transparent font-mono text-xs text-purple-100 resize-none focus:outline-none leading-5 custom-scrollbar"
            />
          </div>

          {/* Console Output */}
          <div className="flex flex-col bg-[#090414] rounded-2xl border border-purple-950/50 overflow-hidden">
            <div className="px-3 py-1.5 bg-[#080312] border-b border-purple-950/40 flex items-center justify-between text-xs text-purple-400/70">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-purple-300">Consola / Salida</span>
                {executionTimeMs !== null && (
                  <span className="text-[10px] text-emerald-400 font-mono">({executionTimeMs}ms)</span>
                )}
              </div>
              <button
                onClick={() => {
                  setOutputLogs([]);
                  setExecResult(null);
                }}
                className="text-[10px] text-purple-400/50 hover:text-purple-200 cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
              {outputLogs.map((log, idx) => (
                <div key={idx} className="text-purple-200 flex items-start gap-2">
                  <span className="text-purple-500 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {execResult && (
                <div
                  className={`mt-2 p-2 rounded-lg ${
                    isError
                      ? 'bg-rose-950/30 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <span className="font-bold">{isError ? 'Error: ' : 'Retorno: '}</span>
                  <span>{execResult}</span>
                </div>
              )}
              {outputLogs.length === 0 && !execResult && (
                <div className="text-purple-400/40 italic">Presiona "Ejecutar" para ver la salida aquí...</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-6 bg-[#080312] border-t border-purple-950/40 flex items-center justify-between">
          <div className="text-xs text-purple-400/60">
            Puedes insertar este resultado formateado en el canal.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-purple-400/60 hover:text-white cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleShareToChat}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              Publicar en el Canal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
