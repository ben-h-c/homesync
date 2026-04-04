import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export default function ClientLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login or register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth-client/login' : '/auth-client/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, first_name: firstName };

      const res = await fetch(`${API_BASE}/portal/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      // Store client token
      localStorage.setItem('clientToken', data.token);
      localStorage.setItem('clientUser', JSON.stringify(data.client));
      navigate('/portal/projects');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-dark">Home</span><span className="text-primary">Sync</span>
          </h1>
          <p className="text-gray-500 mt-1">Client Portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              Sign In
            </button>
            <button onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required autoFocus autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Have a portal link?{' '}
            <span className="text-gray-400">Paste it directly in your browser to access your project.</span>
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-400">
          Are you a contractor? <Link to="/login" className="text-primary hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
