import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;

export interface TimeParts {
  hour: string;
  minute: string;
  period: (typeof PERIODS)[number];
}

export function getTimePartsFromDate(date: Date | undefined): TimeParts {
  if (!date) {
    return { hour: '9', minute: '00', period: 'AM' };
  }
  let h = date.getHours();
  const period: TimeParts['period'] = h >= 12 ? 'PM' : 'AM';
  h %= 12;
  if (h === 0) h = 12;
  return {
    hour: String(h),
    minute: String(date.getMinutes()).padStart(2, '0'),
    period,
  };
}

function partsTo24h(parts: TimeParts): { hours: number; minutes: number } {
  let hours = Number.parseInt(parts.hour, 10);
  const minutes = Number.parseInt(parts.minute, 10);
  if (parts.period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }
  return { hours, minutes };
}

interface TimePickerProps {
  value: TimeParts;
  onChange: (parts: TimeParts) => void;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
}: TimePickerProps) {
  const { hours, minutes } = partsTo24h(value);
  const displayDate = new Date();
  displayDate.setHours(hours, minutes, 0, 0);
  const label = format(displayDate, 'h:mm a');

  function patch(partial: Partial<TimeParts>) {
    onChange({ ...value, ...partial });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 text-left font-normal sm:w-[140px]',
            className,
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <p className="mb-3 text-xs font-medium text-slate-400">Select time</p>
        <div className="flex items-center gap-2">
          <Select
            value={value.hour}
            onValueChange={(hour) => patch({ hour })}
            disabled={disabled}
          >
            <SelectTrigger className="w-[72px]" aria-label="Hour">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-slate-500">:</span>
          <Select
            value={value.minute}
            onValueChange={(minute) => patch({ minute })}
            disabled={disabled}
          >
            <SelectTrigger className="w-[72px]" aria-label="Minute">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={value.period}
            onValueChange={(period) =>
              patch({ period: period as TimeParts['period'] })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-[72px]" aria-label="AM or PM">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Apply time parts to a calendar day (or today). */
export function applyTimeParts(base: Date | undefined, parts: TimeParts): Date {
  const day = startOfDay(base ?? new Date());
  const { hours, minutes } = partsTo24h(parts);
  return setMinutes(setHours(day, hours), minutes);
}
