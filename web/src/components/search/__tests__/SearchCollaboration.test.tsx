import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchCollaboration } from '../SearchCollaboration';
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

describe('SearchCollaboration', () => {
  const mockSearchId = 'test-search-id';
  const mockCollaborators = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'editor',
      permissions: ['edit', 'comment'],
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'viewer',
      permissions: ['view'],
    },
  ];
  const mockComments = [
    {
      id: '1',
      author: 'John Doe',
      content: 'This is a test comment',
      createdAt: '2024-01-01T00:00:00Z',
      resolved: false,
    },
    {
      id: '2',
      author: 'Jane Smith',
      content: 'Another test comment',
      createdAt: '2024-01-02T00:00:00Z',
      resolved: true,
    },
  ];
  const mockSettings = {
    permissions: {
      canEdit: true,
      canComment: true,
      canInvite: true,
    },
    notifications: {
      email: true,
      inApp: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the collaboration component', () => {
    render(<SearchCollaboration searchId={mockSearchId} />);
    expect(screen.getByText('Search Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Collaborators')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('loads collaborators on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCollaborators),
    });

    render(<SearchCollaboration searchId={mockSearchId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('loads comments on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockComments),
    });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Comments tab
    fireEvent.click(screen.getByText('Comments'));

    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('Another test comment')).toBeInTheDocument();
    });
  });

  it('loads settings on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSettings),
    });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Settings tab
    fireEvent.click(screen.getByText('Settings'));

    await waitFor(() => {
      expect(screen.getByText('Can Edit')).toBeInTheDocument();
      expect(screen.getByText('Can Comment')).toBeInTheDocument();
    });
  });

  it('invites a new collaborator', async () => {
    const mockNewCollaborator = {
      email: 'new@example.com',
      role: 'editor',
      permissions: ['edit', 'comment'],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCollaborators),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Click invite button
    fireEvent.click(screen.getByText('Invite Collaborator'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: mockNewCollaborator.email },
    });
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: mockNewCollaborator.role },
    });
    fireEvent.click(screen.getByLabelText('Can Edit'));
    fireEvent.click(screen.getByLabelText('Can Comment'));

    // Submit form
    fireEvent.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/collaborators/invite`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockNewCollaborator),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Invitation sent successfully');
    });
  });

  it('adds a new comment', async () => {
    const mockNewComment = {
      content: 'New test comment',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComments),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Comments tab
    fireEvent.click(screen.getByText('Comments'));

    // Fill in comment form
    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: mockNewComment.content },
    });

    // Submit comment
    fireEvent.click(screen.getByText('Post Comment'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/comments`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockNewComment),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Comment added successfully');
    });
  });

  it('updates collaboration settings', async () => {
    const mockUpdatedSettings = {
      permissions: {
        canEdit: false,
        canComment: true,
        canInvite: false,
      },
      notifications: {
        email: false,
        inApp: true,
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Settings tab
    fireEvent.click(screen.getByText('Settings'));

    // Update settings
    fireEvent.click(screen.getByLabelText('Can Edit'));
    fireEvent.click(screen.getByLabelText('Can Invite'));
    fireEvent.click(screen.getByLabelText('Email Notifications'));

    // Save settings
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/settings/collaboration`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockUpdatedSettings),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Settings updated successfully');
    });
  });

  it('resolves a comment', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComments),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Comments tab
    fireEvent.click(screen.getByText('Comments'));

    // Click resolve button
    fireEvent.click(screen.getByText('Resolve'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/comments/1/resolve`,
        expect.objectContaining({
          method: 'PUT',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Comment resolved successfully');
    });
  });

  it('removes a collaborator', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCollaborators),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Click remove button
    fireEvent.click(screen.getByText('Remove'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/collaborators/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Collaborator removed successfully');
    });
  });

  it('handles collaborators loading error', async () => {
    const mockError = new Error('Collaborators failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchCollaboration searchId={mockSearchId} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load collaborators');
    });
  });

  it('handles comments loading error', async () => {
    const mockError = new Error('Comments failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Comments tab
    fireEvent.click(screen.getByText('Comments'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load comments');
    });
  });

  it('handles settings loading error', async () => {
    const mockError = new Error('Settings failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(<SearchCollaboration searchId={mockSearchId} />);

    // Switch to Settings tab
    fireEvent.click(screen.getByText('Settings'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load settings');
    });
  });
}); 