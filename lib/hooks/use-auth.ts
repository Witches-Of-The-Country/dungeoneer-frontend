"use client";

import { useEffect, useState, useCallback } from "react";
import { UserProfile, getStoredToken, getStoredUser, clearAuth } from "@/lib/api/auth";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncAuth = useCallback(() => {
    setUser(getStoredUser());
    setToken(getStoredToken());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    syncAuth();

    const handleAuthChange = () => syncAuth();
    window.addEventListener("auth-state-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-state-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [syncAuth]);

  const logout = useCallback(() => {
    clearAuth();
    syncAuth();
  }, [syncAuth]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    logout,
    syncAuth,
  };
}
