import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToWebsite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToWebsite }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guarantee that on mount or remount, fields are always completely empty and showPassword is false
  useEffect(() => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache'
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.token) {
        setErrorMessage(data.error || 'Invalid username or password.');
        setPassword(''); // Clear password on error
        setLoading(false);
        return;
      }

      // Success: clear inputs immediately from memory
      setUsername('');
      setPassword('');
      setShowPassword(false);
      onLoginSuccess(data.token, data.username);
    } catch (err: any) {
      setErrorMessage('Network error during login. Please try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <motion.button
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Clear inputs when navigating back
            setUsername('');
            setPassword('');
            setErrorMessage(null);
            onBackToWebsite();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-rose-200 text-sm border border-rose-500/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wapas jao (Back to Experience)</span>
        </motion.button>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-[#250d1b] via-[#190712] to-[#11030b] border border-rose-500/30 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-serif-display font-bold text-rose-100">
            Private Administrator Access
          </h2>
          <p className="text-xs text-rose-200/60 mt-1">
            Protected visitor dashboard. Enter your administrator credentials.
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-rose-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400/60">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter admin username"
                autoComplete="off"
                spellCheck="false"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-rose-100 placeholder-rose-300/30 text-sm transition-all"
              />
            </div>
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <label className="block text-xs font-medium text-rose-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400/60">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="new-password"
                required
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-rose-100 placeholder-rose-300/30 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-rose-400/60 hover:text-rose-200 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Login to Dashboard</span>
              )}
            </motion.button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-rose-500/20 text-center text-[11px] text-rose-300/40">
          Strict session privacy active • Credentials are cleared from memory upon logout
        </div>
      </motion.div>
    </div>
  );
};
