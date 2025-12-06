import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = jest.fn();
const mockUseSession = jest.fn();
const mockSignOut = jest.fn();

// Mock better-auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
  }),
}));

import Home from '@/app/page';

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when session is pending', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      });
      
      render(<Home />);
      
      // Should show BotByte branding in loading state
      expect(screen.queryByText('Welcome back, commander')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to sign-in when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: {
          session: null,
          user: null,
        },
        isPending: false,
      });
      
      render(<Home />);
      
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });

    it('should redirect when data is null', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });
      
      render(<Home />);
      
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });
  });

  describe('Authenticated User', () => {
    const mockAuthenticatedSession = {
      data: {
        session: { id: 'test-session-id' },
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
      },
      isPending: false,
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue(mockAuthenticatedSession);
    });

    it('should render BotByte CLI branding', () => {
      render(<Home />);
      
      expect(screen.getByText('BotByte CLI')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, commander')).toBeInTheDocument();
    });

    it('should show session active badge', () => {
      render(<Home />);
      
      expect(screen.getByText('Session Active')).toBeInTheDocument();
    });

    it('should display user name', () => {
      render(<Home />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display user email', () => {
      render(<Home />);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should display user ID', () => {
      render(<Home />);
      
      expect(screen.getByText('test-user-id')).toBeInTheDocument();
    });

    it('should render sign out button', () => {
      render(<Home />);
      
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should render terminal preview with whoami command', () => {
      render(<Home />);
      
      expect(screen.getByText('whoami')).toBeInTheDocument();
    });

    it('should show authenticated user in terminal', () => {
      render(<Home />);
      
      expect(screen.getByText(/Authenticated as Test User/)).toBeInTheDocument();
    });

    it('should render user avatar', () => {
      render(<Home />);
      
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should call signOut when sign out button is clicked', () => {
      render(<Home />);
      
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should display "Authenticated Developer" label', () => {
      render(<Home />);
      
      expect(screen.getByText('Authenticated Developer')).toBeInTheDocument();
    });

    it('should show keyboard shortcut hint', () => {
      render(<Home />);
      
      expect(screen.getByText('Open command palette')).toBeInTheDocument();
    });
  });

  describe('User with missing optional fields', () => {
    it('should fallback to "User" when name is null', () => {
      mockUseSession.mockReturnValue({
        data: {
          session: { id: 'test-session' },
          user: {
            id: 'test-id',
            name: null,
            email: 'test@example.com',
            image: null,
          },
        },
        isPending: false,
      });
      
      render(<Home />);
      
      // The component uses || "User" fallback
      expect(screen.getAllByText('User').length).toBeGreaterThan(0);
    });
  });
});
