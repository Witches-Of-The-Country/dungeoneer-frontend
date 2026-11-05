import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '../components/navbar';
import * as useAuthModule from '../lib/hooks/use-auth';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('Navbar Brand Logo Navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('points logo to /characters when user is authenticated', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'adventurer@guild.com', nickname: 'Ranger', roles: ['PLAYER'] },
      isAuthenticated: true,
      isLoading: false,
      isDM: false,
      isPlayer: true,
      logout: vi.fn(),
      toggleDM: vi.fn(),
    });

    render(<Navbar />);

    const logoLink = screen.getByRole('link', { name: /dungeoneer/i });
    expect(logoLink).toHaveAttribute('href', '/characters');
  });

  it('points logo to / (home) when user is not authenticated', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isDM: false,
      isPlayer: false,
      logout: vi.fn(),
      toggleDM: vi.fn(),
    });

    render(<Navbar />);

    const logoLink = screen.getByRole('link', { name: /dungeoneer/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
