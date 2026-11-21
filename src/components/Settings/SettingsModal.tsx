import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  BarChart3,
  AlignLeft,
  Smile,
  Sigma,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferences,
  type ResponseLengthPreference,
  type RichFormattingPreference,
  type EmojiPreference,
} from '../../context/PreferencesContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, changePassword } = useAuth();
  const { preferences, updatePreference } = usePreferences();

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const isEmailPasswordUser = user?.authProvider !== 'google';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!oldPassword) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsChangingPass(false);

    if (res.success) {
      setPassSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPassSuccess(null);
      }, 2000);
    } else {
      setPassError(res.error || 'Failed to update password.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-[#FAF8F5] border border-black/10 rounded-2xl shadow-soft-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between shrink-0 bg-white/70 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#181615] text-[#FCD702] flex items-center justify-center shadow-xs">
                <Sliders className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-[#181615] text-lg tracking-tight leading-tight">
                  Settings
                </h2>
                <p className="text-[11.5px] text-[#7A7469]">
                  Account identity, tutor persona & response preferences
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6E685E] hover:text-[#181615] hover:bg-black/5 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
            {/* 1. Account Identity Section */}
            <section className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D93025]" />
                  <h3 className="text-[13px] font-semibold text-[#181615] uppercase tracking-wider">
                    Account Details
                  </h3>
                </div>

                {/* Login Method Pill Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                    user?.authProvider === 'google'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {user?.authProvider === 'google' ? (
                    <>
                      <span className="font-bold">G</span>
                      <span>Google Account</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email & Password</span>
                    </>
                  )}
                </span>
              </div>

              {/* Read-only Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-black/[0.05]">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#7A7469] mb-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#A09A90]" />
                      Full Name
                    </span>
                    <span className="text-[9.5px] uppercase font-bold text-[#A59F94] bg-black/[0.04] px-1.5 py-0.2 rounded">
                      Locked
                    </span>
                  </div>
                  <p className="text-[13.5px] font-semibold text-[#181615] truncate">
                    {user?.name || 'Student'}
                  </p>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-black/[0.05]">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#7A7469] mb-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#A09A90]" />
                      Email Address
                    </span>
                    <span className="text-[9.5px] uppercase font-bold text-[#A59F94] bg-black/[0.04] px-1.5 py-0.2 rounded">
                      Locked
                    </span>
                  </div>
                  <p className="text-[13.5px] font-semibold text-[#181615] truncate" title={user?.email}>
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>

              {/* Password Section */}
              {isEmailPasswordUser ? (
                <div className="pt-2 border-t border-black/[0.05]">
                  {!showPasswordChange ? (
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(true)}
                      className="flex items-center gap-2 text-[12.5px] font-medium text-[#504A41] hover:text-[#181615] p-1.5 rounded-lg hover:bg-black/[0.03] transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-[#8A8478]" />
                      <span>Change password</span>
                    </button>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-1 animate-fade-in">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-[#181615] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#8A8478]" />
                          Update Password
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setPassError(null);
                            setPassSuccess(null);
                          }}
                          className="text-[11px] text-[#7A7469] hover:text-[#181615]"
                        >
                          Cancel
                        </button>
                      </div>

                      {passError && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12px] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{passError}</span>
                        </div>
                      )}

                      {passSuccess && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>{passSuccess}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="relative">
                          <input
                            type={showOldPass ? 'text' : 'password'}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Current password"
                            className="w-full px-3 py-1.5 text-[12.5px] bg-[#FAF8F5] border border-black/15 rounded-lg pr-8 focus:outline-none focus:ring-1 focus:ring-[#181615]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPass(!showOldPass)}
                            className="absolute right-2 top-2 text-[#8A8478] hover:text-[#181615]"
                          >
                            {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (8+ chars)"
                            className="w-full px-3 py-1.5 text-[12.5px] bg-[#FAF8F5] border border-black/15 rounded-lg pr-8 focus:outline-none focus:ring-1 focus:ring-[#181615]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-2 top-2 text-[#8A8478] hover:text-[#181615]"
                          >
                            {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-3 py-1.5 text-[12.5px] bg-[#FAF8F5] border border-black/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#181615]"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isChangingPass || !oldPassword || !newPassword}
                          className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#181615] text-white hover:bg-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          {isChangingPass ? 'Updating...' : 'Save Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-black/[0.05] text-[11.5px] text-[#8C867C] italic">
                  Password management is handled by your Google account.
                </div>
              )}
            </section>

            {/* 2. Response & Learning Preferences Section */}
            <section className="bg-white rounded-xl border border-black/[0.06] p-4 sm:p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-[13px] font-semibold text-[#181615] uppercase tracking-wider">
                  Response & Learning Preferences
                </h3>
              </div>

              {/* 1. Response Length */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-[#181615] flex items-center gap-1.5">
                    <span>1. Response Length</span>
                  </label>
                  <span className="text-[11px] text-[#7A7469] font-medium capitalize">
                    {preferences.responseLength}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#7A7469] mb-2 leading-tight">
                  Controls the depth and elaboration of Usher's step-by-step explanations.
                </p>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-black/[0.06]">
                  {(['concise', 'balanced', 'long'] as ResponseLengthPreference[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updatePreference('responseLength', opt)}
                      className={`py-1.5 px-2 rounded-lg text-[12px] font-semibold capitalize transition-all cursor-pointer ${
                        preferences.responseLength === opt
                          ? 'bg-white text-[#181615] shadow-soft-xs border border-black/10'
                          : 'text-[#6A645A] hover:text-[#181615]'
                      }`}
                    >
                      {opt === 'concise' && '⚡ Concise'}
                      {opt === 'balanced' && '⚖️ Balanced'}
                      {opt === 'long' && '📖 Long'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Charts, Graphs & Visual Elements (Toggle switch) */}
              <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between">
                <div className="pr-4">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#5A544A]" />
                    <span className="text-[13px] font-semibold text-[#181615]">
                      2. Charts, graphs and visual elements
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#7A7469] mt-0.5 leading-tight">
                    Render interactive visual cards, metric charts, and visual components.
                  </p>
                </div>

                {/* Animated Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.visualElements}
                  onClick={() => updatePreference('visualElements', !preferences.visualElements)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.visualElements ? 'bg-[#181615]' : 'bg-[#DCD8D0]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      preferences.visualElements ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Rich Formatting */}
              <div className="pt-3 border-t border-black/[0.05]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-[#181615] flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-[#5A544A]" />
                    <span>3. Rich Formatting</span>
                  </label>
                  <span className="text-[11px] text-[#7A7469] font-medium capitalize">
                    {preferences.richFormatting}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#7A7469] mb-2 leading-tight">
                  Formatting density: paragraph flow vs. headers, bullet points, callout badges, and tables.
                </p>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-black/[0.06]">
                  {(['none', 'slight', 'balanced', 'high'] as RichFormattingPreference[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updatePreference('richFormatting', opt)}
                      className={`py-1.5 px-2 rounded-lg text-[12px] font-semibold capitalize transition-all cursor-pointer ${
                        preferences.richFormatting === opt
                          ? 'bg-white text-[#181615] shadow-soft-xs border border-black/10'
                          : 'text-[#6A645A] hover:text-[#181615]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Emojis */}
              <div className="pt-3 border-t border-black/[0.05]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-[#181615] flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-[#5A544A]" />
                    <span>4. Emojis</span>
                  </label>
                  <span className="text-[11px] text-[#7A7469] font-medium capitalize">
                    {preferences.emojis}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#7A7469] mb-2 leading-tight">
                  Frequency of icons and emojis to personalize tone and visual energy.
                </p>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-black/[0.06]">
                  {(['none', 'less', 'balanced', 'high'] as EmojiPreference[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updatePreference('emojis', opt)}
                      className={`py-1.5 px-2 rounded-lg text-[12px] font-semibold capitalize transition-all cursor-pointer ${
                        preferences.emojis === opt
                          ? 'bg-white text-[#181615] shadow-soft-xs border border-black/10'
                          : 'text-[#6A645A] hover:text-[#181615]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reassuring LaTeX Guarantee Notice */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sigma className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div className="text-[11.5px] text-[#554E44] leading-relaxed">
                  <strong className="font-semibold text-[#181615]">LaTeX Math Guarantee:</strong>{' '}
                  Mathematical formulas ($V = IR$), chemical equations, and units are always strictly formatted in high-precision LaTeX regardless of your response length or formatting preference.
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-black/[0.06] flex items-center justify-between shrink-0 bg-white/70 backdrop-blur-xs">
            <span className="text-[11.5px] text-[#8C867C]">
              Preferences save automatically
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl text-[13px] font-semibold bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
