"use client";

import { useEffect, useState, useCallback } from "react";
import { UserProfile, getStoredToken, getStoredUser, clearAuth } from "@/lib/api/auth";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(false);

  const syncAuth = useCallback(() => {
    setUser(getStoredUser());
    setToken(getStoredToken());
    setIsLoading(false);
  }, []);

  useEffect(() => {
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
