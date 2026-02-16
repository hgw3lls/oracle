import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' };
  }

  componentDidCatch() {
    // Intentionally swallow to keep sibling mode usable.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mode-error-fallback" role="alert">
          <h2>Mode failed to render</h2>
          <p>{this.state.message || 'Something went wrong in this mode.'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
