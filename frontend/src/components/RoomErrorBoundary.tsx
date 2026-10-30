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
      console.error("Editor UI failed", { name: error.name, message: error.message, componentStack: info.componentStack });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    const connectionError = /liveblocks|websocket|auth|connection/i.test(this.state.error.message);
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {connectionError ? "Could not connect to the collaboration service." : "The editor could not render the selected file."}{" "}
        <button onClick={() => { this.setState({ error: null }); this.props.onRetry?.(); }} className="font-medium underline">
          Try again
        </button>
      </div>
    );
  }
}
