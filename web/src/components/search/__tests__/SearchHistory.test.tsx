import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchHistory } from '../SearchHistory';
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

describe('SearchHistory', () => {
  const mockSearchId = 'test-search-id';
  const mockHistory = [
    {
      id: '1',
      query: 'test query',
      filters: { type: 'document' },
      timestamp: '2024-01-01T00:00:00Z',
      results: 10,
    },
    {
      id: '2',
      query: 'another query',
      filters: { type: 'image' },
      timestamp: '2024-01-02T00:00:00Z',
      results: 5,
    },
  ];
  const mockSavedSearches = [
    {
      id: '1',
      name: 'Test Search',
      description: 'A test saved search',
      query: 'test query',
      filters: { type: 'document' },
      createdAt: '2024-01-01T00:00:00Z',
      lastUsed: '2024-01-02T00:00:00Z',
    },
    {
      id: '2',
      name: 'Another Search',
      description: 'Another test saved search',
      query: 'another query',
      filters: { type: 'image' },
      createdAt: '2024-01-03T00:00:00Z',
      lastUsed: '2024-01-04T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the history component', () => {
    render(<SearchHistory searchId={mockSearchId} />);
    expect(screen.getByText('Search History')).toBeInTheDocument();
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Saved Searches')).toBeInTheDocument();
  });

  it('loads search history on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });

    render(<SearchHistory searchId={mockSearchId} />);

    await waitFor(() => {
      expect(screen.getByText('test query')).toBeInTheDocument();
      expect(screen.getByText('another query')).toBeInTheDocument();
    });
  });

  it('loads saved searches on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSavedSearches),
    });

    render(<SearchHistory searchId={mockSearchId} />);

    // Switch to Saved Searches tab
    fireEvent.click(screen.getByText('Saved Searches'));

    await waitFor(() => {
      expect(screen.getByText('Test Search')).toBeInTheDocument();
      expect(screen.getByText('Another Search')).toBeInTheDocument();
    });
  });

  it('clears search history', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchHistory searchId={mockSearchId} />);

    // Click clear button
    fireEvent.click(screen.getByText('Clear History'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/history/clear`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Search history cleared');
    });
  });

  it('saves a search', async () => {
    const mockNewSearch = {
      name: 'New Search',
      description: 'A new saved search',
      query: 'new query',
      filters: { type: 'document' },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSavedSearches),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchHistory searchId={mockSearchId} />);

    // Switch to Saved Searches tab
    fireEvent.click(screen.getByText('Saved Searches'));

    // Click save button
    fireEvent.click(screen.getByText('Save Search'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: mockNewSearch.name },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: mockNewSearch.description },
    });
    fireEvent.change(screen.getByLabelText('Query'), {
      target: { value: mockNewSearch.query },
    });
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: mockNewSearch.filters.type },
    });

    // Submit form
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/saved`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockNewSearch),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Search saved successfully');
    });
  });

  it('updates a saved search', async () => {
    const mockUpdatedSearch = {
      name: 'Updated Search',
      description: 'An updated saved search',
      query: 'updated query',
      filters: { type: 'image' },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSavedSearches),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchHistory searchId={mockSearchId} />);

    // Switch to Saved Searches tab
    fireEvent.click(screen.getByText('Saved Searches'));

    // Click edit button
    fireEvent.click(screen.getByText('Edit'));

    // Update form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: mockUpdatedSearch.name },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: mockUpdatedSearch.description },
    });
    fireEvent.change(screen.getByLabelText('Query'), {
      target: { value: mockUpdatedSearch.query },
    });
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: mockUpdatedSearch.filters.type },
    });

    // Submit form
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/saved/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockUpdatedSearch),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Search updated successfully');
    });
  });

  it('deletes a saved search', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSavedSearches),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchHistory searchId={mockSearchId} />);

    // Switch to Saved Searches tab
    fireEvent.click(screen.getByText('Saved Searches'));

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/saved/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Search deleted successfully');
    });
  });

  it('loads a saved search', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSavedSearches),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchHistory searchId={mockSearchId} />);

    // Switch to Saved Searches tab
    fireEvent.click(screen.getByText('Saved Searches'));

    // Click load button
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/saved/1/load`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Search loaded successfully');
    });
  });

  it('handles history loading error', async () => {
    const mockError = new Error('History failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchHistory searchId={mockSearchId} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load search history');
    });
  });

  it('handles saved searches loading error', async () => {
    const mockError = new Error('Saved searches failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchHistory searchId={mockSearchId} />);

    // Switch to Saved Searches tab
    fireEvent.click(screen.getByText('Saved Searches'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load saved searches');
    });
  });
}); 