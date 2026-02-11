import { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLogin } from '../hooks/useData';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }

    try {
      await loginMutation.mutateAsync({ username, password });
      toast.success('Welcome back!');
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#6c8cff] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">📊</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Project Dashboard</h1>
          <p className="text-[#8892a4] text-[13px] sm:text-[14px] mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#111827] border border-[#1e2640] rounded-xl p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2.5 pl-10 pr-3 text-[14px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556]"
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2.5 pl-10 pr-3 text-[14px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556]"
                />
              </div>
            </div>

            {loginMutation.isError && (
              <div className="mb-4 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg flex items-center gap-2 text-[#ef4444] text-[13px]">
                <AlertCircle size={16} />
                <span>Invalid username or password</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 bg-[#6c8cff] text-white rounded-lg text-[14px] font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[#556] text-[12px] mt-6">
          Project Management Dashboard
        </p>
      </div>
    </div>
  );
}
