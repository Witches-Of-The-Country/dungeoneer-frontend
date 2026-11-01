import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '@/app/profile/page';

const mockUseAuth = vi.fn();
const mockSelfPromoteToDm = vi.fn();

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/api/auth', () => ({
  selfPromoteToDm: () => mockSelfPromoteToDm(),
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

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isDM: false,
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
    });

    render(<ProfilePage />);
    expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
  });

  it('renders user details and promote button when player is not DM', () => {
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
    });

    render(<ProfilePage />);
    expect(screen.getByText('Strider')).toBeInTheDocument();
    expect(screen.getByText('aragorn@gondor.com')).toBeInTheDocument();
    expect(screen.getByText('01/01/1990')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tornar-se Mestre de Jogo/i })).toBeInTheDocument();
  });

  it('triggers selfPromoteToDm when clicking the promotion button', async () => {
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
    });
    mockSelfPromoteToDm.mockResolvedValueOnce({
      accessToken: 'new.jwt.token',
      user: {
        id: '123',
        email: 'aragorn@gondor.com',
        nickname: 'Strider',
        roles: ['PLAYER', 'DUNGEON_MASTER'],
      },
    });

    render(<ProfilePage />);
    const promoteButton = screen.getByRole('button', { name: /Tornar-se Mestre de Jogo/i });
    fireEvent.click(promoteButton);

    await waitFor(() => {
      expect(mockSelfPromoteToDm).toHaveBeenCalledTimes(1);
    });
  });

  it('does not display promote button when user is already DM', () => {
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
    });

    render(<ProfilePage />);
    expect(screen.queryByRole('button', { name: /Tornar-se Mestre de Jogo/i })).not.toBeInTheDocument();
  });
});
