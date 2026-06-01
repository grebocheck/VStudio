import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes (e.g. a malformed config reaching the SVG
 * renderer) so the whole studio doesn't go blank, and offers a recovery path.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('V-Studio crashed:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  private handleClearStorage = () => {
    try {
      localStorage.removeItem('vstudio_config');
      localStorage.removeItem('vstudio_active_preset');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a] text-[#d1d1d1] p-6 font-sans">
        <div className="max-w-md w-full rounded-lg border border-rose-500/30 bg-[#0f0f12] p-6 text-center space-y-4">
          <div className="text-3xl">💥</div>
          <h1 className="text-lg font-bold text-white">Something broke</h1>
          <p className="text-xs text-white/60 leading-relaxed">
            The studio hit an unexpected error. Try recovering, or reset the saved
            avatar if a corrupt config is the cause.
          </p>
          <pre className="text-[10px] text-rose-400 bg-black/40 rounded p-2 overflow-auto max-h-32 text-left">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-xs font-bold rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={this.handleClearStorage}
              className="px-4 py-2 text-xs font-bold rounded-sm border border-white/15 hover:bg-white/5 text-white/80 cursor-pointer"
            >
              Reset avatar &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
