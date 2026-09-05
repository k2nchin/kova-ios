import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-[#0b0d12] text-[#f4f7fb] font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="flex flex-col items-center w-full max-w-xl p-8 rounded-2xl bg-[#11151c] border border-white/[0.08] shadow-2xl">
            <AlertTriangle size={48} className="text-[#f1819a] mb-4 flex-shrink-0" />
            <h2 className="text-xl font-bold font-['Outfit'] mb-2">Se produjo un error al cargar Kova</h2>
            <p className="text-xs text-[#778398] mb-4 text-center">
              Hemos capturado el error en el cliente. Puedes recargar la aplicación o revisar el registro abajo.
            </p>

            <div className="p-4 w-full rounded-xl bg-[#080a0f] border border-white/[0.06] overflow-auto max-h-48 mb-6 font-mono text-[11px] text-[#f1819a]">
              <pre className="whitespace-pre-wrap">{this.state.error?.message || String(this.state.error)}</pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#72e4d0] text-[#0b0d12] font-bold text-xs hover:opacity-90 transition-opacity shadow-lg"
            >
              <RotateCcw size={15} />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
