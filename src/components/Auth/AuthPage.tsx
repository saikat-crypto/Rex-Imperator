import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth, type AuthModalMode } from '../../context/AuthContext';
import AnimatedUMascot from '../Branding/AnimatedUMascot';
import { BackgroundEngine } from '../BackgroundEngine/BackgroundEngine';

export const AuthPage: React.FC = () => {
  const {
    login,
    register,
    confirmCode,
    resendCode,
    requestPasswordReset,
    confirmPasswordReset,
    pendingEmail,
    setPendingEmail,
    isCognitoLive,
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode: AuthModalMode) => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setCode('');
    setNewPassword('');
    setMode(nextMode);
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.nextStep === 'CONFIRM_SIGN_UP') {
        setPendingEmail(email.trim());
        setMode('confirm');
        setPassword('');
        setCode('');
        setError(result.error || 'Please verify your email with the confirmation code.');
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      setMode('confirm');
      setError(null);
      setPassword('');
      setCode('');
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  // Confirm Verification Code Handler
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = pendingEmail || email.trim();
    if (!targetEmail || !code.trim()) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const result = await confirmCode(targetEmail, code.trim());
    setIsSubmitting(false);

    if (result.success) {
      setMode('signin');
      setError(null);
      setPassword('');
      setCode('');
      setSuccessMsg('Email verified successfully! You can now sign in.');
    } else {
      setError(result.error || 'Verification code is invalid or expired.');
    }
  };

  // Resend Code Handler
  const handleResend = async () => {
    const targetEmail = pendingEmail || email.trim();
    if (!targetEmail) return;
    setError(null);
    const result = await resendCode(targetEmail);
    if (result.success) {
      setSuccessMsg(`A new code has been sent to ${targetEmail}`);
    } else {
      setError(result.error || 'Failed to resend code.');
    }
  };

  // Forgot Password Request Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setMode('reset-confirm');
      setError(null);
      setPassword('');
      setCode('');
      setSuccessMsg(`Reset code sent to ${email.trim()}`);
    } else {
      setError(result.error || 'Failed to request password reset.');
    }
  };

  // Confirm Password Reset Handler
  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = pendingEmail || email.trim();
    if (!targetEmail || !code.trim() || !newPassword) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const result = await confirmPasswordReset(targetEmail, code.trim(), newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setMode('signin');
      setError(null);
      setPassword('');
      setCode('');
      setNewPassword('');
      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
    } else {
      setError(result.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans text-[#181615] select-none isolate bg-[#F8FAFC]">
      {/* Serene Sky & Cloud Background Layer */}
      <BackgroundEngine
        config={{
          type: 'sky',
          label: 'Sky & Clouds',
          description: 'Serene blue sky with soft drifting clouds',
        }}
      />

      {/* Main Full-Page Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-[440px] mx-4 bg-white/95 backdrop-blur-md border border-black/[0.08] rounded-3xl p-8 sm:p-9 shadow-soft-2xl"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          {/* Animated Mascot Hero */}
          <div className="mb-3 inline-block">
            <AnimatedUMascot
              cadence={4}
              style={{ width: 68, height: 68 }}
              className="mx-auto select-none drop-shadow-md"
            />
          </div>

          <h1 className="font-serif font-semibold text-3xl sm:text-[32px] text-[#181615] tracking-tight leading-tight">
            {mode === 'signin' && 'Welcome to Usher'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'confirm' && 'Verify your email'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset-confirm' && 'Set new password'}
          </h1>

          <p className="text-xs sm:text-[13px] text-[#7A7469] mt-2 max-w-[320px] leading-relaxed">
            {mode === 'signin' && 'Sign in to access your AI workspace, multimodal chat, and voice sessions.'}
            {mode === 'signup' && 'Set up your account to unlock your personal AI workspace.'}
            {mode === 'confirm' && `We sent a 6-digit confirmation code to ${pendingEmail || email}.`}
            {mode === 'forgot' && "Enter your account email to receive a recovery code."}
            {mode === 'reset-confirm' && `Enter the verification code sent to ${pendingEmail || email}.`}
          </p>

          {!isCognitoLive && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Demo sandbox mode (Cognito credentials optional)</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form: Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-medium text-[#4A453E]">Password</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11.5px] text-[#5A544A] hover:text-[#181615] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-10 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8578] hover:text-[#181615] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[14px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign in to Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-black/[0.06] mt-5">
              <span className="text-xs text-[#7A7469]">Don't have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-xs font-semibold text-[#181615] hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* Form: Sign Up */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-10 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8578] hover:text-[#181615] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#8C8578] mt-1">Must be at least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[14px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>

            <div className="text-center pt-3 border-t border-black/[0.06] mt-5">
              <span className="text-xs text-[#7A7469]">Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-[#181615] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* Form: Confirm Code */}
        {mode === 'confirm' && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5 text-center">
                6-digit Confirmation Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-4 py-3 text-[18px] tracking-[0.3em] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs text-center font-mono font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full mt-3 py-3 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[14px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
            </button>

            <div className="flex items-center justify-between pt-3 text-xs">
              <button
                type="button"
                onClick={handleResend}
                className="text-[#6A645A] hover:text-[#181615] hover:underline cursor-pointer"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-medium text-[#181615] hover:underline cursor-pointer"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}

        {/* Form: Forgot Password */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[14px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send recovery code'}
            </button>

            <div className="text-center pt-3 border-t border-black/[0.06] mt-5">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-[#181615] hover:underline cursor-pointer"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}

        {/* Form: Reset Password Confirm */}
        {mode === 'reset-confirm' && (
          <form onSubmit={handleResetConfirm} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code from email"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (8+ chars)"
                  className="w-full bg-[#FAF8F5]/80 border border-black/10 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[14px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set new password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
