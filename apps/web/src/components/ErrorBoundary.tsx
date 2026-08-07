import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered instead of the default full-page fallback (e.g. <AiResting/>). */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors in its subtree so an uncaught throw can't
 * white-screen the whole app. At the top level it shows a friendly reload
 * fallback; pass `fallback` to isolate a smaller surface (keeping the rest of
 * the page — e.g. the glossary — alive).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-lg font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-foreground hover:bg-primary/20 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
