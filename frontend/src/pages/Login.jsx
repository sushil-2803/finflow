import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Shield, Sparkles, TrendingUp, IndianRupee, HelpCircle } from 'lucide-react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [error, setError] = useState(
    !googleClientId || googleClientId === 'mock_client_id'
      ? 'Google Client ID is not configured. Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.'
      : ''
  );
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!googleClientId || googleClientId === 'mock_client_id') {
      return;
    }

    let cancelled = false;

    const handleCredentialResponse = async (response) => {
      if (!response.credential) {
        setError('Google did not return a sign-in credential. Please try again.');
        return;
      }

      setError('');
      setLoading(true);
      const result = await login(response.credential);
      setLoading(false);

      if (cancelled) return;

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    };

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        width: googleButtonRef.current.offsetWidth,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
      const script = existingScript || document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      script.onerror = () => {
        if (!cancelled) {
          setError('Unable to load Google sign-in. Check your connection and try again.');
        }
      };

      if (!existingScript) {
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl glass border border-white/5 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* Left Side: Product Branding & Features */}
        <div className="flex-1 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">FinFlow</span>
          </div>

          <div className="my-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Master Your Money,<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                Grow Your Savings
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Keep monthly budgets under control, separate special event expenses, and track your overall wealth.
            </p>

            <ul className="space-y-3 pt-4 text-xs text-slate-300">
              <li className="flex items-start">
                <Sparkles className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                <span>Custom event group trackers (Trips, Weddings, Events).</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="h-4 w-4 mr-2 text-emerald-400 shrink-0" />
                <span>Automatic savings generation from unused monthly budgets.</span>
              </li>
              <li className="flex items-start">
                <Shield className="h-4 w-4 mr-2 text-violet-400 shrink-0" />
                <span>Secure JWT-protected transactions with audit trails.</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Built for modern developers & financial control.</span>
          </div>
        </div>

        {/* Right Side: Login Options */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-slate-900/40">
          <div className="text-center md:text-left mb-8">
            <h3 className="text-2xl font-bold text-white tracking-tight">Get Started</h3>
            <p className="text-slate-400 text-sm mt-1.5">Sign in to sync your budgets and track expenses</p>
          </div>

          {error && (
            <div className="mb-6 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-xs leading-relaxed">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative min-h-11 w-full overflow-hidden rounded-xl bg-white shadow-lg shadow-white/5">
              <div ref={googleButtonRef} className="flex min-h-11 w-full items-center justify-center"></div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <span className="h-5 w-5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-1.5">
            <HelpCircle className="h-4 w-4 text-slate-500" />
            <span>Use the Google account configured for this app.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
