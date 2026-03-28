import { createContext, useCallback, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          // Interceptor will try to refresh or redirect if both fail
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Login with a Google Identity Services ID token
  const login = useCallback(async (credential) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/google', {
        credential,
      });

      if (res.data.success) {
        const { accessToken, refreshToken, user: userData } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      console.error('Login failed:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Authentication failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await API.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  // Fetch updated user data (e.g., to sync overallSavings)
  const refreshUser = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
