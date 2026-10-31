import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

type Props = {
  children: ReactNode;
  fileName?: string;
  onReset?: () => void;
};

type State = {
  error: Error | null;
  prevFileName?: string;
};

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null, prevFileName: this.props.fileName };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.fileName !== state.prevFileName) {
      return { error: null, prevFileName: props.fileName };
    }
    return null;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Editor component failed", {
        name: error.name,
        message: error.message,
        componentStack: info.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const { fileName } = this.props;
    const message = this.state.error.message || "An unexpected error occurred while rendering the editor.";

    return (
      <div className="ide-empty-editor ide-editor-error" role="alert">
        <AlertCircle size={28} className="text-red-500" />
        <strong>Could not open {fileName ? `"${fileName}"` : "the selected file"}</strong>
        <span className="text-sm text-gray-500 max-w-md text-center">{message}</span>
        <div className="ide-welcome-actions mt-3">
          <button type="button" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          {this.props.onReset && (
            <button type="button" onClick={this.handleReset}>
              Close file
            </button>
          )}
        </div>
      </div>
    );
  }
}
