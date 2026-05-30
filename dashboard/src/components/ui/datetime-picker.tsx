import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  TimePicker,
  applyTimeParts,
  getTimePartsFromDate,
  type TimeParts,
} from './time-picker';

interface DateTimePickerProps {
  /** ISO date string, or empty when unset */
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function parseValue(value: string): Date | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Pick date and time',
  className,
}: DateTimePickerProps) {
  const selected = useMemo(() => parseValue(value), [value]);
  const [timeParts, setTimeParts] = useState<TimeParts>(() =>
    getTimePartsFromDate(selected),
  );

  const displayTimeParts = selected
    ? getTimePartsFromDate(selected)
    : timeParts;

  function updateDate(day: Date | undefined) {
    if (!day) {
      onChange('');
      return;
    }
    const parts = selected ? getTimePartsFromDate(selected) : timeParts;
    onChange(applyTimeParts(day, parts).toISOString());
  }

  function updateTime(parts: TimeParts) {
    setTimeParts(parts);
    const base = selected ?? new Date();
    onChange(applyTimeParts(base, parts).toISOString());
  }

  function clear() {
    onChange('');
    setTimeParts(getTimePartsFromDate(undefined));
  }

  const label = selected
    ? format(selected, 'MMM d, yyyy · h:mm a')
    : placeholder;

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal sm:max-w-xs',
              !selected && 'text-slate-500',
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-emerald-400" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} onSelect={updateDate} />
        </PopoverContent>
      </Popover>

      <TimePicker
        value={displayTimeParts}
        onChange={updateTime}
        disabled={disabled}
      />

      {selected ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={clear}
          className="text-slate-400"
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
