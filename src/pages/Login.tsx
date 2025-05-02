import  { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, MessageSquare } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 bg-primary-700 text-white p-10 flex flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center mb-6">
            <MessageSquare className="mr-2" size={32} />
            <h1 className="text-3xl font-bold">ChatterBox</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">Welcome back!</h2>
          <p className="mb-6">Login to continue your conversations with friends and colleagues.</p>
          
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9iaWxlfGVufDB8fHx8MTc0NjE2MjE5OHww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
              alt="Chat UI" 
              className="rounded-lg max-w-md shadow-lg"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Login to Your Account</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-3 text-gray-400 bg-gray-50">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="auth-input border-none rounded-none"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-3 text-gray-400 bg-gray-50">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="auth-input border-none rounded-none"
                />
              </div>
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="auth-btn"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p className="mt-4 text-center text-gray-600">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
 