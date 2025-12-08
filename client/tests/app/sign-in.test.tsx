import { render, screen } from '@testing-library/react';

const mockPush = jest.fn();
const mockUseSession = jest.fn();

// Mock better-auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// Mock LoginForm component
jest.mock('@/components/ui/login-form', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form Component</div>,
}));

import SignInPage from '@/app/(auth)/sign-in/page';

describe('Sign In Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when session is pending', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      });
      
      render(<SignInPage />);
      
      // Should not show login form while loading
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    it('should redirect to home when user is authenticated', () => {
      mockUseSession.mockReturnValue({
        data: {
          session: { id: 'test-session' },
          user: { id: 'test-user', name: 'Test User' },
        },
        isPending: false,
      });
      
      render(<SignInPage />);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should not render login form when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: {
          session: { id: 'test-session' },
          user: { id: 'test-user', name: 'Test User' },
        },
        isPending: false,
      });
      
      render(<SignInPage />);
      
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('should render login form when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });
      
      render(<SignInPage />);
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should not redirect when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });
      
      render(<SignInPage />);
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should render login form when session exists but user is null', () => {
      mockUseSession.mockReturnValue({
        data: {
          session: null,
          user: null,
        },
        isPending: false,
      });
      
      render(<SignInPage />);
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });
});
