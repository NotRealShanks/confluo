import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; onRetry?: () => void };
type State = { error: Error | null };

// Suspense-mode Liveblocks hooks throw on auth and connection errors
export class RoomErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      // Error details stay in development tools; tokens and workspace content are never rendered.
      console.error("Editor UI failed", {
        name: error.name,
        message: error.message,
        componentStack: info.componentStack,
      });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message = this.state.error.message || "";
    const isAuthError = /auth|unauthorized|forbidden|token|401|403/i.test(message);
    const isConnectionError = !isAuthError && /liveblocks|websocket|network|timeout|connection/i.test(message);

    let errorText = "The editor could not render the selected file.";
    if (isAuthError) {
      errorText = "Authentication failed. Please sign in again or check your project permissions.";
    } else if (isConnectionError) {
      errorText = "Could not connect to the collaboration service.";
    }

    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {errorText}{" "}
        <button
          onClick={() => {
            this.setState({ error: null });
            this.props.onRetry?.();
          }}
          className="font-medium underline"
        >
          Try again
        </button>
      </div>
    );
  }
}
