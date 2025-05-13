import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchResult } from '../SearchResult';
import { toast } from 'sonner';

// Mock the toast module
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('SearchResult', () => {
  const mockResult = {
    id: '1',
    type: 'thread',
    title: 'Test Thread',
    content: 'This is a test thread content',
    metadata: {
      author: 'John Doe',
      date: '2024-01-01T00:00:00Z',
      size: 1024,
      tags: ['test', 'thread'],
      preview: 'This is a preview of the content',
    },
    relevance: 0.9,
  };

  const mockQuery = 'test';
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the search result', () => {
    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Thread')).toBeInTheDocument();
    expect(screen.getByText('This is a test thread content')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('thread')).toBeInTheDocument();
    expect(screen.getByText('90% match')).toBeInTheDocument();
  });

  it('highlights query text', () => {
    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    const highlightedText = screen.getByText('test');
    expect(highlightedText).toHaveClass('bg-yellow-200');
  });

  it('shows preview when toggled', () => {
    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    // Click show preview button
    fireEvent.click(screen.getByText('Show Preview'));

    expect(screen.getByText('This is a preview of the content')).toBeInTheDocument();
  });

  it('handles view action', async () => {
    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    // Click more options button
    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    // Click view option
    fireEvent.click(screen.getByText('View'));

    expect(mockOnSelect).toHaveBeenCalledWith(mockResult);
  });

  it('handles download action', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    // Click more options button
    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    // Click download option
    fireEvent.click(screen.getByText('Download'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/download/${mockResult.id}`,
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith('Download started');
    });
  });

  it('handles share action', async () => {
    const mockShareLink = 'https://example.com/share/test';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockShareLink),
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    // Click more options button
    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    // Click share option
    fireEvent.click(screen.getByText('Share'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/share',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: mockResult.id }),
        })
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareLink);
      expect(toast.success).toHaveBeenCalledWith('Share link copied to clipboard');
    });
  });

  it('handles favorite action', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    // Click more options button
    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    // Click favorite option
    fireEvent.click(screen.getByText('Add to Favorites'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/favorite/${mockResult.id}`,
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith('Added to favorites');
    });
  });

  it('handles action errors', async () => {
    const mockError = new Error('Action failed');
    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchResult
        result={mockResult}
        query={mockQuery}
        onSelect={mockOnSelect}
      />
    );

    // Click more options button
    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    // Click download option
    fireEvent.click(screen.getByText('Download'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to perform action');
    });
  });
}); 