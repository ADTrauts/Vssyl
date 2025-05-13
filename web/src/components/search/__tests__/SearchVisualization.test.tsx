import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchVisualization } from '../SearchVisualization';
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

describe('SearchVisualization', () => {
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
  const mockAnalytics = {
    totalResults: 100,
    averageScore: 0.85,
    distribution: {
      byType: {
        document: 60,
        image: 30,
        video: 10,
      },
      byDate: {
        '2024-01-01': 20,
        '2024-01-02': 30,
        '2024-01-03': 50,
      },
    },
    topAuthors: [
      {
        name: 'John Doe',
        count: 30,
        averageScore: 0.9,
      },
      {
        name: 'Jane Smith',
        count: 20,
        averageScore: 0.85,
      },
    ],
  };
  const mockInsights = {
    trends: [
      {
        type: 'rising',
        query: 'test query',
        change: 0.5,
        period: 'week',
      },
      {
        type: 'falling',
        query: 'old query',
        change: -0.3,
        period: 'week',
      },
    ],
    patterns: [
      {
        type: 'correlation',
        items: ['test', 'document'],
        strength: 0.8,
      },
      {
        type: 'sequence',
        items: ['search', 'filter', 'sort'],
        frequency: 0.6,
      },
    ],
    correlations: [
      {
        type: 'positive',
        items: ['test', 'document'],
        correlation: 0.7,
      },
      {
        type: 'negative',
        items: ['test', 'image'],
        correlation: -0.5,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the visualization component', () => {
    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );
    expect(screen.getByText('Search Visualization')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('loads analytics data on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Analytics tab
    fireEvent.click(screen.getByText('Analytics'));

    await waitFor(() => {
      expect(screen.getByText('100 total results')).toBeInTheDocument();
      expect(screen.getByText('85% average score')).toBeInTheDocument();
      expect(screen.getByText('60 documents')).toBeInTheDocument();
      expect(screen.getByText('30 images')).toBeInTheDocument();
      expect(screen.getByText('10 videos')).toBeInTheDocument();
    });
  });

  it('loads insights data on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInsights),
    });

    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Insights tab
    fireEvent.click(screen.getByText('Insights'));

    await waitFor(() => {
      expect(screen.getByText('Rising')).toBeInTheDocument();
      expect(screen.getByText('Falling')).toBeInTheDocument();
      expect(screen.getByText('Correlation')).toBeInTheDocument();
      expect(screen.getByText('Sequence')).toBeInTheDocument();
    });
  });

  it('changes visualization type', async () => {
    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Change visualization type
    fireEvent.change(screen.getByLabelText('Visualization Type'), {
      target: { value: 'bar' },
    });

    await waitFor(() => {
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
    });
  });

  it('changes time range', async () => {
    render(
      <SearchVisualization
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

  it('filters insights by type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInsights),
    });

    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Insights tab
    fireEvent.click(screen.getByText('Insights'));

    // Filter by type
    fireEvent.change(screen.getByLabelText('Insight Type'), {
      target: { value: 'trends' },
    });

    await waitFor(() => {
      expect(screen.getByText('Rising')).toBeInTheDocument();
      expect(screen.getByText('Falling')).toBeInTheDocument();
      expect(screen.queryByText('Correlation')).not.toBeInTheDocument();
      expect(screen.queryByText('Sequence')).not.toBeInTheDocument();
    });
  });

  it('handles analytics loading error', async () => {
    const mockError = new Error('Analytics failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Analytics tab
    fireEvent.click(screen.getByText('Analytics'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load analytics');
    });
  });

  it('handles insights loading error', async () => {
    const mockError = new Error('Insights failed');

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    render(
      <SearchVisualization
        searchId={mockSearchId}
        query={mockQuery}
        filters={mockFilters}
        results={mockResults}
      />
    );

    // Switch to Insights tab
    fireEvent.click(screen.getByText('Insights'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load insights');
    });
  });
}); 