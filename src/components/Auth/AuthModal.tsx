import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, KeyRound, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth, type AuthModalMode } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const resetLocalState = () => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setCode('');
    setNewPassword('');
  };

  const switchMode = (mode: AuthModalMode) => {
    resetLocalState();
    openAuthModal(mode);
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setIsSubmitting(true);

    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.nextStep === 'CONFIRM_SIGN_UP') {
        setPendingEmail(email.trim());
        switchMode('confirm');
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
      switchMode('confirm');
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
    setIsSubmitting(true);

    const result = await confirmCode(targetEmail, code.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg('Account verified! You can now sign in.');
      switchMode('signin');
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
    setIsSubmitting(true);

    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(`Reset code sent to ${email.trim()}`);
      switchMode('reset-confirm');
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
    setIsSubmitting(true);

    const result = await confirmPasswordReset(targetEmail, code.trim(), newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg('Password updated successfully! Please sign in.');
      switchMode('signin');
    } else {
      setError(result.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-[#FAF8F5] border border-black/[0.08] rounded-3xl p-6 sm:p-7 shadow-soft-2xl relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#7A7469] hover:text-[#181615] hover:bg-black/5 transition-colors"
          title="Close dialog (Escape)"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 mb-2 flex items-center justify-center">
            <img src="/logo-transparent.png" alt="Usher" className="w-12 h-12 object-contain drop-shadow-xs" />
          </div>

          <h2 className="font-serif font-semibold text-2xl text-[#181615] tracking-tight">
            {authModalMode === 'signin' && 'Welcome to Usher'}
            {authModalMode === 'signup' && 'Create your account'}
            {authModalMode === 'confirm' && 'Verify your email'}
            {authModalMode === 'forgot' && 'Reset your password'}
            {authModalMode === 'reset-confirm' && 'Set new password'}
          </h2>

          <p className="text-xs text-[#7A7469] mt-1 max-w-[300px]">
            {authModalMode === 'signin' && 'Sign in to access your AI workspace, chats, and voice sessions.'}
            {authModalMode === 'signup' && 'Get started with your personal AI intelligence workspace.'}
            {authModalMode === 'confirm' && `We sent a 6-digit confirmation code to ${pendingEmail || email}.`}
            {authModalMode === 'forgot' && "Enter your account email to receive a recovery code."}
            {authModalMode === 'reset-confirm' && `Enter the verification code sent to ${pendingEmail || email}.`}
          </p>

          {!isCognitoLive && (
            <span className="mt-2 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
              Demo sandbox mode (Cognito credentials optional)
            </span>
          )}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2 rounded-xl flex items-start gap-2"
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
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-xl flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        {authModalMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-medium text-[#4A453E]">Password</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11.5px] text-[#5A544A] hover:text-[#181615] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-10 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8578] hover:text-[#181615]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[13.5px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#7A7469]">Don't have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-xs font-semibold text-[#181615] hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {authModalMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-10 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8578] hover:text-[#181615]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#8C8578] mt-1">Must contain at least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[13.5px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#7A7469]">Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-[#181615] hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {authModalMode === 'confirm' && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Confirmation Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[16px] tracking-widest text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs text-center font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[13.5px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm code'}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleResend}
                className="text-[#6A645A] hover:text-[#181615] hover:underline"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-medium text-[#181615] hover:underline"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}

        {authModalMode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[13.5px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send recovery code'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-[#181615] hover:underline"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}

        {authModalMode === 'reset-confirm' && (
          <form onSubmit={handleResetConfirm} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">Reset Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code from email"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4A453E] mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8578]" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (8+ chars)"
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[14px] text-[#181615] placeholder:text-[#9C9588] focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] text-[13.5px] font-semibold transition-all shadow-soft-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set new password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
