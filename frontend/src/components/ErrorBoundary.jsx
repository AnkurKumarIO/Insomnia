import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          background: '#0b1326',
          color: '#dae2fd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, maxWidth: '500px', lineHeight: 1.6, marginBottom: '2rem' }}>
            The application encountered an unexpected error. This usually happens due to a data loading issue or a temporary connectivity problem.
          </p>
          <div style={{
            background: 'rgba(255,107,107,0.1)',
            border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            fontSize: '0.8rem',
            color: '#ff6767',
            fontFamily: 'monospace',
            maxWidth: '80%',
            overflowX: 'auto'
          }}>
            {this.state.error?.toString()}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #c3c0ff)',
                color: '#1d00a5',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              style={{
                background: '#222a3d',
                color: '#c7c4d8',
                border: '1px solid rgba(70,69,85,0.3)',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Clear Session & Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
