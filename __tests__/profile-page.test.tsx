import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '@/app/profile/page';

const mockUseAuth = vi.fn();
const mockToggleDM = vi.fn();

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProfilePage Component — Active Roles & DM Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isDM: false,
      toggleDM: mockToggleDM,
    });

    render(<ProfilePage />);
    expect(screen.getByText(/Carregando dados do perfil/i)).toBeInTheDocument();
  });

  it('renders restricted access when unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isDM: false,
      toggleDM: mockToggleDM,
    });

    render(<ProfilePage />);
    expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
  });

  it('renders user details, fixed PLAYER badge, and DM activation toggle when player is not DM', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        email: 'aragorn@gondor.com',
        nickname: 'Strider',
        birthdate: '1990-01-01',
        roles: ['PLAYER'],
      },
      isAuthenticated: true,
      isLoading: false,
      isDM: false,
      toggleDM: mockToggleDM,
    });

    render(<ProfilePage />);
    expect(screen.getByText('Strider')).toBeInTheDocument();
    expect(screen.getByText('aragorn@gondor.com')).toBeInTheDocument();
    expect(screen.getByText('01/01/1990')).toBeInTheDocument();
    expect(screen.getByTestId('role-badge-player')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-dm-role-button')).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: /Ativar Modo Mestre de Jogo/i })
    ).toBeInTheDocument();
  });

  it('triggers toggleDM when clicking the DM role toggle button', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        email: 'aragorn@gondor.com',
        nickname: 'Strider',
        birthdate: '1990-01-01',
        roles: ['PLAYER'],
      },
      isAuthenticated: true,
      isLoading: false,
      isDM: false,
      toggleDM: mockToggleDM,
    });
    mockToggleDM.mockResolvedValueOnce({
      accessToken: 'new.jwt.token',
      user: {
        id: '123',
        email: 'aragorn@gondor.com',
        nickname: 'Strider',
        roles: ['PLAYER', 'DUNGEON_MASTER'],
      },
    });

    render(<ProfilePage />);
    const toggleBtn = screen.getByTestId('toggle-dm-role-button');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockToggleDM).toHaveBeenCalledTimes(1);
    });
  });

  it('displays active DM role toggle and deactivation option when user is already DM', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        email: 'gandalf@middleearth.com',
        nickname: 'Mithrandir',
        birthdate: '1990-01-01',
        roles: ['PLAYER', 'DUNGEON_MASTER'],
      },
      isAuthenticated: true,
      isLoading: false,
      isDM: true,
      toggleDM: mockToggleDM,
    });

    render(<ProfilePage />);
    expect(screen.getByTestId('toggle-dm-role-button')).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /Desativar Modo Mestre/i })
    ).toBeInTheDocument();
  });
});
