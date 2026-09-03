import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-neutral-900 text-white rounded-lg text-center select-none">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold mb-1">Сталася неочікувана помилка відображення</h2>
          <p className="text-sm text-neutral-400 mb-4 max-w-md">
            {this.state.error?.message || 'Помилка рендерингу компонента'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            Спробувати знову
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
