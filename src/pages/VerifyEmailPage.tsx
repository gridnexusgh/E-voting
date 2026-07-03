import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromQuery = params.get('email') || '';
    setEmail(emailFromQuery);
  }, [location.search]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  async function sendCode() {
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email },
      });

      if (error || !data?.success) {
        const cooldown = data?.cooldownSeconds;
        if (cooldown) setCooldownSeconds(cooldown);
        setError(error?.message || data?.error || 'Unable to send verification code');
        return;
      }

      setCooldownSeconds(60);
      setMessage('A new verification code has been sent.');
    } catch {
      setError('Unable to send verification code');
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyCode() {
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email, verifyCode: code.trim() },
      });

      if (error || !data?.success) {
        setError(error?.message || data?.error || 'Verification failed');
        return;
      }

      const { error: updateError } = await supabase.from('users').update({ is_email_verified: true }).eq('email', email);
      if (updateError) {
        setError('The code was valid, but your account could not be updated.');
        return;
      }

      setMessage('Your email is verified. You can now sign in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_26%),linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_45%,_#dbeafe_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-8 lg:flex-row lg:items-center lg:p-10">
        <div className="max-w-md rounded-[1.75rem] bg-slate-950 p-8 text-white sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Verify your email</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Enter the 6-digit code that was sent to your university email so you can continue securely.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
            A fresh code is only valid for a short time, so be sure to check your inbox and spam folder.
          </div>
        </div>

        <div className="flex-1">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                placeholder="032xxxx@htu.edu.gh"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                placeholder="123456"
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Verifying...</span></> : <><span>Verify Code</span><ArrowRight className="h-5 w-5" /></>}
            </button>

            <button
              onClick={sendCode}
              disabled={isLoading || cooldownSeconds > 0}
              className="w-full text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 disabled:text-slate-400"
            >
              {cooldownSeconds > 0 ? `Resend code in 00:${String(cooldownSeconds).padStart(2, '0')}` : 'Resend code'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-slate-600 transition-colors hover:text-blue-700">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
