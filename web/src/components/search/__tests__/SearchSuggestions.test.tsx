import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchSuggestions } from '../SearchSuggestions';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('SearchSuggestions', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockSuggestions = [
    {
      id: '1',
      query: 'test query 1',
      type: 'recent',
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      query: 'test query 2',
      type: 'popular',
      count: 10,
    },
    {
      id: '3',
      query: 'test query 3',
      type: 'related',
      score: 0.8,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('renders the suggestions list', () => {
    render(<SearchSuggestions />);
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Popular Searches')).toBeInTheDocument();
    expect(screen.getByText('Related Searches')).toBeInTheDocument();
  });

  it('loads suggestions on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSuggestions),
    });

    render(<SearchSuggestions />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/suggestions',
        expect.any(Object)
      );
    });

    // Check if suggestions are displayed
    expect(screen.getByText('test query 1')).toBeInTheDocument();
    expect(screen.getByText('test query 2')).toBeInTheDocument();
    expect(screen.getByText('test query 3')).toBeInTheDocument();
  });

  it('filters suggestions by type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSuggestions),
    });

    render(<SearchSuggestions />);

    // Switch to Popular Searches tab
    fireEvent.click(screen.getByText('Popular Searches'));

    await waitFor(() => {
      expect(screen.getByText('test query 2')).toBeInTheDocument();
      expect(screen.queryByText('test query 1')).not.toBeInTheDocument();
      expect(screen.queryByText('test query 3')).not.toBeInTheDocument();
    });
  });

  it('selects a suggestion', async () => {
    const mockOnSelect = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSuggestions),
    });

    render(<SearchSuggestions onSelect={mockOnSelect} />);

    // Wait for suggestions to load
    await waitFor(() => {
      expect(screen.getByText('test query 1')).toBeInTheDocument();
    });

    // Click on a suggestion
    fireEvent.click(screen.getByText('test query 1'));

    expect(mockOnSelect).toHaveBeenCalledWith('test query 1');
  });

  it('clears recent searches', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuggestions),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<SearchSuggestions />);

    // Wait for suggestions to load
    await waitFor(() => {
      expect(screen.getByText('test query 1')).toBeInTheDocument();
    });

    // Click clear button
    fireEvent.click(screen.getByRole('button', { name: /clear recent/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/suggestions/clear',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(screen.queryByText('test query 1')).not.toBeInTheDocument();
    });
  });

  it('handles loading error', async () => {
    const mockError = new Error('Failed to load suggestions');
    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchSuggestions />);

    await waitFor(() => {
      expect(screen.getByText('No suggestions available')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching suggestions', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<SearchSuggestions />);

    expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
  });

  it('does not load suggestions when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(<SearchSuggestions />);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
}); 