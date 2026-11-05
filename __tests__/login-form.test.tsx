import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../components/login-form';
import * as authApi from '../lib/api/auth';
import * as useAuthModule from '../lib/hooks/use-auth';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockRedirectParam: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'redirect' ? mockRedirectParam : null),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginForm Component & Redirect Loop Prevention', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRedirectParam = null;
  });

  it('renders login form with email and password fields', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isDM: false,
      isPlayer: false,
      logout: vi.fn(),
      toggleDM: vi.fn(),
      syncAuth: vi.fn(),
    });

    const { container } = render(<LoginForm />);

    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desvendar os mistérios/i })).toBeInTheDocument();
  });

  it('clears stale session once when redirected by middleware with ?redirect=/characters', () => {
    const mockLogout = vi.fn();
    mockRedirectParam = '/characters';

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'stale-1', email: 'stale@example.com', nickname: 'Stale' },
      token: 'stale-jwt',
      isAuthenticated: true,
      isLoading: false,
      isDM: false,
      isPlayer: true,
      logout: mockLogout,
      toggleDM: vi.fn(),
      syncAuth: vi.fn(),
    });

    render(<LoginForm />);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('successfully logs in and navigates to safeTarget without triggering logout when redirectParam is present', async () => {
    const mockLogout = vi.fn();
    mockRedirectParam = '/characters/char-123';

    let currentAuth = false;
    vi.spyOn(useAuthModule, 'useAuth').mockImplementation(() => ({
      user: currentAuth ? { id: 'new-1', email: 'adventurer@guild.com', nickname: 'Hero' } : null,
      token: currentAuth ? 'new-token' : null,
      isAuthenticated: currentAuth,
      isLoading: false,
      isDM: false,
      isPlayer: true,
      logout: mockLogout,
      toggleDM: vi.fn(),
      syncAuth: vi.fn(),
    }));

    const loginSpy = vi.spyOn(authApi, 'login').mockImplementation(async () => {
      currentAuth = true;
      return {
        accessToken: 'new-token',
        user: { id: 'new-1', email: 'adventurer@guild.com', nickname: 'Hero', roles: ['PLAYER'] },
      };
    });

    const { container, rerender } = render(<LoginForm />);

    const emailInput = container.querySelector('input[name="email"]')!;
    const passwordInput = container.querySelector('input[name="password"]')!;
    const submitBtn = screen.getByRole('button', { name: /desvendar os mistérios/i });

    fireEvent.change(emailInput, {
      target: { value: 'adventurer@guild.com' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'SecretPassword123!' },
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'adventurer@guild.com',
        password: 'SecretPassword123!',
      });
    });

    rerender(<LoginForm />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/characters/char-123');
    });

    // Verify logout was NOT called after successful authentication
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
