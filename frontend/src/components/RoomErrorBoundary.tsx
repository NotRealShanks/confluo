import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

// Suspense-mode Liveblocks hooks throw on auth and connection errors
export class RoomErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Could not connect to the editor.{" "}
        <button onClick={() => this.setState({ failed: false })} className="font-medium underline">
          Try again
        </button>
      </div>
    );
  }
}
