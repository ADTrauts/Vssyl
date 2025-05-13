import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchIntegration } from '../SearchIntegration';
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

describe('SearchIntegration', () => {
  const mockSearchId = 'test-search-id';
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the integration component', () => {
    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Search Integrations')).toBeInTheDocument();
    expect(screen.getByText('Add Integration')).toBeInTheDocument();
  });

  it('loads integrations on mount', async () => {
    const mockIntegrations = [
      {
        id: '1',
        name: 'Test Git',
        type: 'git',
        status: 'connected',
        lastSync: '2024-01-01T00:00:00Z',
        settings: {
          repository: 'test/repo',
          branch: 'main',
          autoSync: true,
          syncInterval: 30,
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockIntegrations),
    });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test Git')).toBeInTheDocument();
    });
  });

  it('handles integration loading error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load integrations');
    });
  });

  it('adds a new integration', async () => {
    const mockNewIntegration = {
      name: 'New Integration',
      type: 'git',
      settings: {},
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    // Open add modal
    fireEvent.click(screen.getByText('Add Integration'));

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText('Integration name'), {
      target: { value: mockNewIntegration.name },
    });

    // Submit form
    fireEvent.click(screen.getByText('Add Integration'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/integrations`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockNewIntegration),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Integration added successfully');
    });
  });

  it('updates an existing integration', async () => {
    const mockIntegration = {
      id: '1',
      name: 'Test Git',
      type: 'git',
      status: 'connected',
      lastSync: '2024-01-01T00:00:00Z',
      settings: {
        repository: 'test/repo',
        branch: 'main',
        autoSync: true,
        syncInterval: 30,
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockIntegration]) })
      .mockResolvedValueOnce({ ok: true });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test Git')).toBeInTheDocument();
    });

    // Update repository
    fireEvent.change(screen.getByLabelText('Repository'), {
      target: { value: 'new/repo' },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/integrations/${mockIntegration.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            settings: {
              ...mockIntegration.settings,
              repository: 'new/repo',
            },
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Integration updated successfully');
    });
  });

  it('deletes an integration', async () => {
    const mockIntegration = {
      id: '1',
      name: 'Test Git',
      type: 'git',
      status: 'connected',
      lastSync: '2024-01-01T00:00:00Z',
      settings: {
        repository: 'test/repo',
        branch: 'main',
        autoSync: true,
        syncInterval: 30,
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockIntegration]) })
      .mockResolvedValueOnce({ ok: true });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test Git')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/integrations/${mockIntegration.id}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Integration deleted successfully');
    });
  });

  it('syncs an integration', async () => {
    const mockIntegration = {
      id: '1',
      name: 'Test Git',
      type: 'git',
      status: 'connected',
      lastSync: '2024-01-01T00:00:00Z',
      settings: {
        repository: 'test/repo',
        branch: 'main',
        autoSync: true,
        syncInterval: 30,
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockIntegration]) })
      .mockResolvedValueOnce({ ok: true });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test Git')).toBeInTheDocument();
    });

    // Click sync button
    fireEvent.click(screen.getByRole('button', { name: /sync/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/integrations/${mockIntegration.id}/sync`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Integration synced successfully');
    });
  });

  it('handles integration type-specific settings', async () => {
    const mockIntegration = {
      id: '1',
      name: 'Test Database',
      type: 'database',
      status: 'connected',
      lastSync: '2024-01-01T00:00:00Z',
      settings: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'test',
        autoSync: true,
        syncInterval: 30,
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockIntegration]) });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test Database')).toBeInTheDocument();
      expect(screen.getByLabelText('Database Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Host')).toBeInTheDocument();
      expect(screen.getByLabelText('Port')).toBeInTheDocument();
      expect(screen.getByLabelText('Database')).toBeInTheDocument();
    });
  });

  it('shows security alert for sensitive information', async () => {
    const mockIntegration = {
      id: '1',
      name: 'Test Git',
      type: 'git',
      status: 'connected',
      lastSync: '2024-01-01T00:00:00Z',
      settings: {
        repository: 'test/repo',
        branch: 'main',
        autoSync: true,
        syncInterval: 30,
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockIntegration]) });

    render(<SearchIntegration searchId={mockSearchId} onUpdate={mockOnUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Security Note')).toBeInTheDocument();
      expect(screen.getByText('Sensitive information like tokens and credentials are stored securely and never displayed.')).toBeInTheDocument();
    });
  });
}); 