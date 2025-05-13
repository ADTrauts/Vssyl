import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealTimeSearch } from '../RealTimeSearch';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('RealTimeSearch', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockThreads = [
    {
      id: '1',
      title: 'Test Thread',
      description: 'Test thread description',
      lastActivity: '2024-01-01T00:00:00Z',
    },
  ];

  const mockUsers = [
    {
      id: '2',
      name: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  ];

  const mockMessages = [
    {
      id: '3',
      content: 'Test message',
      thread: {
        title: 'Test Thread',
      },
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: '1',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('renders the search input', () => {
    render(<RealTimeSearch />);
    expect(screen.getByPlaceholderText('Search threads, users, or messages...')).toBeInTheDocument();
  });

  it('performs search when input changes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockThreads),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

    render(<RealTimeSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads, users, or messages...'), {
      target: { value: 'test' },
    });

    // Wait for debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/threads?q=test',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/users?q=test',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/messages?q=test',
        expect.any(Object)
      );
    });

    // Check if results are displayed
    expect(screen.getByText('Test Thread')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    render(<RealTimeSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads, users, or messages...'), {
      target: { value: 'test' },
    });

    // Click clear button
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByPlaceholderText('Search threads, users, or messages...')).toHaveValue('');
  });

  it('does not perform search when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(<RealTimeSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads, users, or messages...'), {
      target: { value: 'test' },
    });

    // Wait for debounce
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('handles search error', async () => {
    const mockError = new Error('Search failed');
    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<RealTimeSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads, users, or messages...'), {
      target: { value: 'test' },
    });

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<RealTimeSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads, users, or messages...'), {
      target: { value: 'test' },
    });

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });
}); 