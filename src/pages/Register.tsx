import  { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, MessageSquare, User } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
      navigate('/');
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || 'Failed to create an account');
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
          
          <h2 className="text-2xl font-semibold mb-4">Join our secure chat platform</h2>
          <p className="mb-6">Connect with friends and colleagues with end-to-end encrypted messaging.</p>
          
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwaW50ZXJmYWNlfGVufDB8fHx8MTc0NjEyOTUxMXww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
              alt="Modern architecture" 
              className="rounded-lg max-w-md shadow-lg"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Your Account</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-3 text-gray-400 bg-gray-50">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full name"
                  className="auth-input border-none rounded-none"
                />
              </div>
            </div>
            
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
            
            <div className="mb-4">
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
            
            <div className="mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-3 text-gray-400 bg-gray-50">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="auth-input border-none rounded-none"
                />
              </div>
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="auth-btn"
            >
              {loading ? 'Signing up...' : 'Create Account'}
            </button>
          </form>
          
          <p className="mt-4 text-center text-gray-600">
            Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
 