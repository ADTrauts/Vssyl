import { useState, useEffect } from 'react';
import { format, subDays, subMonths, subYears, isWithinInterval } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { logger } from '../../utils/logger';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  compareWith?: DateRange;
  onCompareChange?: (range: DateRange | undefined) => void;
}

const quickRanges = [
  { label: 'Last 7 days', getRange: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Last 30 days', getRange: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'Last 3 months', getRange: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
  { label: 'Last 6 months', getRange: () => ({ start: subMonths(new Date(), 6), end: new Date() }) },
  { label: 'Last year', getRange: () => ({ start: subYears(new Date(), 1), end: new Date() }) }
];

export const DateRangePicker = ({
  value,
  onChange,
  compareWith,
  onCompareChange
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(!!compareWith);

  useEffect(() => {
    if (!compareEnabled && compareWith) {
      onCompareChange?.(undefined);
    }
  }, [compareEnabled, compareWith, onCompareChange]);

  const handleQuickRange = (getRange: () => DateRange) => {
    const range = getRange();
    onChange(range);
    if (compareEnabled && compareWith) {
      const compareRange = {
        start: subDays(range.start, range.end.getTime() - range.start.getTime()),
        end: range.start
      };
      onCompareChange?.(compareRange);
    }
  };

  const formatDateRange = (range: DateRange) => {
    return `${format(range.start, 'MMM d, yyyy')} - ${format(range.end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="date-range-picker">
      <div className="main-range">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="range-button">
              <Calendar size={16} />
              <span>{formatDateRange(value)}</span>
              <ChevronDown size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="range-content">
            <div className="quick-ranges">
              {quickRanges.map(({ label, getRange }) => (
                <Button
                  key={label}
                  variant="ghost"
                  onClick={() => {
                    handleQuickRange(getRange);
                    setIsOpen(false);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="calendar-container">
              <CalendarComponent
                mode="range"
                selected={value}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onChange({ start: range.from, end: range.to });
                    if (compareEnabled && compareWith) {
                      const compareRange = {
                        start: subDays(range.from, range.to.getTime() - range.from.getTime()),
                        end: range.from
                      };
                      onCompareChange?.(compareRange);
                    }
                  }
                }}
                numberOfMonths={2}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="compare-toggle">
        <label>
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={(e) => setCompareEnabled(e.target.checked)}
          />
          Compare with previous period
        </label>
      </div>

      {compareEnabled && (
        <div className="compare-range">
          <Popover open={isCompareOpen} onOpenChange={setIsCompareOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="range-button">
                <Calendar size={16} />
                <span>{compareWith ? formatDateRange(compareWith) : 'Select comparison period'}</span>
                <ChevronDown size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="range-content">
              <div className="calendar-container">
                <CalendarComponent
                  mode="range"
                  selected={compareWith}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onCompareChange?.({ start: range.from, end: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}; 