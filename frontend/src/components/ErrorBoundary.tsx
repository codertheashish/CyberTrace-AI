import { Component, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('CyberTrace AI UI crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-slate-200 p-6">
          <div className="max-w-md text-center space-y-4">
            <AlertOctagon size={40} className="text-rose-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Something went wrong on this page</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              The interface hit an unexpected error, likely because the backend returned an
              unexpected response (e.g. the ML model isn't trained yet on this deployment). Check the
              backend's <code className="text-cyan-400 font-mono-tech">/api/health</code> endpoint, then
              reload.
            </p>
            {this.state.message && (
              <p className="text-[10px] text-slate-700 font-mono-tech break-words">{this.state.message}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 rounded-lg"
            >
              <RotateCcw size={14} /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
