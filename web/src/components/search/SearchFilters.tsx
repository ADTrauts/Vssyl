import * as React from "react"
import { SearchFilter } from "@/types/search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Slider } from "@/components/ui/slider"

interface SearchFiltersProps {
  filters: SearchFilter[]
  onFilterChange: (filters: SearchFilter[]) => void
  className?: string
}

const FILTER_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
] as const

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'greaterThan', label: 'Greater than' },
  { value: 'lessThan', label: 'Less than' },
  { value: 'between', label: 'Between' },
] as const

// Helper function to generate a unique ID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function SearchFilters({
  filters,
  onFilterChange,
  className,
}: SearchFiltersProps) {
  const [newFilter, setNewFilter] = React.useState<Partial<SearchFilter>>({})

  const handleAddFilter = () => {
    if (newFilter.name && newFilter.type && newFilter.operator) {
      const filter: SearchFilter = {
        id: generateId(),
        name: newFilter.name,
        type: newFilter.type,
        value: newFilter.value ?? '',
        operator: newFilter.operator,
      }
      onFilterChange([...filters, filter])
      setNewFilter({})
    }
  }

  const handleRemoveFilter = (filterId: string) => {
    onFilterChange(filters.filter((f) => f.id !== filterId))
  }

  const handleFilterValueChange = (filterId: string, value: unknown) => {
    onFilterChange(
      filters.map((f) => (f.id === filterId ? { ...f, value } : f))
    )
  }

  const handleOperatorChange = (filterId: string, operator: string) => {
    onFilterChange(
      filters.map((f) => (f.id === filterId ? { ...f, operator } : f))
    )
  }

  const renderFilterValue = (filter: SearchFilter) => {
    switch (filter.type) {
      case 'date':
        return (
          <DateRangePicker
            value={filter.value as DateRange}
            onChange={(date) => handleFilterValueChange(filter.id, date)}
          />
        )
      case 'number':
        return (
          <Slider
            value={[Number(filter.value)]}
            onValueChange={([value]) =>
              handleFilterValueChange(filter.id, value)
            }
            min={0}
            max={100}
            step={1}
            className="w-[200px]"
          />
        )
      case 'text':
        return (
          <Input
            value={String(filter.value)}
            onChange={(e) =>
              handleFilterValueChange(filter.id, e.target.value)
            }
            placeholder="Enter value"
            className="w-[200px]"
          />
        )
      case 'boolean':
        return (
          <Select
            value={String(filter.value)}
            onValueChange={(value) =>
              handleFilterValueChange(filter.id, value === 'true')
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Search Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange([])}
          disabled={filters.length === 0}
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{filter.name}</div>
              <div className="flex gap-2">
                <Select
                  value={filter.operator}
                  onValueChange={(value) => handleOperatorChange(filter.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {renderFilterValue(filter)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFilter(filter.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Filter Name</label>
            <Input
              value={newFilter.name ?? ''}
              onChange={(e) =>
                setNewFilter((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter filter name"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Filter Type</label>
            <Select
              value={newFilter.type}
              onValueChange={(value) =>
                setNewFilter((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Operator</label>
            <Select
              value={newFilter.operator}
              onValueChange={(value) =>
                setNewFilter((prev) => ({ ...prev, operator: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddFilter}>Add Filter</Button>
        </div>
      </div>
    </div>
  )
} 