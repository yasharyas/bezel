import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  icon?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
          <div className="text-center max-w-md">
            <span className="text-6xl block mb-4">{this.props.icon ?? "⚠️"}</span>
            <h1 className="text-2xl font-bold text-neutral-900 mb-3">
              {this.props.title ?? "Something went wrong"}
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              {this.props.description ?? "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              {this.props.buttonLabel ?? "Refresh Page"}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
