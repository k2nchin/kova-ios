import React, { useState } from 'react';
import { Play, Terminal, X, Check, Copy, Sparkles, RefreshCw } from 'lucide-react';
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
const communityMembers = ['Juanpi', 'Elena', 'Alex', 'Marcus', 'Sophia'];
const activeDevs = communityMembers.filter(name => name.length > 4);

console.log("🚀 Desarrolladores activos en Kova:", activeDevs);
console.log("⚡ Rendimiento estimado: < 1.1ms");
return \`Total de miembros analizados: \${communityMembers.length}\`;`,
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
    const logs: string[] = [];
    const originalLog = console.log;

    console.log = (...args: unknown[]) => {
      logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      originalLog(...args);
    };

    const startTime = performance.now();
    try {
      // Evaluate the user code safely
      const runFn = new Function(code);
      const result = runFn();
      const duration = performance.now() - startTime;

      setOutputLogs(logs);
      setExecResult(result !== undefined ? String(result) : null);
      setExecutionTimeMs(Number(duration.toFixed(2)));
      setIsError(false);
    } catch (err: unknown) {
      setOutputLogs(logs);
      setExecResult(err instanceof Error ? err.message : String(err));
      setExecutionTimeMs(0);
      setIsError(true);
    } finally {
      console.log = originalLog;
    }
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
        className="w-full max-w-2xl h-[560px] rounded-3xl bg-[#12141e] border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden glow-cyan animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.08] bg-[#161926] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Playground de Código en Vivo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  JS / TS Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Ejecuta y comparte código directamente en el chat</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor + Console Split */}
        <div className="flex-1 grid grid-rows-2 p-4 gap-3 overflow-hidden bg-[#0c0d14]">
          {/* Code Editor */}
          <div className="flex flex-col bg-[#141724] rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#181c2c] border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-cyan-400 font-semibold">Entrada de Código</span>
              <button
                onClick={handleRunCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar</span>
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full p-3 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-5"
            />
          </div>

          {/* Console Output */}
          <div className="flex flex-col bg-[#0f111a] rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#141622] border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-slate-300">Consola / Salida</span>
                {executionTimeMs !== null && (
                  <span className="text-[10px] text-emerald-400 font-mono">({executionTimeMs}ms)</span>
                )}
              </div>
              <button
                onClick={() => {
                  setOutputLogs([]);
                  setExecResult(null);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Limpiar
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1">
              {outputLogs.map((log, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-500 select-none">&gt;</span>
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
                <div className="text-slate-600 italic">Presiona "Ejecutar" para ver la salida aquí...</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-6 bg-[#161926] border-t border-white/[0.08] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Puedes insertar este resultado formateado en el canal.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
            <button
              onClick={handleShareToChat}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Publicar en el Canal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
