import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  signOut as amplifySignOut,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  updatePassword as amplifyUpdatePassword,
  getCurrentUser,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { isCognitoConfigured } from '../utils/cognitoConfig';

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  name?: string;
  authProvider?: 'email' | 'google';
}

export type AuthModalMode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset-confirm';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; nextStep?: string; error?: string }>;
  register: (email: string, pass: string) => Promise<{ success: boolean; nextStep?: string; error?: string }>;
  confirmCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (email: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isCognitoLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'usher_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const [pendingEmail, setPendingEmail] = useState('');

  // Check initial user authentication session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      if (isCognitoConfigured) {
        try {
          const currentUser = await getCurrentUser();
          let email = currentUser.signInDetails?.loginId || '';
          let name = '';
          let authProvider: 'email' | 'google' = 'email';

          // Detect auth provider
          if (currentUser.username?.toLowerCase().startsWith('google_')) {
            authProvider = 'google';
          }

          try {
            const attrs = await fetchUserAttributes();
            if (attrs.email) email = attrs.email;
            if (attrs.name) name = attrs.name;
            if (attrs.given_name) name = `${attrs.given_name}${attrs.family_name ? ` ${attrs.family_name}` : ''}`;
            if (attrs.identities && attrs.identities.toLowerCase().includes('google')) {
              authProvider = 'google';
            }
          } catch {
            // Attribute fetch fallback
          }

          if (!email) {
            email = currentUser.username;
          }

          // Clean fallback name from email (e.g., testuser@example.com -> "Test User")
          if (!name && email) {
            const prefix = email.split('@')[0];
            name = prefix.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          }

          setUser({
            userId: currentUser.userId,
            username: currentUser.username,
            email,
            name: name || 'Student',
            authProvider,
          });
        } catch {
          // No active session
          setUser(null);
        }
      } else {
        // Fallback demo sandbox storage
        const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Sign In using SRP
  const login = async (email: string, pass: string) => {
    if (isCognitoConfigured) {
      try {
        const { isSignedIn, nextStep } = await amplifySignIn({
          username: email.trim(),
          password: pass,
        });

        if (isSignedIn) {
          const currentUser = await getCurrentUser();
          const cleanEmail = email.trim();
          const prefix = cleanEmail.split('@')[0];
          const derivedName = prefix.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

          setUser({
            userId: currentUser.userId,
            username: currentUser.username,
            email: cleanEmail,
            name: derivedName || 'Student',
            authProvider: 'email',
          });
          closeAuthModal();
          return { success: true };
        } else {
          return { success: false, nextStep: nextStep.signInStep };
        }
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.name === 'UserNotConfirmedException' || err.message.toLowerCase().includes('not confirmed'))
        ) {
          setPendingEmail(email.trim());
          return {
            success: false,
            nextStep: 'CONFIRM_SIGN_UP',
            error: 'Account not yet confirmed. Please enter the code sent to your email.',
          };
        }
        const error = err instanceof Error ? err.message : 'Invalid email or password';
        return { success: false, error };
      }
    } else {
      // Sandbox mode
      await new Promise((r) => setTimeout(r, 600));
      const mockUser: AuthUser = {
        userId: 'mock-user-123',
        username: email.split('@')[0],
        email: email.trim(),
      };
      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
      closeAuthModal();
      return { success: true };
    }
  };

  // Sign Up
  const register = async (email: string, pass: string) => {
    if (isCognitoConfigured) {
      try {
        const { nextStep } = await amplifySignUp({
          username: email.trim(),
          password: pass,
          options: {
            userAttributes: {
              email: email.trim(),
            },
          },
        });
        setPendingEmail(email.trim());
        return { success: true, nextStep: nextStep.signUpStep };
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Registration failed';
        return { success: false, error };
      }
    } else {
      // Sandbox mode: simulate sending code
      await new Promise((r) => setTimeout(r, 600));
      setPendingEmail(email.trim());
      return { success: true, nextStep: 'CONFIRM_SIGN_UP' };
    }
  };

  // Confirm Verification Code
  const confirmCode = async (email: string, code: string) => {
    if (isCognitoConfigured) {
      try {
        const { isSignUpComplete } = await amplifyConfirmSignUp({
          username: email.trim(),
          confirmationCode: code.trim(),
        });
        if (isSignUpComplete) {
          return { success: true };
        }
        return { success: false, error: 'Confirmation could not be completed' };
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Invalid verification code';
        return { success: false, error };
      }
    } else {
      // Sandbox mode: accept any 6-digit code or '123456'
      await new Promise((r) => setTimeout(r, 500));
      if (code.trim().length === 6) {
        return { success: true };
      }
      return { success: false, error: 'Please enter a 6-digit confirmation code' };
    }
  };

  // Resend Verification Code
  const resendCode = async (email: string) => {
    if (isCognitoConfigured) {
      try {
        await amplifyResendSignUpCode({ username: email.trim() });
        return { success: true };
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Could not resend code';
        return { success: false, error };
      }
    } else {
      return { success: true };
    }
  };

  // Request Password Reset
  const requestPasswordReset = async (email: string) => {
    if (isCognitoConfigured) {
      try {
        await amplifyResetPassword({ username: email.trim() });
        setPendingEmail(email.trim());
        return { success: true };
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Password reset request failed';
        return { success: false, error };
      }
    } else {
      await new Promise((r) => setTimeout(r, 500));
      setPendingEmail(email.trim());
      return { success: true };
    }
  };

  // Confirm Password Reset
  const confirmPasswordReset = async (email: string, code: string, newPass: string) => {
    if (isCognitoConfigured) {
      try {
        await amplifyConfirmResetPassword({
          username: email.trim(),
          confirmationCode: code.trim(),
          newPassword: newPass,
        });
        return { success: true };
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Could not reset password';
        return { success: false, error };
      }
    } else {
      await new Promise((r) => setTimeout(r, 500));
      return { success: true };
    }
  };

  // Change Password for authenticated user (Cognito SRP)
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (isCognitoConfigured) {
      try {
        await amplifyUpdatePassword({ oldPassword, newPassword });
        return { success: true };
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Password update failed. Please check your current password.';
        return { success: false, error };
      }
    } else {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true };
    }
  };

  // Sign Out
  const logout = async () => {
    if (isCognitoConfigured) {
      try {
        await amplifySignOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalMode,
        pendingEmail,
        setPendingEmail,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        confirmCode,
        resendCode,
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
        logout,
        isCognitoLive: isCognitoConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
