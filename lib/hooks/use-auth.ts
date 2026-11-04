"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { UserProfile, getStoredToken, getStoredUser, clearAuth, toggleDmRole } from "@/lib/api/auth";
import { apiFetch } from "@/lib/api/client";

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

  // Session guard: verify session integrity against backend on mount
  useEffect(() => {
    const currentToken = getStoredToken();
    if (!currentToken) return;

    let isMounted = true;
    setIsLoading(true);

    apiFetch<UserProfile>("/api/auth/me", {
      method: "GET",
      suppressErrorToast: true,
    })
      .then((freshUser) => {
        if (isMounted && freshUser) {
          setUser(freshUser);
        }
      })
      .catch((err: any) => {
        if (isMounted && (err?.status === 401 || err?.status === 404)) {
          clearAuth();
          syncAuth();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [syncAuth]);

  const logout = useCallback(() => {
    clearAuth();
    syncAuth();
  }, [syncAuth]);

  const toggleDM = useCallback(async () => {
    const response = await toggleDmRole();
    syncAuth();
    return response;
  }, [syncAuth]);

  const isDM = useMemo(() => {
    if (!token || !user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.includes("DUNGEON_MASTER");
  }, [token, user]);

  const isPlayer = useMemo(() => {
    if (!token || !user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.includes("PLAYER");
  }, [token, user]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    isDM,
    isPlayer,
    logout,
    toggleDM,
    syncAuth,
  };
}
