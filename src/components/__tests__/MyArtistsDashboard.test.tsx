import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MyArtistsDashboard from '../MyArtistsDashboard';
import { AuthContext } from '@/context/AuthContext';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        in: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

vi.mock('@/services/spotify', () => ({
  searchArtists: vi.fn(() => Promise.resolve([
    {
      id: 'test-artist-1',
      name: 'Test Artist',
      image_url: 'https://example.com/artist.jpg',
      genres: ['pop', 'rock'],
    }
  ])),
  storeArtistInDatabase: vi.fn(() => Promise.resolve()),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Test data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockUserArtists = [
  {
    id: 'artist-1',
    name: 'Taylor Swift',
    image_url: 'https://example.com/taylor.jpg',
    genres: ['pop', 'country'],
    rank: 1,
    upcoming_shows_count: 3,
    total_shows_count: 15,
    vote_count: 8,
    popularity: 95,
  },
  {
    id: 'artist-2',
    name: 'Ed Sheeran',
    image_url: 'https://example.com/ed.jpg',
    genres: ['pop', 'folk'],
    rank: 2,
    upcoming_shows_count: 1,
    total_shows_count: 8,
    vote_count: 5,
    popularity: 88,
  },
];

const mockUpcomingShows = [
  {
    id: 'show-1',
    name: 'Eras Tour',
    date: '2025-06-15T19:00:00Z',
    venue: {
      name: 'Madison Square Garden',
      city: 'New York',
      state: 'NY',
    },
    artist: {
      name: 'Taylor Swift',
      image_url: 'https://example.com/taylor.jpg',
    },
  },
];

const mockRecentActivity = [
  {
    id: 'activity-1',
    type: 'vote' as const,
    artist_name: 'Taylor Swift',
    show_name: 'Eras Tour',
    created_at: '2025-05-26T10:00:00Z',
  },
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthContext.Provider value={{
          user: mockUser,
          login: vi.fn(),
          logout: vi.fn(),
          loading: false,
        }}>
          {children}
        </AuthContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MyArtistsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    expect(screen.getByText('My Artists')).toBeInTheDocument();
    expect(screen.getByText('Your followed artists and upcoming shows')).toBeInTheDocument();
    
    // Check for loading animation
    const loadingCards = screen.getAllByText('My Artists')[0].closest('div')?.querySelectorAll('.animate-pulse');
    expect(loadingCards?.length).toBeGreaterThan(0);
  });

  it('renders empty state when user has no artists', async () => {
    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Start Building Your Music Collection')).toBeInTheDocument();
    });

    expect(screen.getByText('Import your favorite artists from Spotify or browse our catalog to start following artists and voting on setlists')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import from Spotify/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Artists/i })).toBeInTheDocument();
  });

  it('toggles between grid and list view modes', async () => {
    // Mock successful API responses
    const mockSupabase = await import('@/integrations/supabase/client');
    vi.mocked(mockSupabase.supabase.from).mockImplementation((table) => {
      if (table === 'user_artists') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockUserArtists.map(artist => ({
                  rank: artist.rank,
                  artists: artist,
                })),
                error: null,
              })),
            })),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      } as any;
    });

    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
    });

    // Check grid view is default
    const gridButton = screen.getByRole('button', { name: /grid/i });
    const listButton = screen.getByRole('button', { name: /list/i });
    
    expect(gridButton).toHaveClass('bg-primary'); // Default active state
    
    // Switch to list view
    fireEvent.click(listButton);
    
    // Verify list view elements are present
    await waitFor(() => {
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Total Shows')).toBeInTheDocument();
      expect(screen.getByText('My Votes')).toBeInTheDocument();
    });
  });

  it('filters artists by genre', async () => {
    // Mock API response with artists
    const mockSupabase = await import('@/integrations/supabase/client');
    vi.mocked(mockSupabase.supabase.from).mockImplementation((table) => {
      if (table === 'user_artists') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockUserArtists.map(artist => ({
                  rank: artist.rank,
                  artists: artist,
                })),
                error: null,
              })),
            })),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      } as any;
    });

    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
      expect(screen.getByText('Ed Sheeran')).toBeInTheDocument();
    });

    // Find and use genre filter
    const genreSelect = screen.getByDisplayValue('All Genres');
    fireEvent.change(genreSelect, { target: { value: 'country' } });

    // Should only show Taylor Swift (who has country genre)
    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
      expect(screen.queryByText('Ed Sheeran')).not.toBeInTheDocument();
    });
  });

  it('displays correct stats in overview cards', async () => {
    // Mock API responses
    const mockSupabase = await import('@/integrations/supabase/client');
    vi.mocked(mockSupabase.supabase.from).mockImplementation((table) => {
      if (table === 'user_artists') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockUserArtists.map(artist => ({
                  rank: artist.rank,
                  artists: artist,
                })),
                error: null,
              })),
            })),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      } as any;
    });

    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('2')).toBeInTheDocument(); // Following count
    expect(screen.getByText('4')).toBeInTheDocument(); // Total upcoming shows (3+1)
    expect(screen.getByText('13')).toBeInTheDocument(); // Total votes (8+5)
    expect(screen.getByText('2')).toBeInTheDocument(); // Active artists (both have upcoming shows)
  });

  it('handles Spotify import functionality', async () => {
    const mockSpotify = await import('@/services/spotify');
    
    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    const importButton = screen.getByRole('button', { name: /Import from Spotify/i });
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockSpotify.searchArtists).toHaveBeenCalled();
      expect(mockSpotify.storeArtistInDatabase).toHaveBeenCalled();
    });
  });

  it('displays upcoming shows in the shows tab', async () => {
    // Mock API responses
    const mockSupabase = await import('@/integrations/supabase/client');
    vi.mocked(mockSupabase.supabase.from).mockImplementation((table) => {
      if (table === 'user_artists') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockUserArtists.map(artist => ({
                  rank: artist.rank,
                  artists: artist,
                })),
                error: null,
              })),
            })),
          })),
        } as any;
      }
      if (table === 'shows') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({
                    data: mockUpcomingShows,
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      } as any;
    });

    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
    });

    // Click on shows tab
    const showsTab = screen.getByRole('tab', { name: /Upcoming Shows/i });
    fireEvent.click(showsTab);

    await waitFor(() => {
      expect(screen.getByText('Eras Tour')).toBeInTheDocument();
      expect(screen.getByText('Madison Square Garden')).toBeInTheDocument();
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });
  });

  it('displays recent activity in the activity tab', async () => {
    // Mock API responses
    const mockSupabase = await import('@/integrations/supabase/client');
    vi.mocked(mockSupabase.supabase.from).mockImplementation((table) => {
      if (table === 'user_artists') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockUserArtists.map(artist => ({
                  rank: artist.rank,
                  artists: artist,
                })),
                error: null,
              })),
            })),
          })),
        } as any;
      }
      if (table === 'votes') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [{
                    id: 'vote-1',
                    created_at: '2025-05-26T10:00:00Z',
                    setlist_songs: {
                      setlists: {
                        shows: {
                          name: 'Eras Tour',
                          artist: { name: 'Taylor Swift' },
                        },
                      },
                    },
                  }],
                  error: null,
                })),
              })),
            })),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      } as any;
    });

    render(
      <TestWrapper>
        <MyArtistsDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
    });

    // Click on activity tab
    const activityTab = screen.getByRole('tab', { name: /Recent Activity/i });
    fireEvent.click(activityTab);

    await waitFor(() => {
      expect(screen.getByText(/You voted on/)).toBeInTheDocument();
      expect(screen.getByText('Eras Tour')).toBeInTheDocument();
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
    });
  });
});
