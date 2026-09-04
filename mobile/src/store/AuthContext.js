import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearTokens, getRefreshToken, saveTokens, setSessionExpiredHandler } from '../api/client';
import { getCurrentUser, loginWithGoogle, logoutRequest } from '../api/auth';
import { clearQueryCache } from '../api/queryClient';
import { userMessage } from '../utils/errors';

let GoogleSigninModule = null;
try {
  GoogleSigninModule = require('@react-native-google-signin/google-signin');
} catch {
  // GoogleSignin not available in current runtime
}
const GoogleSignin = GoogleSigninModule?.GoogleSignin;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const clearSession = useCallback(async () => {
    try {
      if (GoogleSignin) {
        await GoogleSignin.signOut();
      }
    } catch {
      // Ignore native sign out failure if not previously signed in
    }
    clearQueryCache();
    await clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) setUser(await getCurrentUser());
      } catch { await clearSession(); }
      finally { setIsRestoring(false); }
    })();
  }, [clearSession]);

  const signIn = useCallback(async (credential) => {
    try {
      const result = await loginWithGoogle(credential);
      if (!result?.accessToken || !result?.refreshToken) throw new Error('FinFlow did not return a valid session.');
      await saveTokens(result);
      setUser(result.user);
      return { success: true };
    } catch (error) { return { success: false, message: userMessage(error, error.message || 'Google sign-in could not be completed.') }; }
  }, []);

  const signOut = useCallback(async () => {
    try { const refreshToken = await getRefreshToken(); if (refreshToken) await logoutRequest(refreshToken); }
    catch { /* local logout must still succeed */ }
    finally { await clearSession(); }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const freshUser = await getCurrentUser();
    setUser(freshUser);
    return freshUser;
  }, []);

  return <AuthContext.Provider value={{ user, isRestoring, signIn, signOut, refreshUser, isAuthenticated: Boolean(user) }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
