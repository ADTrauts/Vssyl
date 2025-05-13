import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchCustomization } from '../SearchCustomization';
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

describe('SearchCustomization', () => {
  const mockSearchId = 'test-search-id';
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

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the customization component', () => {
    render(<SearchCustomization searchId={mockSearchId} />);
    expect(screen.getByText('Search Customization')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Personalization')).toBeInTheDocument();
  });

  it('loads settings on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSettings),
    });

    render(<SearchCustomization searchId={mockSearchId} />);

    await waitFor(() => {
      expect(screen.getByText('Right')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('AND')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('updates layout settings', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCustomization searchId={mockSearchId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Right')).toBeInTheDocument();
    });

    // Change sidebar position
    fireEvent.change(screen.getByLabelText('Sidebar Position'), {
      target: { value: 'left' },
    });

    // Change results per page
    fireEvent.change(screen.getByLabelText('Results Per Page'), {
      target: { value: '30' },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/settings/layout`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            sidebarPosition: 'left',
            resultsPerPage: 30,
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Layout settings updated');
    });
  });

  it('updates appearance settings', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCustomization searchId={mockSearchId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Change theme
    fireEvent.change(screen.getByLabelText('Theme'), {
      target: { value: 'light' },
    });

    // Change font size
    fireEvent.change(screen.getByLabelText('Font Size'), {
      target: { value: 'large' },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/settings/appearance`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            theme: 'light',
            fontSize: 'large',
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Appearance settings updated');
    });
  });

  it('updates search settings', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCustomization searchId={mockSearchId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('AND')).toBeInTheDocument();
    });

    // Change default operator
    fireEvent.change(screen.getByLabelText('Default Operator'), {
      target: { value: 'OR' },
    });

    // Toggle fuzzy search
    fireEvent.click(screen.getByLabelText('Fuzzy Search'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/settings/search`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            defaultOperator: 'OR',
            fuzzySearch: false,
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Search settings updated');
    });
  });

  it('updates personalization settings', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCustomization searchId={mockSearchId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    // Change language
    fireEvent.change(screen.getByLabelText('Language'), {
      target: { value: 'es' },
    });

    // Change timezone
    fireEvent.change(screen.getByLabelText('Timezone'), {
      target: { value: 'America/New_York' },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/settings/personalization`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            language: 'es',
            timezone: 'America/New_York',
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Personalization settings updated');
    });
  });

  it('resets settings to defaults', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCustomization searchId={mockSearchId} />);

    // Click reset button
    fireEvent.click(screen.getByText('Reset to Defaults'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/settings/reset`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Settings reset to defaults');
    });
  });

  it('handles settings loading error', async () => {
    const mockError = new Error('Settings failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchCustomization searchId={mockSearchId} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load settings');
    });
  });

  it('handles settings update error', async () => {
    const mockError = new Error('Update failed');

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockRejectedValueOnce(mockError);

    render(<SearchCustomization searchId={mockSearchId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Right')).toBeInTheDocument();
    });

    // Change sidebar position
    fireEvent.change(screen.getByLabelText('Sidebar Position'), {
      target: { value: 'left' },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update settings');
    });
  });
}); 