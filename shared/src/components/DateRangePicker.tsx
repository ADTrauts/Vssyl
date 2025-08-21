import React from 'react';

type DateRange = {
  startDate: string;
  endDate: string;
};

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      type="date"
      value={value.startDate}
      onChange={e => onChange({ ...value, startDate: e.target.value })}
      className="border rounded px-2 py-1"
    />
    <span>-</span>
    <input
      type="date"
      value={value.endDate}
      onChange={e => onChange({ ...value, endDate: e.target.value })}
      className="border rounded px-2 py-1"
    />
  </div>
); 