import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThreadSearch } from '../ThreadSearch';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('ThreadSearch', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockThreads = [
    {
      id: '1',
      title: 'Test Thread 1',
      description: 'Test thread description 1',
      lastActivity: '2024-01-01T00:00:00Z',
      participants: [
        {
          id: '1',
          name: 'John Doe',
          avatarUrl: 'https://example.com/avatar1.jpg',
        },
        {
          id: '2',
          name: 'Jane Smith',
          avatarUrl: 'https://example.com/avatar2.jpg',
        },
      ],
    },
    {
      id: '2',
      title: 'Test Thread 2',
      description: 'Test thread description 2',
      lastActivity: '2024-01-02T00:00:00Z',
      participants: [
        {
          id: '1',
          name: 'John Doe',
          avatarUrl: 'https://example.com/avatar1.jpg',
        },
      ],
    },
  ];

  const mockMessages = [
    {
      id: '1',
      content: 'Test message 1',
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: '1',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar1.jpg',
      },
    },
    {
      id: '2',
      content: 'Test message 2',
      createdAt: '2024-01-02T00:00:00Z',
      user: {
        id: '2',
        name: 'Jane Smith',
        avatarUrl: 'https://example.com/avatar2.jpg',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('renders the search input and filters', () => {
    render(<ThreadSearch />);
    expect(screen.getByPlaceholderText('Search threads...')).toBeInTheDocument();
    expect(screen.getByText('All Threads')).toBeInTheDocument();
    expect(screen.getByText('My Threads')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('performs search when input changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockThreads),
    });

    render(<ThreadSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads...'), {
      target: { value: 'test' },
    });

    // Wait for debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/threads?q=test',
        expect.any(Object)
      );
    });

    // Check if results are displayed
    expect(screen.getByText('Test Thread 1')).toBeInTheDocument();
    expect(screen.getByText('Test Thread 2')).toBeInTheDocument();
  });

  it('filters threads by type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockThreads),
    });

    render(<ThreadSearch />);

    // Switch to My Threads filter
    fireEvent.click(screen.getByText('My Threads'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/threads?filter=my',
        expect.any(Object)
      );
    });
  });

  it('loads thread messages when thread is selected', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockThreads),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

    render(<ThreadSearch />);

    // Select a thread
    fireEvent.click(screen.getByText('Test Thread 1'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/threads/1/messages',
        expect.any(Object)
      );
    });

    // Check if messages are displayed
    expect(screen.getByText('Test message 1')).toBeInTheDocument();
    expect(screen.getByText('Test message 2')).toBeInTheDocument();
  });

  it('creates a new thread', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '3', ...mockThreads[0] }),
    });

    render(<ThreadSearch />);

    // Click create thread button
    fireEvent.click(screen.getByRole('button', { name: /create thread/i }));

    // Fill in thread details
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New Thread' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New thread description' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/threads',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'New Thread',
            description: 'New thread description',
          }),
        })
      );
    });
  });

  it('handles search error', async () => {
    const mockError = new Error('Search failed');
    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<ThreadSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads...'), {
      target: { value: 'test' },
    });

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('No threads found')).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ThreadSearch />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search threads...'), {
      target: { value: 'test' },
    });

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });
}); 