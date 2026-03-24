import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg rounded-2xl border border-rose-500/50 bg-rose-500/10 p-6">
          <h2 className="text-xl font-bold text-rose-400">Something broke on this page</h2>
          <p className="mt-2 text-sm text-rose-200">{this.state.error?.message || 'Please refresh and try again.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
