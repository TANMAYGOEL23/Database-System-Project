import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Factory, Loader2, ShieldAlert } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const { completeOAuthLogin } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation in development
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    // 1. Handle OAuth provider errors returned in query or hash
    const oauthError =
      params.get('error_description') ||
      hashParams.get('error_description') ||
      params.get('error') ||
      hashParams.get('error');

    if (oauthError) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setError(oauthError);
      showToast('error', 'Google Sign-In Failed', oauthError);
      setTimeout(() => navigate('/login', { replace: true }), 3500);
      return;
    }

    const code = params.get('code');

    // 2. Prevent duplicate code exchanges across StrictMode remounts
    if (code) {
      const lockKey = `smart_erp_pkce_${code}`;
      if (sessionStorage.getItem(lockKey)) {
        return;
      }
      sessionStorage.setItem(lockKey, 'pending');
    }

    // 3. Complete authentication (exchanging code if present or using detected session)
    completeOAuthLogin(code)
      .then((user) => {
        if (code) {
          sessionStorage.removeItem(`smart_erp_pkce_${code}`);
        }
        // Remove code and sensitive parameters from browser history
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        showToast('success', 'Security Authorized', `Signed in with Google as ${user.fullName}`);
        const destination = sessionStorage.getItem('smart_erp_return_to');
        sessionStorage.removeItem('smart_erp_return_to');
        const target = destination?.startsWith('/') && !destination.startsWith('//') ? destination : '/dashboard';
        navigate(target, { replace: true });
      })
      .catch((err: any) => {
        if (code) {
          sessionStorage.removeItem(`smart_erp_pkce_${code}`);
        }
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const msg = err?.message || 'Unable to complete Google sign-in';
        setError(msg);
        showToast('error', 'Access Denied', msg);
        setTimeout(() => navigate('/login', { replace: true }), 3500);
      });
  }, [completeOAuthLogin, navigate, showToast]);

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-black/50 w-full max-w-sm text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/25">
          <Factory className="w-7 h-7" />
        </div>
        {error ? (
          <>
            <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
            <h1 className="text-lg font-semibold text-white">Sign-in failed</h1>
            <p className="text-xs text-slate-400">{error}</p>
            <p className="text-[11px] text-slate-500 font-mono">Redirecting to login…</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <h1 className="text-lg font-semibold text-white">Verifying Google account</h1>
            <p className="text-xs text-slate-400 font-mono animate-pulse">
              Linking identity to ERP workspace…
            </p>
          </>
        )}
      </div>
    </div>
  );
};
