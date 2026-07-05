import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// localStorage键
const STORAGE_KEY = 'projectflow_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化：从localStorage读取用户
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 简单验证token是否存在
        if (parsed && parsed.token) {
          setUser(parsed);
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  // 登录
  const login = async (email, password) => {
    try {
      const API = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUser(data.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // 注册
  const register = async (name, email, password) => {
    try {
      const API = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUser(data.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Logged out');
  };

  // 获取auth header
  const authHeader = () => ({
    Authorization: `Bearer ${user?.token}`
  });

  // 带认证的fetch封装
  const authFetch = async (url, options = {}) => {
    const API = process.env.REACT_APP_API_URL || '';
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...options.headers
      }
    });
    return res.json();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      authHeader,
      authFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}