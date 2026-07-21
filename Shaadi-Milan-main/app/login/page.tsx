'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    
    if (!email.trim() || !password) { 
      const errorMsg = 'Please enter both email and password';
      setError(errorMsg);
      toast.error(errorMsg);
      return; 
    }
    
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1000);
    } else {
      const errorMsg = result.error || 'Invalid email or password';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      setPassword('');
    }
  };

  // Custom cursor style
  const customCursor = {
    cursor: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="27" viewBox="0 0 24 27"><polygon points="2,2 22,13 12,13 10,25" fill="%237c5cfc" stroke="%23ffffff" stroke-width="1.5"/><circle cx="8" cy="10" r="1.5" fill="%23ffffff"/></svg>\') 4 2, auto',
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ 
        background: 'var(--bg-deep)',
        ...customCursor
      }}
    >
      {/* Animated Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20 blur-[80px] animate-pulse"
        style={{ background: '#7c5cfc', animationDuration: '4s' }} />
      <div className="absolute bottom-[5%] left-[-5%] w-72 h-72 rounded-full opacity-20 blur-[80px] animate-pulse"
        style={{ background: '#e8568a', animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute top-[40%] left-[40%] w-48 h-48 rounded-full opacity-15 blur-[80px] animate-pulse"
        style={{ background: '#f5a623', animationDuration: '6s', animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-10 backdrop-blur-sm bg-opacity-95 transition-all duration-300 hover:shadow-2xl">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#f5a623]/10 to-[#e8568a]/10 p-0.5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e8568a] opacity-20" />
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm">
                  <Image
                    src="/logo.png" // Update this path to match your logo filename
                    alt="Shaadi Milan Logo"
                    width={3258}
                    height={3258}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
              </div>
            </div>
            <h1 className="font-display text-2xl font-semibold bg-gradient-to-r from-[#ffc84a] to-[#ffa500] bg-clip-text text-transparent">
              Shaadi Milan
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[2px] mt-1">
              Admin Control Panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">
                Admin Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@arvika.in"
                  className={`w-full bg-[var(--bg-surface)] border rounded-xl px-4 py-3 text-[var(--text)] placeholder-[var(--text-dim)] text-sm font-[inherit] outline-none transition-all duration-200
                    ${focusedField === 'email' 
                      ? 'border-[#7c5cfc] shadow-[0_0_0_3px_rgba(124,92,252,0.1)]' 
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  disabled={loading}
                  autoComplete="email"
                  style={{ cursor: 'text' }}
                />
                {email && !loading && (
                  <button
                    type="button"
                    onClick={() => setEmail('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                    style={{ cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className={`w-full bg-[var(--bg-surface)] border rounded-xl px-4 py-3 text-[var(--text)] placeholder-[var(--text-dim)] text-sm font-[inherit] outline-none transition-all duration-200
                    ${focusedField === 'password' 
                      ? 'border-[#7c5cfc] shadow-[0_0_0_3px_rgba(124,92,252,0.1)]' 
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ cursor: 'text' }}
                />
              </div>
            </div>

            {/* Error display with animation */}
            {error && (
              <div className="bg-[rgba(232,86,106,0.1)] border border-[rgba(232,86,106,0.3)] rounded-xl px-4 py-3 text-[11px] text-[#ff8fa3] animate-shake">
                <div className="flex items-center gap-2">
                  <span className="text-base">❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl text-white text-sm font-semibold tracking-wide overflow-hidden transition-all duration-300 disabled:opacity-60 mt-2 group"
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #e8568a)' }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : 'Sign In to Admin Panel'}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full" 
                  style={{ transition: 'all 0.6s ease-in-out' }} 
                />
              )}
            </button>
          </form>

          
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Custom cursor for interactive elements */
        button, a, [role="button"] {
          cursor: pointer;
        }
        
        input, textarea, [contenteditable="true"] {
          cursor: text;
        }
        
        /* Smooth transitions */
        * {
          transition-property: opacity, transform, border-color, background-color, box-shadow;
          transition-duration: 0.2s;
          transition-timing-function: ease;
        }
      `}</style>
    </div>
  );
}