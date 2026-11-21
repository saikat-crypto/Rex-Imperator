import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferences,
  type ResponseLengthPreference,
  type RichFormattingPreference,
  type EmojiPreference,
} from '../../context/PreferencesContext';
import { SidebarToggleIcon } from '../Sidebar/SidebarToggleIcon';
import { CustomDropdown } from '../UI/CustomDropdown';

interface SettingsPageProps {
  onBack: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { user, changePassword } = useAuth();
  const { preferences, updatePreference, isSaved } = usePreferences();

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
      setPassSuccess('Password updated successfully.');
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="relative flex-1 h-full w-full flex flex-col min-w-0 overflow-hidden bg-[#FAF8F5] select-none"
    >
      {/* Top Header */}
      <header className="relative w-full h-14 bg-white border-b border-black/[0.08] flex items-center justify-between px-4 sm:px-8 z-20 shrink-0">
        <div className="flex items-center gap-3">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-[#4E483E] hover:text-[#181615] hover:bg-black/5 transition-colors shrink-0 border border-black/[0.06]"
              title="Expand sidebar (Ctrl+B)"
            >
              <SidebarToggleIcon isOpen={false} className="w-[17px] h-[17px]" />
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#4A453E] hover:text-[#181615] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
            <span>Back to Chat</span>
          </button>

          <span className="text-[#D0CAC0] text-sm hidden sm:inline">•</span>

          <h1 className="text-[15px] font-semibold text-[#181615] tracking-tight">
            Settings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#6B655B] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
            <span>{isSaved ? 'Saved' : 'Saving...'}</span>
          </span>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium bg-[#181615] hover:bg-black text-white transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </header>

      {/* Main Page Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-14 lg:px-20 py-8 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header Title */}
          <div>
            <h2 className="text-xl font-semibold text-[#181615] tracking-tight">
              Settings & Preferences
            </h2>
            <p className="text-[13px] text-[#6B655B] mt-1">
              Manage your account credentials and customize how responses are delivered.
            </p>
          </div>

          {/* 1. Account Details Section */}
          <section className="bg-white rounded-xl border border-black/[0.08] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-[14px] font-semibold text-[#181615]">
                Account Information
              </h3>
              <p className="text-[12.5px] text-[#6B655B] mt-0.5">
                Your authenticated profile details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#6B655B] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.name || 'Student'}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-black/10 rounded-lg text-[13px] font-medium text-[#181615] cursor-default focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6B655B] mb-1.5">
                  Email Address
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.email || 'user@example.com'}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-black/10 rounded-lg text-[13px] font-medium text-[#181615] cursor-default focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px] pt-1 text-[#6B655B]">
              <span>Sign-in Provider</span>
              <span className="font-medium text-[#181615]">
                {user?.authProvider === 'google' ? 'Google' : 'Email and Password'}
              </span>
            </div>

            {isEmailPasswordUser ? (
              <div className="pt-3 border-t border-black/[0.06]">
                {!showPasswordChange ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(true)}
                    className="text-[13px] font-medium text-[#181615] hover:underline cursor-pointer"
                  >
                    Change password
                  </button>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#181615]">
                        Update Password
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPassError(null);
                          setPassSuccess(null);
                        }}
                        className="text-[12px] text-[#6B655B] hover:text-[#181615]"
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
                          className="absolute right-2.5 top-2 text-[#7A7469] hover:text-[#181615]"
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
                          className="absolute right-2.5 top-2 text-[#7A7469] hover:text-[#181615]"
                        >
                          {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-3 py-1.5 text-[12.5px] bg-[#FAF8F5] border border-black/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#181615]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isChangingPass || !oldPassword || !newPassword}
                        className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#181615] text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isChangingPass ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="pt-3 border-t border-black/[0.06] text-[12px] text-[#6B655B]">
                Password is managed through your Google account.
              </div>
            )}
          </section>

          {/* 2. Preferences Section */}
          <section className="bg-white rounded-xl border border-black/[0.08] p-5 sm:p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="text-[14px] font-semibold text-[#181615]">
                Response Preferences
              </h3>
              <p className="text-[12.5px] text-[#6B655B] mt-0.5">
                Configure output formatting, depth, and presentation structure.
              </p>
            </div>

            {/* 1. Response Length Dropdown */}
            <div className="space-y-2 pt-2">
              <div>
                <h4 className="text-[13.5px] font-medium text-[#181615]">
                  Response Length
                </h4>
                <p className="text-[12.5px] text-[#6B655B] mt-0.5 leading-relaxed">
                  Controls the depth, conceptual breadth, and elaboration of responses.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <CustomDropdown<ResponseLengthPreference>
                  value={preferences.responseLength}
                  onChange={(val) => updatePreference('responseLength', val)}
                  options={[
                    { value: 'concise', label: 'Concise' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'long', label: 'Long' },
                  ]}
                  ariaLabel="Response Length"
                />
              </div>
            </div>

            {/* 2. Charts, graphs and visual elements Dropdown */}
            <div className="space-y-2 pt-5 border-t border-black/[0.06]">
              <div>
                <h4 className="text-[13.5px] font-medium text-[#181615]">
                  Charts, Graphs and Visual Elements
                </h4>
                <p className="text-[12.5px] text-[#6B655B] mt-0.5 leading-relaxed">
                  Controls the generation of interactive visual cards, metric charts, and visual components.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <CustomDropdown<boolean>
                  value={preferences.visualElements}
                  onChange={(val) => updatePreference('visualElements', val)}
                  options={[
                    { value: true, label: 'On' },
                    { value: false, label: 'Off' },
                  ]}
                  ariaLabel="Charts, Graphs and Visual Elements"
                />
              </div>
            </div>

            {/* 3. Rich Formatting Dropdown */}
            <div className="space-y-2 pt-5 border-t border-black/[0.06]">
              <div>
                <h4 className="text-[13.5px] font-medium text-[#181615]">
                  Rich Formatting
                </h4>
                <p className="text-[12.5px] text-[#6B655B] mt-0.5 leading-relaxed">
                  Controls formatting density: flowing text versus structured headers, bullet points, callout badges, and tables.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <CustomDropdown<RichFormattingPreference>
                  value={preferences.richFormatting}
                  onChange={(val) => updatePreference('richFormatting', val)}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'slight', label: 'Slight' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'high', label: 'High' },
                  ]}
                  ariaLabel="Rich Formatting"
                />
              </div>
            </div>

            {/* 4. Emojis Dropdown */}
            <div className="space-y-2 pt-5 border-t border-black/[0.06]">
              <div>
                <h4 className="text-[13.5px] font-medium text-[#181615]">
                  Emojis
                </h4>
                <p className="text-[12.5px] text-[#6B655B] mt-0.5 leading-relaxed">
                  Controls the frequency of icons and emojis used to personalize tone and visual energy.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <CustomDropdown<EmojiPreference>
                  value={preferences.emojis}
                  onChange={(val) => updatePreference('emojis', val)}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'less', label: 'Less' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'high', label: 'High' },
                  ]}
                  ariaLabel="Emojis"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
