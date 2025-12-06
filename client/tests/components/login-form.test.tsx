import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock functions need to be defined this way to avoid hoisting issues
const mockSignInSocial = jest.fn();

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      social: (...args: unknown[]) => mockSignInSocial(...args),
    },
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

import { LoginForm } from '@/components/ui/login-form';

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInSocial.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('should render the BotByte CLI branding', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('BotByte CLI')).toBeInTheDocument();
      expect(screen.getByText('AI-powered command line magic')).toBeInTheDocument();
    });

    it('should render feature highlights', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText('Secure')).toBeInTheDocument();
    });

    it('should render welcome message', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to enable device flow authentication')).toBeInTheDocument();
    });

    it('should render GitHub login button', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    });

    it('should render OAuth 2.0 badge', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Secure OAuth 2.0')).toBeInTheDocument();
    });

    it('should render terms and privacy links', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Terms')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should render terminal preview', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('terminal')).toBeInTheDocument();
      expect(screen.getByText('botbyte')).toBeInTheDocument();
      expect(screen.getByText('--login')).toBeInTheDocument();
    });
  });

  describe('Login Functionality', () => {
    it('should call signIn.social when button is clicked', async () => {
      render(<LoginForm />);
      
      const button = screen.getByText('Continue with GitHub');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: 'github',
          callbackURL: 'http://localhost:3000',
        });
      });
    });

    it('should disable button while loading', async () => {
      mockSignInSocial.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<LoginForm />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should display error message on auth failure', async () => {
      mockSignInSocial.mockResolvedValue({
        error: { message: 'Authentication failed' },
      });
      
      render(<LoginForm />);
      
      const button = screen.getByText('Continue with GitHub');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });

    it('should display generic error message when no message provided', async () => {
      mockSignInSocial.mockResolvedValue({
        error: {},
      });
      
      render(<LoginForm />);
      
      const button = screen.getByText('Continue with GitHub');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to sign in with GitHub')).toBeInTheDocument();
      });
    });

    it('should handle thrown errors', async () => {
      mockSignInSocial.mockRejectedValue(new Error('Network error'));
      
      render(<LoginForm />);
      
      const button = screen.getByText('Continue with GitHub');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should clear previous error on new login attempt', async () => {
      mockSignInSocial
        .mockResolvedValueOnce({ error: { message: 'First error' } })
        .mockResolvedValueOnce({ error: null });
      
      render(<LoginForm />);
      
      const button = screen.getByRole('button');
      
      // First click - shows error
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second click - should start loading and clear error
      fireEvent.click(button);
      
      // Wait for the second call to complete (error should be cleared)
      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledTimes(2);
      });
      
      // Error should no longer be visible after successful second attempt
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });
});
