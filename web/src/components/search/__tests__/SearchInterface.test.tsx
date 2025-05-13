import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchInterface } from '../SearchInterface';
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

describe('SearchInterface', () => {
  const mockSearchId = 'test-search-id';
  const mockResults = [
    {
      id: '1',
      title: 'Test Document',
      content: 'Test content',
      type: 'document',
      score: 0.9,
      metadata: {
        author: 'John Doe',
        date: '2024-01-01',
        category: 'Test',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the search interface', () => {
    render(<SearchInterface searchId={mockSearchId} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('performs a search', async () => {
    const mockQuery = 'test query';
    const mockFilters = { type: 'document' };
    const mockSort = { field: 'score', order: 'desc' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    render(<SearchInterface searchId={mockSearchId} />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: mockQuery },
    });

    // Apply filters
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: mockFilters.type },
    });

    // Apply sort
    fireEvent.click(screen.getByText('Sort'));
    fireEvent.change(screen.getByLabelText('Sort By'), {
      target: { value: mockSort.field },
    });
    fireEvent.change(screen.getByLabelText('Order'), {
      target: { value: mockSort.order },
    });

    // Submit search
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: mockQuery,
            filters: mockFilters,
            sort: mockSort,
          }),
        })
      );
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });

  it('opens customization modal', () => {
    render(<SearchInterface searchId={mockSearchId} />);

    // Click customize button
    fireEvent.click(screen.getByText('Customize'));

    expect(screen.getByText('Search Customization')).toBeInTheDocument();
  });

  it('opens integration modal', () => {
    render(<SearchInterface searchId={mockSearchId} />);

    // Click integrations button
    fireEvent.click(screen.getByText('Integrations'));

    expect(screen.getByText('Search Integrations')).toBeInTheDocument();
  });

  it('handles search error', async () => {
    const mockError = new Error('Search failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchInterface searchId={mockSearchId} />);

    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'test query' },
    });

    // Submit search
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to perform search');
    });
  });

  it('handles empty search query', async () => {
    render(<SearchInterface searchId={mockSearchId} />);

    // Submit search without query
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a search query');
    });
  });

  it('handles keyboard shortcuts', async () => {
    render(<SearchInterface searchId={mockSearchId} />);

    // Focus search input
    fireEvent.focus(screen.getByPlaceholderText('Search...'));

    // Press Enter key
    fireEvent.keyDown(screen.getByPlaceholderText('Search...'), {
      key: 'Enter',
      code: 'Enter',
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a search query');
    });
  });

  it('handles filter changes', async () => {
    render(<SearchInterface searchId={mockSearchId} />);

    // Open filters
    fireEvent.click(screen.getByText('Filters'));

    // Change filter value
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: 'document' },
    });

    await waitFor(() => {
      expect(screen.getByText('Document')).toBeInTheDocument();
    });
  });

  it('handles sort changes', async () => {
    render(<SearchInterface searchId={mockSearchId} />);

    // Open sort
    fireEvent.click(screen.getByText('Sort'));

    // Change sort field
    fireEvent.change(screen.getByLabelText('Sort By'), {
      target: { value: 'date' },
    });

    // Change sort order
    fireEvent.change(screen.getByLabelText('Order'), {
      target: { value: 'asc' },
    });

    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Ascending')).toBeInTheDocument();
    });
  });

  it('handles customization update', async () => {
    const mockSettings = {
      layout: {
        sidebarPosition: 'right',
        resultsPerPage: 20,
      },
      appearance: {
        theme: 'dark',
        fontSize: 'medium',
      },
      search: {
        defaultOperator: 'AND',
        fuzzySearch: true,
      },
      personalization: {
        language: 'en',
        timezone: 'UTC',
      },
    };

    render(<SearchInterface searchId={mockSearchId} />);

    // Open customization modal
    fireEvent.click(screen.getByText('Customize'));

    // Update settings
    fireEvent.change(screen.getByLabelText('Sidebar Position'), {
      target: { value: mockSettings.layout.sidebarPosition },
    });

    await waitFor(() => {
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
  });
}); 