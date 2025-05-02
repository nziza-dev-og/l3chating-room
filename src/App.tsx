import  { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

function App() {
  // Track page views for analytics
  useEffect(() => {
    const trackPageView = () => {
      console.log('Page view:', window.location.pathname);
    };

    // Track initial page load
    trackPageView();

    // Track route changes
    window.addEventListener('popstate', trackPageView);
    return () => {
      window.removeEventListener('popstate', trackPageView);
    };
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
 