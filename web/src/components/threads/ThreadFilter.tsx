import React from 'react';
import { ThreadType, ThreadFilter as ThreadFilterType } from '@/types/thread';
import { useThreadFilter } from '@/hooks/useThreadFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

const THREAD_TYPES: ThreadType[] = ['message', 'topic', 'project', 'decision', 'documentation'];
const THREAD_STATUSES = ['active', 'archived', 'deleted'] as const;
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'lastActivity', label: 'Last Activity' },
] as const;

export const ThreadFilterComponent: React.FC = () => {
  const {
    activeFilter,
    updateFilter,
    clearFilters,
    isFiltering,
  } = useThreadFilter();

  const handleTypeChange = (value: string) => {
    const types = value.split(',') as ThreadType[];
    updateFilter({ type: types });
  };

  const handleStatusChange = (value: string) => {
    const statuses = value.split(',') as ThreadFilterType['status'];
    updateFilter({ status: statuses });
  };

  const handleSortChange = (value: string) => {
    updateFilter({ sortBy: value as ThreadFilterType['sortBy'] });
  };

  const handleSortOrderChange = (value: string) => {
    updateFilter({ sortOrder: value as ThreadFilterType['sortOrder'] });
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      updateFilter({
        dateRange: {
          start: dateRange.from,
          end: dateRange.to,
        },
      });
    } else {
      updateFilter({ dateRange: undefined });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFilter({
      tags: activeFilter.tags?.filter(tag => tag !== tagToRemove),
    });
  };

  const removeParticipant = (participantToRemove: string) => {
    updateFilter({
      participants: activeFilter.participants?.filter(p => p !== participantToRemove),
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter Threads</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isFiltering}
        >
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Thread Type</label>
          <Select
            value={activeFilter.type?.join(',')}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select types" />
            </SelectTrigger>
            <SelectContent>
              {THREAD_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={activeFilter.status?.join(',')}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {THREAD_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sort By</label>
          <div className="flex gap-2">
            <Select
              value={activeFilter.sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter.sortOrder || 'desc'}
              onValueChange={handleSortOrderChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <DateRangePicker
            value={activeFilter.dateRange ? {
              from: activeFilter.dateRange.start,
              to: activeFilter.dateRange.end,
            } : undefined}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {(activeFilter.tags?.length || activeFilter.participants?.length) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Active Filters</label>
          <div className="flex flex-wrap gap-2">
            {activeFilter.tags?.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
            {activeFilter.participants?.map(participant => (
              <Badge key={participant} variant="secondary">
                {participant}
                <button
                  onClick={() => removeParticipant(participant)}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 