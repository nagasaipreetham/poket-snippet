import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import useChatStore from '../store/chatStore';
import useCompilerStore from '../store/compilerStore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.accessToken) {
          setUser(parsedUser);
        } else {
          // Invalid user data
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (e) {
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem('user');

    // Reset Persistent Stores
    useChatStore.getState().reset();
    useCompilerStore.getState().reset();

    // Double ensure storage is cleared
    sessionStorage.removeItem('chat-storage');
    sessionStorage.removeItem('compiler-storage');
  };



  const updateProfile = async (updates) => {
    try {
      if (!user?._id) throw new Error("No user logged in");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, ...updates })
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedUser = await response.json();

      // Preserve access token if it exists in current user object but not returned by backend
      const finalUser = { ...updatedUser, accessToken: user.accessToken };

      setUser(finalUser);
      localStorage.setItem('user', JSON.stringify(finalUser));
      return finalUser;
    } catch (error) {
      console.error("Update Profile Error:", error);
      throw error;
    }
  };

  const deleteWorkspace = async () => {
    try {
      if (!user?._id) throw new Error("No user logged in");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/workspace/${user._id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete workspace');
      return true;
    } catch (error) {
      console.error("Delete Workspace Error:", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user?._id) throw new Error("No user logged in");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/account/${user._id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete account');
      logout();
      return true;
    } catch (error) {
      console.error("Delete Account Error:", error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    updateProfile,
    deleteWorkspace,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
