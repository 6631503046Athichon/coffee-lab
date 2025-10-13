import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, LogIn, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_USERS } from '../../mockUsers';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Main Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-600 p-5 rounded-2xl shadow-xl">
              <Coffee className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Coffee Lab</h1>
          <p className="text-gray-600 text-lg">Digital Quality & Traceability Platform</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm hover:border-gray-400"
                  placeholder="your.email@coffee.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm hover:border-gray-400"
                  placeholder="••••••••"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 text-white py-4 rounded-xl font-semibold hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Mock Users Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-amber-100 rounded-xl shadow-sm">
                  <User className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Demo Accounts</h2>
                  <p className="text-sm text-gray-600">Click any account to login instantly</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user.email, user.password)}
                  disabled={isLoading}
                  className="w-full text-left p-5 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-amber-100 p-3 rounded-xl group-hover:bg-amber-200 transition shadow-sm">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-base">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{user.role}</p>
                      </div>
                    </div>
                    <LogIn className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition" />
                  </div>
                  <div className="pl-14 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold min-w-[45px]">Email:</span>
                      <span className="font-mono text-xs bg-gray-50 px-3 py-1.5 rounded-lg text-gray-700 shadow-sm border border-gray-200">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold min-w-[45px]">Pass:</span>
                      <span className="font-mono text-xs bg-gray-50 px-3 py-1.5 rounded-lg text-gray-700 shadow-sm border border-gray-200">{user.password}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d97706;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b45309;
        }
      `}</style>
    </div>
  );
};

export default Login;