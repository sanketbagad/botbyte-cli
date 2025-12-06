import { render, screen } from '@testing-library/react';

// Mock better-auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: jest.fn(() => ({
      data: {
        session: { id: 'test-session' },
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
      },
      isPending: false,
    })),
    signOut: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

import Home from '@/app/page';

describe('Home Page', () => {
  it('should render the welcome message', () => {
    render(<Home />);
    
    expect(screen.getByText('BotByte CLI')).toBeInTheDocument();
  });

  it('should display user name when authenticated', () => {
    render(<Home />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show session active badge', () => {
    render(<Home />);
    
    expect(screen.getByText('Session Active')).toBeInTheDocument();
  });

  it('should render sign out button', () => {
    render(<Home />);
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});
