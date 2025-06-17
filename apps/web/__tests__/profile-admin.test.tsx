import { render, screen } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import ProfilePage from '@/app/(main)/profile/page'

// Mock the useAuth hook
jest.mock('@/hooks/useAuth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock the supabase import
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => 
        Promise.resolve({ 
          data: { 
            session: { 
              access_token: 'mock-token' 
            } 
          } 
        })
      ),
    },
  },
}))

describe('ProfilePage Admin Features', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
  })

  it('shows admin controls for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'admin@test.com',
        created_at: '2024-01-01T00:00:00.000Z',
      } as any,
      loading: false,
      isAdmin: true,
      signOut: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      updateProfile: jest.fn(),
      resetPassword: jest.fn(),
      session: null,
    })

    render(<ProfilePage />)

    // Check if admin section is present
    expect(screen.getByText('Admin Controls')).toBeInTheDocument()
    
    // Check if sync buttons are present
    expect(screen.getByText('Sync Top Shows')).toBeInTheDocument()
    expect(screen.getByText('Sync Artists')).toBeInTheDocument()
    expect(screen.getByText('Sync Spotify')).toBeInTheDocument()
    expect(screen.getByText('Calculate Trending')).toBeInTheDocument()
    expect(screen.getByText('Refresh Trending Shows')).toBeInTheDocument()
    expect(screen.getByText('Sync Setlists')).toBeInTheDocument()
  })

  it('hides admin controls for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'user@test.com',
        created_at: '2024-01-01T00:00:00.000Z',
      } as any,
      loading: false,
      isAdmin: false,
      signOut: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      updateProfile: jest.fn(),
      resetPassword: jest.fn(),
      session: null,
    })

    render(<ProfilePage />)

    // Check if admin section is NOT present
    expect(screen.queryByText('Admin Controls')).not.toBeInTheDocument()
    expect(screen.queryByText('Sync Top Shows')).not.toBeInTheDocument()
  })

  it('shows user stats and profile information', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'user@test.com',
        created_at: '2024-01-01T00:00:00.000Z',
      } as any,
      loading: false,
      isAdmin: false,
      signOut: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      updateProfile: jest.fn(),
      resetPassword: jest.fn(),
      session: null,
    })

    render(<ProfilePage />)

    // Check if user email is displayed
    expect(screen.getByText('user@test.com')).toBeInTheDocument()
    
    // Check if stats sections are present
    expect(screen.getByText('Total Votes')).toBeInTheDocument()
    expect(screen.getByText('Shows Voted')).toBeInTheDocument()
    expect(screen.getByText('Artists Followed')).toBeInTheDocument()
    expect(screen.getByText('Account Status')).toBeInTheDocument()
  })
})