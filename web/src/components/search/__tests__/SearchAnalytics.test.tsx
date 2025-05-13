import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchAnalytics } from '../SearchAnalytics';
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

describe('SearchAnalytics', () => {
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

  it('renders the analytics component', () => {
    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );
    expect(screen.getByText('Search Analytics')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('loads overview data on mount', async () => {
    const mockOverview = {
      totalSearches: 1000,
      averageResults: 50,
      successRate: 0.95,
      averageTime: 200,
      topQueries: [
        {
          query: 'test',
          count: 100,
          successRate: 0.9,
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOverview),
    });

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1,000 total searches')).toBeInTheDocument();
      expect(screen.getByText('95% success rate')).toBeInTheDocument();
      expect(screen.getByText('200ms average time')).toBeInTheDocument();
    });
  });

  it('loads performance data on mount', async () => {
    const mockPerformance = {
      responseTime: {
        average: 200,
        p95: 300,
        p99: 400,
      },
      throughput: {
        requestsPerSecond: 10,
        concurrentUsers: 5,
      },
      errors: {
        rate: 0.01,
        types: {
          timeout: 5,
          validation: 3,
          server: 2,
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPerformance),
    });

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Performance tab
    fireEvent.click(screen.getByText('Performance'));

    await waitFor(() => {
      expect(screen.getByText('200ms average')).toBeInTheDocument();
      expect(screen.getByText('10 requests/second')).toBeInTheDocument();
      expect(screen.getByText('1% error rate')).toBeInTheDocument();
    });
  });

  it('loads usage data on mount', async () => {
    const mockUsage = {
      users: {
        total: 100,
        active: 50,
        new: 10,
      },
      sessions: {
        total: 500,
        averageDuration: 300,
        bounceRate: 0.2,
      },
      features: {
        filters: 0.8,
        sorting: 0.6,
        export: 0.4,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsage),
    });

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Usage tab
    fireEvent.click(screen.getByText('Usage'));

    await waitFor(() => {
      expect(screen.getByText('100 total users')).toBeInTheDocument();
      expect(screen.getByText('500 total sessions')).toBeInTheDocument();
      expect(screen.getByText('80% filter usage')).toBeInTheDocument();
    });
  });

  it('changes time range', async () => {
    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Change time range
    fireEvent.change(screen.getByLabelText('Time Range'), {
      target: { value: 'month' },
    });

    await waitFor(() => {
      expect(screen.getByText('Last Month')).toBeInTheDocument();
    });
  });

  it('filters by user type', async () => {
    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Usage tab
    fireEvent.click(screen.getByText('Usage'));

    // Filter by user type
    fireEvent.change(screen.getByLabelText('User Type'), {
      target: { value: 'active' },
    });

    await waitFor(() => {
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });
  });

  it('exports analytics data', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/json' });
    const mockUrl = 'blob:test-url';
    const mockCreateObjectURL = jest.fn().mockReturnValue(mockUrl);
    const mockRevokeObjectURL = jest.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Click export button
    fireEvent.click(screen.getByText('Export Data'));

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });

  it('handles overview loading error', async () => {
    const mockError = new Error('Overview failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load overview');
    });
  });

  it('handles performance loading error', async () => {
    const mockError = new Error('Performance failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Performance tab
    fireEvent.click(screen.getByText('Performance'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load performance data');
    });
  });

  it('handles usage loading error', async () => {
    const mockError = new Error('Usage failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchAnalytics
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Usage tab
    fireEvent.click(screen.getByText('Usage'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load usage data');
    });
  });
}); 