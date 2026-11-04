import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/use-auth';
import * as authApi from '@/lib/api/auth';

describe('useAuth role helpers (isDM, isPlayer)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('TP-01: should identify DUNGEON_MASTER role correctly with isDM=true, isPlayer=false', () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue('valid-token');
    vi.spyOn(authApi, 'getStoredUser').mockReturnValue({
      id: 'dm-1',
      email: 'dm@dungeoneer.local',
      nickname: 'MestreDosMagos',
      roles: ['DUNGEON_MASTER'],
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isDM).toBe(true);
    expect(result.current.isPlayer).toBe(false);
  });

  it('TP-02: should identify PLAYER role correctly with isDM=false, isPlayer=true', () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue('valid-token');
    vi.spyOn(authApi, 'getStoredUser').mockReturnValue({
      id: 'p-1',
      email: 'player@dungeoneer.local',
      nickname: 'Aragorn',
      roles: ['PLAYER'],
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isDM).toBe(false);
    expect(result.current.isPlayer).toBe(true);
  });

  it('TP-01b: should handle user possessing both PLAYER and DUNGEON_MASTER roles', () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue('valid-token');
    vi.spyOn(authApi, 'getStoredUser').mockReturnValue({
      id: 'dual-1',
      email: 'both@dungeoneer.local',
      nickname: 'Gildor',
      roles: ['PLAYER', 'DUNGEON_MASTER'],
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isDM).toBe(true);
    expect(result.current.isPlayer).toBe(true);
  });

  it('TE-01: should return isDM=false and isPlayer=false when unauthenticated or roles empty/null', () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue(null);
    vi.spyOn(authApi, 'getStoredUser').mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isDM).toBe(false);
    expect(result.current.isPlayer).toBe(false);
  });

  it('TE-01b: should return false when user exists but has empty roles array', () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue('valid-token');
    vi.spyOn(authApi, 'getStoredUser').mockReturnValue({
      id: 'no-roles-1',
      email: 'noroles@dungeoneer.local',
      nickname: 'Vagabond',
      roles: [],
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isDM).toBe(false);
    expect(result.current.isPlayer).toBe(false);
  });
});
