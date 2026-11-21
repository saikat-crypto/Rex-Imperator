import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Conversation } from '../../types';
import { Plus, MoreHorizontal, Pencil, Trash2, X, User, LogOut, Settings, ChevronUp } from 'lucide-react';
import { SidebarToggleIcon } from './SidebarToggleIcon';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  isSettingsView?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  isSettingsView = false,
}) => {
  console.log('Sidebar: conversations count =', conversations.length);
  const { user, openAuthModal, logout } = useAuth();
  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // User profile bottom-left menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Dialog modal states
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // Close user profile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isUserMenuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-sidebar-menu]')) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [activeMenuId]);

  // Autofocus rename input on modal open
  useEffect(() => {
    if (renameTarget) {
      setRenameInput(renameTarget.title || '');
      setTimeout(() => {
        if (renameInputRef.current) {
          renameInputRef.current.focus();
          renameInputRef.current.select();
        }
      }, 50);
    }
  }, [renameTarget]);

  // Handle escape key for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (renameTarget) setRenameTarget(null);
        if (deleteTarget) setDeleteTarget(null);
        if (activeMenuId) setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [renameTarget, deleteTarget, activeMenuId]);

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renameTarget) return;
    const trimmed = renameInput.trim();
    if (trimmed) {
      onRenameConversation(renameTarget.id, trimmed);
    }
    setRenameTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteConversation(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 32,
            }}
            className="relative h-full bg-[#F2F6FA]/95 border-r border-black/[0.06] flex flex-col z-40 select-none overflow-hidden shrink-0"
          >
            {/* Header with Mascot Logo */}
            <div className="h-14 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <img
                  src="/logo-transparent.png"
                  alt="Usher"
                  className="w-[88px] h-[88px] object-contain drop-shadow-xs"
                />
                <span className="font-serif font-bold text-[#181615] text-xl tracking-tight leading-none pt-0.5 ml-[-45px]">
                  Usher
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onNewChat}
                  className="p-1.5 rounded-lg text-[#555047] hover:text-[var(--accent-primary)] hover:bg-black/[0.04] transition-colors"
                  title="New conversation (Ctrl+N)"
                >
                  <Plus className="w-4 h-4 stroke-[2]" />
                </button>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg text-[#555047] hover:text-[var(--accent-primary)] hover:bg-black/[0.04] transition-colors"
                  title="Collapse sidebar (Ctrl+B)"
                >
                  <SidebarToggleIcon isOpen={true} className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="px-3 py-6 text-xs text-[#8A847A] italic">
                  No conversations
                </div>
              ) : (
                conversations.map((chat) => {
                  const isActive = chat.id === activeId;
                  const isMenuOpen = activeMenuId === chat.id;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => onSelectConversation(chat.id)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#181615] font-medium shadow-xs border border-black/[0.04]'
                          : 'text-[#58534A] hover:bg-white/60 hover:text-[#181615]'
                      }`}
                    >
                      <span className="truncate pr-2 select-none" title={chat.title}>
                        {chat.title || 'Untitled'}
                      </span>

                      {/* Three-dots action button on hover or when menu is open */}
                      <div className="relative shrink-0" data-sidebar-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : chat.id);
                          }}
                          className={`p-1 rounded-md transition-all ${
                            isMenuOpen
                              ? 'opacity-100 bg-black/10 text-[#111113]'
                              : 'opacity-0 group-hover:opacity-100 text-[#7A7469] hover:text-[#111113] hover:bg-black/5'
                          }`}
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.94, y: -2 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.94, y: -2 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-full mt-1 w-28 bg-[#FAF8F5] border border-black/10 rounded-xl shadow-soft-lg py-1 z-50 overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  setRenameTarget(chat);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12.5px] font-medium text-[#2E2A25] hover:bg-black/[0.04] transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#6B655A]" />
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  setDeleteTarget(chat);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-[12.5px] font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* User Profile / Auth Footer */}
            <div className="p-3 border-t border-black/[0.06] shrink-0 relative" ref={userMenuRef}>
              {user ? (
                <>
                  {/* Upward Popover Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute bottom-full left-3 right-3 mb-2 bg-[#FAF8F5]/98 backdrop-blur-md border border-black/10 rounded-2xl p-1.5 shadow-soft-xl z-50 overflow-hidden"
                      >
                        {/* User Identity Header */}
                        <div className="px-3 py-2 border-b border-black/[0.06] mb-1">
                          <p className="text-[13px] font-semibold text-[#181615] truncate">
                            {user.name || user.email.split('@')[0]}
                          </p>
                          <p className="text-[11px] text-[#7A7469] truncate" title={user.email}>
                            {user.email}
                          </p>
                        </div>

                        {/* Settings Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenSettings();
                          }}
                          className={`w-full px-3 py-2 flex items-center gap-2.5 rounded-xl text-left text-[13px] font-medium transition-colors cursor-pointer group ${
                            isSettingsView
                              ? 'bg-[#181615] text-[#FCD702]'
                              : 'text-[#181615] hover:bg-black/[0.05]'
                          }`}
                        >
                          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-200" />
                          <span>Settings</span>
                        </button>

                        {/* Sign Out Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2.5 rounded-xl text-left text-[13px] font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Sign out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Profile Card Trigger */}
                  <div
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer shadow-soft-xs ${
                      isSettingsView
                        ? 'bg-white border-[#FCD702] ring-1 ring-[#FCD702]/50 shadow-soft-sm'
                        : isUserMenuOpen
                        ? 'bg-white border-black/15 shadow-soft-sm'
                        : 'bg-white/70 hover:bg-white border-black/[0.04] hover:border-black/10'
                    }`}
                    title="Click to open settings & profile"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#181615] text-[#FCD702] flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs group-hover:scale-105 transition-transform">
                        {user.email.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#181615] truncate">
                          {user.name || user.email.split('@')[0]}
                        </p>
                        <p className="text-[10.5px] text-[#8C8578] leading-tight truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <ChevronUp
                      className={`w-4 h-4 text-[#7A7469] transition-transform duration-200 shrink-0 ${
                        isUserMenuOpen ? 'rotate-180' : 'group-hover:-translate-y-0.5'
                      }`}
                    />
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-white/95 text-[#181615] text-[13px] font-medium border border-black/[0.08] shadow-soft-xs hover:border-black/20 transition-all cursor-pointer active:scale-98"
                >
                  <User className="w-4 h-4 text-[#6E685E]" />
                  <span>Sign in to Usher</span>
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Custom Rename Dialog Modal */}
      <AnimatePresence>
        {renameTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm bg-[#FAF8F5] border border-black/10 rounded-2xl p-6 shadow-soft-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-bold text-[#181615] text-[18px] tracking-tight">
                  Rename chat
                </h3>
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="p-1.5 rounded-lg text-[#888176] hover:text-[#181615] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[13px] text-[#6E675D] mb-4">
                Enter a new title for this conversation.
              </p>

              <form onSubmit={handleSaveRename}>
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="Chat title..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-black/15 text-[13.5px] text-[#181615] placeholder:text-[#9A9388] focus:outline-none focus:ring-1.5 focus:ring-[#181615] transition-all mb-5 shadow-xs"
                />

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRenameTarget(null)}
                    className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#5A544A] hover:bg-black/5 hover:text-[#181615] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!renameInput.trim()}
                    className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all shadow-xs ${
                      renameInput.trim()
                        ? 'bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] cursor-pointer active:scale-97'
                        : 'bg-black/10 text-black/30 cursor-not-allowed'
                    }`}
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Dialog Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm bg-[#FAF8F5] border border-black/10 rounded-2xl p-6 shadow-soft-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-bold text-[#181615] text-[18px] tracking-tight">
                  Delete chat?
                </h3>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="p-1.5 rounded-lg text-[#888176] hover:text-[#181615] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[13px] text-[#6E675D] leading-relaxed mb-5">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-[#181615]">
                  "{deleteTarget.title || 'Untitled'}"
                </span>
                ? This conversation will be permanently removed.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#5A544A] hover:bg-black/5 hover:text-[#181615] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#D93025] hover:bg-[#C2291F] transition-all shadow-xs active:scale-97 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
