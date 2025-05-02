import  { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded mb-4 max-w-md w-full">
            <div className="flex">
              <AlertTriangle className="text-red-500 mr-3" size={24} />
              <div>
                <h3 className="text-red-800 font-medium">Something went wrong</h3>
                <p className="text-red-700 text-sm mt-1">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
          
          <button
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
 