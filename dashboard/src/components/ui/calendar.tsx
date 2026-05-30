import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

export type CalendarProps = DayPickerProps;

/**
 * shadcn/ui Calendar — nav arrows sit in a bar above the caption, not absolutely
 * positioned on the popover edges (see https://ui.shadcn.com/docs/components/calendar).
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rdp-root p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'flex w-full flex-col gap-4',
        month_caption: 'flex h-9 w-full items-center justify-center px-9',
        caption_label: 'text-sm font-medium text-slate-200',
        nav: 'absolute inset-x-0 top-0 flex h-9 w-full items-center justify-between px-1',
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-7 p-0 opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-7 p-0 opacity-70 hover:opacity-100',
        ),
        month_grid: 'mt-1 w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-9 text-center text-[0.8rem] font-normal text-slate-500',
        week: 'mt-2 flex w-full',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 p-0 font-normal text-slate-200 aria-selected:opacity-100',
        ),
        selected:
          '[&_button]:bg-emerald-600 [&_button]:text-white [&_button]:hover:bg-emerald-600 [&_button]:hover:text-white [&_button]:focus:bg-emerald-600 rounded-md',
        today: 'rounded-md bg-slate-800 text-emerald-400',
        outside: 'text-slate-600 opacity-50',
        disabled: 'text-slate-600 opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="size-4" />;
        },
      }}
      {...props}
    />
  );
}
