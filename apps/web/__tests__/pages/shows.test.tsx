import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import Shows from '../../src/pages/Shows';
import { GET_SHOWS_QUERY } from '../../src/graphql/queries/shows';
import { AuthProvider } from '../../src/contexts/AuthContext';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockShows = [
  {
    id: '1',
    artist: { id: '1', name: 'The Beatles', imageUrl: null },
    venue: { id: '1', name: 'Madison Square Garden', city: 'New York' },
    date: '2024-06-15',
    setlist: [
      { id: '1', songId: '1', position: 1, voteCount: 10, song: { id: '1', title: 'Hey Jude' } },
      { id: '2', songId: '2', position: 2, voteCount: 5, song: { id: '2', title: 'Let It Be' } },
    ],
  },
];

const mocks = [
  {
    request: {
      query: GET_SHOWS_QUERY,
      variables: { limit: 20, offset: 0 },
    },
    result: {
      data: {
        shows: mockShows,
        showsCount: 1,
      },
    },
  },
];

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>
          <MemoryRouter>
            {children}
          </MemoryRouter>
        </AuthProvider>
      </MockedProvider>
    </QueryClientProvider>
  );
};

describe('Shows Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<Shows />, { wrapper: AllTheProviders });
    expect(screen.getByTestId('shows-loading')).toBeInTheDocument();
  });

  it('should render shows list after loading', async () => {
    render(<Shows />, { wrapper: AllTheProviders });
    
    await waitFor(() => {
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
      expect(screen.getByText('Madison Square Garden')).toBeInTheDocument();
    });
  });

  it('should display show setlist', async () => {
    render(<Shows />, { wrapper: AllTheProviders });
    
    await waitFor(() => {
      expect(screen.getByText('Hey Jude')).toBeInTheDocument();
      expect(screen.getByText('Let It Be')).toBeInTheDocument();
      expect(screen.getByText('10 votes')).toBeInTheDocument();
      expect(screen.getByText('5 votes')).toBeInTheDocument();
    });
  });

  it('should handle empty shows list', async () => {
    const emptyMocks = [{
      request: {
        query: GET_SHOWS_QUERY,
        variables: { limit: 20, offset: 0 },
      },
      result: {
        data: {
          shows: [],
          showsCount: 0,
        },
      },
    }];

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MockedProvider mocks={emptyMocks} addTypename={false}>
          <AuthProvider>
            <MemoryRouter>
              <Shows />
            </MemoryRouter>
          </AuthProvider>
        </MockedProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No shows found')).toBeInTheDocument();
    });
  });

  it('should handle query errors', async () => {
    const errorMocks = [{
      request: {
        query: GET_SHOWS_QUERY,
        variables: { limit: 20, offset: 0 },
      },
      error: new Error('Failed to fetch shows'),
    }];

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>
            <MemoryRouter>
              <Shows />
            </MemoryRouter>
          </AuthProvider>
        </MockedProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load shows/i)).toBeInTheDocument();
    });
  });
});