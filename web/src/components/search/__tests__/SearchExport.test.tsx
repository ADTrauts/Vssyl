import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchExport } from '../SearchExport';
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

describe('SearchExport', () => {
  const mockSearchId = 'test-search-id';
  const mockQuery = 'test query';
  const mockFilters = { type: 'document' };
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

  it('renders the export component', () => {
    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );
    expect(screen.getByText('Export & Share')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('exports to JSON', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/json' });
    const mockUrl = 'blob:test-url';
    const mockCreateObjectURL = jest.fn().mockReturnValue(mockUrl);
    const mockRevokeObjectURL = jest.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click export button
    fireEvent.click(screen.getByText('Export'));

    // Select JSON format
    fireEvent.click(screen.getByText('JSON'));

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
      expect(toast.success).toHaveBeenCalledWith('Export completed successfully');
    });
  });

  it('exports to CSV', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/csv' });
    const mockUrl = 'blob:test-url';
    const mockCreateObjectURL = jest.fn().mockReturnValue(mockUrl);
    const mockRevokeObjectURL = jest.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click export button
    fireEvent.click(screen.getByText('Export'));

    // Select CSV format
    fireEvent.click(screen.getByText('CSV'));

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
      expect(toast.success).toHaveBeenCalledWith('Export completed successfully');
    });
  });

  it('exports to PDF', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    const mockUrl = 'blob:test-url';
    const mockCreateObjectURL = jest.fn().mockReturnValue(mockUrl);
    const mockRevokeObjectURL = jest.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click export button
    fireEvent.click(screen.getByText('Export'));

    // Select PDF format
    fireEvent.click(screen.getByText('PDF'));

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
      expect(toast.success).toHaveBeenCalledWith('Export completed successfully');
    });
  });

  it('creates a share link', async () => {
    const mockShareLink = 'https://example.com/share/test';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ link: mockShareLink }),
    });

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click share button
    fireEvent.click(screen.getByText('Share'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Expiration'), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'test123' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create Link'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/search/${mockSearchId}/share`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            expiration: 7,
            password: 'test123',
          }),
        })
      );
      expect(screen.getByText(mockShareLink)).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('Share link created successfully');
    });
  });

  it('copies share link to clipboard', async () => {
    const mockShareLink = 'https://example.com/share/test';
    const mockWriteText = jest.fn().mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ link: mockShareLink }),
    });

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click share button
    fireEvent.click(screen.getByText('Share'));

    // Create share link
    fireEvent.click(screen.getByText('Create Link'));

    // Wait for link to be created
    await waitFor(() => {
      expect(screen.getByText(mockShareLink)).toBeInTheDocument();
    });

    // Click copy button
    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockShareLink);
      expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard');
    });
  });

  it('handles export error', async () => {
    const mockError = new Error('Export failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click export button
    fireEvent.click(screen.getByText('Export'));

    // Select JSON format
    fireEvent.click(screen.getByText('JSON'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to export results');
    });
  });

  it('handles share link creation error', async () => {
    const mockError = new Error('Share failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchExport
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click share button
    fireEvent.click(screen.getByText('Share'));

    // Submit form
    fireEvent.click(screen.getByText('Create Link'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create share link');
    });
  });
}); 