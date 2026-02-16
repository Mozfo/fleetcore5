"use client";

import * as React from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  startOfYear,
  startOfWeek,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
  className?: string;
}

const PRESET_KEYS = [
  "today",
  "yesterday",
  "this_week",
  "last_7_days",
  "last_28_days",
  "this_month",
  "last_month",
  "this_year",
] as const;

type PresetKey = (typeof PRESET_KEYS)[number];

function getPresetRange(key: PresetKey): { from: Date; to: Date } {
  const today = new Date();
  switch (key) {
    case "today":
      return { from: startOfDay(today), to: endOfDay(today) };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "this_week":
      return { from: startOfDay(startOfWeek(today)), to: endOfDay(today) };
    case "last_7_days":
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    case "last_28_days":
      return { from: startOfDay(subDays(today, 27)), to: endOfDay(today) };
    case "this_month":
      return { from: startOfMonth(today), to: endOfDay(today) };
    case "last_month": {
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "this_year":
      return { from: startOfDay(startOfYear(today)), to: endOfDay(today) };
  }
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const { t } = useTranslation("crm");
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(value.from);

  const handlePreset = (key: string) => {
    const range = getPresetRange(key as PresetKey);
    onChange(range);
    setCurrentMonth(range.from);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setCurrentMonth(range.from);
    }
  };

  const dateLabel = `${format(value.from, "dd MMM yyyy")} - ${format(value.to, "dd MMM yyyy")}`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {isMobile ? (
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{dateLabel}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon />
              {dateLabel}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="end">
          <div className="flex flex-col lg:flex-row">
            <div className="me-0 lg:me-4">
              <ToggleGroup
                type="single"
                defaultValue="last_28_days"
                className="hidden w-28 flex-col lg:block"
              >
                {PRESET_KEYS.map((key) => (
                  <ToggleGroupItem
                    key={key}
                    className="text-muted-foreground w-full"
                    value={key}
                    onClick={() => handlePreset(key)}
                    asChild
                  >
                    <Button className="justify-start rounded-md">
                      {t(`dashboard.date_range.${key}`)}
                    </Button>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Select defaultValue="last_28_days" onValueChange={handlePreset}>
                <SelectTrigger
                  className="mb-4 flex w-full lg:hidden"
                  size="sm"
                  aria-label={t("dashboard.date_range.select_range")}
                >
                  <SelectValue
                    placeholder={t("dashboard.date_range.last_28_days")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`dashboard.date_range.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              className="border-s-0 py-0! ps-0! pe-0! lg:border-s lg:ps-4!"
              mode="range"
              month={currentMonth}
              selected={{ from: value.from, to: value.to }}
              onSelect={handleCalendarSelect}
              onMonthChange={setCurrentMonth}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
