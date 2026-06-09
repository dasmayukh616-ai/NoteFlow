"use client";

import type * as React from "react";
import { Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Link2,
  Maximize2,
  Minus,
  PanelLeft,
  Plus,
  Search,
  Square,
  UserRound,
  X,
} from "lucide-react";

import { SectionTitle } from "@/components/dashboard/section-title";

type MiniCalendarDay = {
  label: string;
  outside?: boolean;
  selectedWeek?: boolean;
  today?: boolean;
};

type MiniCalendarWeek = {
  week: number;
  selected?: boolean;
  days: MiniCalendarDay[];
};

type CalendarEvent = {
  title: string;
  time: string;
  top: number;
  height: number;
  className?: string;
  dashed?: boolean;
};

const events = [
  {
    date: "Today May 18",
    empty: "No more events",
    tone: "bg-zinc-300",
    today: true,
  },
  {
    date: "Tuesday May 19",
    title: "Computer Application 2",
    time: "3:30 - 5:10 PM",
    tone: "bg-[#5b93d9]",
  },
  {
    date: "Tuesday May 19",
    title: "Comprehensive Rust",
    emoji: "🦀",
    time: "5:30 - 7 PM · Google Meet",
    tone: "bg-[#ff315a]",
  },
];

const miniCalendarWeeks: MiniCalendarWeek[] = [
  {
    week: 18,
    days: [
      { label: "26", outside: true },
      { label: "27", outside: true },
      { label: "28", outside: true },
      { label: "29", outside: true },
      { label: "30", outside: true },
      { label: "1" },
      { label: "2" },
    ],
  },
  {
    week: 19,
    days: [
      { label: "3" },
      { label: "4" },
      { label: "5" },
      { label: "6" },
      { label: "7" },
      { label: "8" },
      { label: "9" },
    ],
  },
  {
    week: 20,
    days: [
      { label: "10" },
      { label: "11" },
      { label: "12" },
      { label: "13" },
      { label: "14" },
      { label: "15" },
      { label: "16" },
    ],
  },
  {
    week: 21,
    selected: true,
    days: [
      { label: "17", selectedWeek: true },
      { label: "18", selectedWeek: true },
      { label: "19", today: true, selectedWeek: true },
      { label: "20", selectedWeek: true },
      { label: "21", selectedWeek: true },
      { label: "22", selectedWeek: true },
      { label: "23", selectedWeek: true },
    ],
  },
  {
    week: 22,
    days: [
      { label: "24" },
      { label: "25" },
      { label: "26" },
      { label: "27" },
      { label: "28" },
      { label: "29" },
      { label: "30" },
    ],
  },
  {
    week: 23,
    days: [
      { label: "31" },
      { label: "1", outside: true },
      { label: "2", outside: true },
      { label: "3", outside: true },
      { label: "4", outside: true },
      { label: "5", outside: true },
      { label: "6", outside: true },
    ],
  },
];

const connectedCalendars = [
  {
    label: "dasmayukh616@...",
    detail: "Default",
    color: "border-[#ff3b42] bg-[#ff3b42]",
  },
  { label: "Family", color: "border-[#ff854d] bg-[#ff854d]" },
  { label: "Holidays in India", color: "border-[#f3c74d] bg-[#f3c74d]" },
  { label: "Holidays in India", color: "border-[#64d28a] bg-[#64d28a]" },
];

const weekDays = [
  { weekday: "Sun", date: "17" },
  { weekday: "Mon", date: "18" },
  { weekday: "Tue", date: "19", today: true },
  { weekday: "Wed", date: "20" },
  { weekday: "Thu", date: "21" },
  { weekday: "Fri", date: "22" },
  { weekday: "Sat", date: "23" },
];

const calendarHours = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const calendarEvents = [
  {
    title: "Begin the Foundations w...",
    time: "09:00",
    day: 1,
    top: 0.8,
    height: 18,
    className: "bg-[#823229] text-[#e2aaa1]",
  },
  {
    title: "Financial Accounting 2",
    time: "12:40-14:20",
    day: 1,
    top: 30.6,
    height: 78,
    className: "bg-[#873329] text-[#eab0a6]",
  },
  {
    title: "TAX ABHRANIL SIR",
    time: "17:30-19:00",
    day: 5,
    top: 65.3,
    height: 70,
    dashed: true,
  },
  {
    title: "TAX, ADV EXCEL M2,M1 PINKI MA'AM",
    time: "11:30-14:30",
    day: 6,
    top: 21.0,
    height: 140,
    dashed: true,
  },
];

export function UpcomingEventsSection() {
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!calendarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [calendarOpen]);

  return (
    <section>
      <SectionTitle icon={CalendarClock} label="Upcoming events" />
      <motion.div
        layoutId="calendar-window"
        role="button"
        tabIndex={0}
        onClick={() => setCalendarOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setCalendarOpen(true);
          }
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="cursor-pointer rounded-lg bg-[#222222] p-5 outline-none transition hover:bg-[#262626] focus-visible:ring-2 focus-visible:ring-zinc-500/70 md:p-6"
      >
        <div className="grid gap-5 md:grid-cols-[150px_1fr]">
          {events.map((event, index) => (
            <EventRow key={`${event.date}-${index}`} event={event} />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {calendarOpen ? (
          <CalendarWindow onClose={() => setCalendarOpen(false)} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function CalendarWindow({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-3 backdrop-blur-md md:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.article
        layoutId="calendar-window"
        role="dialog"
        aria-modal="true"
        aria-label="Notion Calendar week view"
        className="grid h-[min(820px,calc(100dvh-1.5rem))] w-full max-w-7xl grid-rows-[44px_1fr] overflow-hidden rounded-xl border border-white/10 bg-[#191919] text-zinc-100 shadow-[0_32px_120px_rgba(0,0,0,0.7)]"
        transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.9 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#1d1d1d] px-3">
          <div className="flex items-center gap-1.5">
            <CalendarIconButton label="Toggle sidebar" icon={PanelLeft} />
            <CalendarIconButton label="Layout controls" icon={Square} />
            <div className="mx-2 h-5 w-px bg-white/10" />
            <CalendarIconButton label="Search" icon={Search} />
            <CalendarIconButton label="Create event" icon={Plus} />
          </div>

          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-full bg-[#2f2f32] text-zinc-300">
              <UserRound className="size-4" />
            </div>
            <CalendarTopButton>
              Week <ChevronDown className="size-3.5" />
            </CalendarTopButton>
            <CalendarTopButton>Today</CalendarTopButton>
            <CalendarIconButton label="Previous week" icon={ChevronLeft} />
            <CalendarIconButton label="Next week" icon={ChevronRight} />
            <CalendarIconButton label="Calendar layout" icon={CalendarDays} />
            <div className="mx-1 h-5 w-px bg-white/10" />
            <CalendarIconButton label="Minimize window" icon={Minus} />
            <CalendarIconButton label="Maximize window" icon={Maximize2} />
            <button
              type="button"
              aria-label="Close calendar window"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-[#3a1f22] hover:text-[#ff6b6b]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-b border-white/[0.08] bg-[#232323] p-4 lg:border-b-0 lg:border-r">
            <MiniMonthCalendar />

            <div className="mt-7 space-y-4">
              <div className="flex items-center justify-between text-sm font-semibold text-zinc-300">
                <span className="inline-flex items-center gap-2">
                  <Link2 className="size-4 text-zinc-500" />
                  Scheduling
                </span>
                <Eye className="size-4 text-zinc-500" />
              </div>
              <div className="flex h-9 items-center gap-2 rounded-md bg-[#303030] px-3 text-sm text-zinc-500">
                <UserRound className="size-4" />
                Meet with...
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-zinc-500">
                dasmayukh616@gmail.com
              </p>
              {connectedCalendars.map((source) => (
                <CalendarSource key={`${source.label}-${source.color}`} source={source} />
              ))}
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-3 text-sm font-semibold text-zinc-500 transition hover:text-zinc-300"
              >
                <Plus className="size-4" />
                Add calendar account
              </button>
            </div>

            <div className="mt-10 space-y-4 border-t border-white/[0.08] pt-6">
              <p className="text-xs font-semibold text-zinc-500">
                Mayukh Das&apos;s Notion
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-3 text-sm font-semibold text-zinc-500 transition hover:text-zinc-300"
              >
                <Plus className="size-4" />
                Add Notion database
              </button>
            </div>

            <div className="mt-10 space-y-4 border-t border-white/[0.08] pt-6">
              <p className="text-xs font-semibold text-zinc-500">Notion apps</p>
              <div className="inline-flex items-center gap-3 text-sm font-semibold text-zinc-400">
                <span className="grid size-5 place-items-center rounded bg-zinc-700 text-[10px]">
                  N
                </span>
                Notion
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-auto bg-[#191919]">
            <div className="min-w-[1020px]">
              <div className="flex items-end justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-zinc-100">
                    May 2026
                    <span className="ml-2 align-middle text-xs font-semibold text-zinc-500">
                      Week 21
                    </span>
                  </h2>
                </div>
                <div className="text-xs text-zinc-500">
                  Sunday 17 May - Saturday 23 May
                </div>
              </div>

              <WeekCalendarGrid />
            </div>
          </main>
        </div>
      </motion.article>
    </motion.div>
  );
}

function MiniMonthCalendar() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          May 2026
          <span className="text-[11px] text-zinc-500">Week 21</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarIconButton label="Previous month" icon={ChevronLeft} compact />
          <CalendarIconButton label="Next month" icon={ChevronRight} compact />
        </div>
      </div>

      <div className="grid grid-cols-[22px_repeat(7,1fr)] gap-y-1 text-center text-[11px] font-semibold">
        <span />
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day} className="text-zinc-500">
            {day}
          </span>
        ))}
        {miniCalendarWeeks.map((week) => (
          <Fragment key={week.week}>
            <span className="flex h-7 items-center justify-start text-zinc-600">
              {week.week}
            </span>
            {week.days.map((day) => (
              <span
                key={`${week.week}-${day.label}`}
                className={
                  day.today
                    ? "grid h-7 place-items-center rounded-full bg-[#ff5a57] text-white"
                    : day.selectedWeek
                      ? "grid h-7 place-items-center bg-zinc-700/60 text-zinc-100 first:rounded-l-md last:rounded-r-md"
                      : day.outside
                        ? "grid h-7 place-items-center text-zinc-600"
                        : "grid h-7 place-items-center text-zinc-300"
                }
              >
                {day.label}
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function CalendarSource({
  source,
}: {
  source: { label: string; detail?: string; color: string };
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-zinc-300">
      <span className={`size-3.5 rounded-sm border ${source.color}`} />
      <span className="min-w-0 flex-1 truncate">{source.label}</span>
      {source.detail ? <span className="text-xs text-zinc-500">{source.detail}</span> : null}
    </div>
  );
}

function WeekCalendarGrid() {
  return (
    <div>
      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-white/[0.08]">
        <div className="flex items-center gap-1 border-r border-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-500">
          <Plus className="size-3.5" />
          GMT+...
        </div>
        {weekDays.map((day) => (
          <div
            key={`${day.weekday}-${day.date}`}
            className="border-r border-white/[0.08] px-3 py-2 text-center text-xs font-semibold text-zinc-500 last:border-r-0"
          >
            <span className={day.today ? "text-zinc-100" : undefined}>
              {day.weekday}
            </span>{" "}
            <span
              className={
                day.today
                  ? "rounded-md bg-[#ff5a57] px-1.5 py-0.5 text-white"
                  : undefined
              }
            >
              {day.date}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-white/[0.08]">
        <div className="border-r border-white/[0.08] px-3 py-2 text-xs text-zinc-500">
          All-day
        </div>
        {weekDays.map((day) => (
          <div
            key={`all-day-${day.date}`}
            className="h-9 border-r border-white/[0.08] last:border-r-0"
          />
        ))}
      </div>

      <div className="relative grid h-[720px] grid-cols-[72px_repeat(7,minmax(0,1fr))]">
        <div className="border-r border-white/[0.08]">
          {calendarHours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b border-white/[0.06] px-3 pt-1 text-[11px] font-medium text-zinc-500"
            >
              {hour}
            </div>
          ))}
        </div>

        {weekDays.map((day, dayIndex) => (
          <div
            key={`grid-${day.date}`}
            className="relative border-r border-white/[0.08] last:border-r-0"
          >
            {calendarHours.map((hour) => (
              <div key={`${day.date}-${hour}`} className="h-[60px] border-b border-white/[0.06]" />
            ))}
            {calendarEvents
              .filter((event) => event.day === dayIndex)
              .map((event) => (
                <CalendarEventBlock
                  key={`${event.title}-${event.time}`}
                  event={event}
                />
              ))}
          </div>
        ))}

        <div
          className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
          style={{ top: "85.97%" }}
        >
          <span className="ml-10 rounded bg-[#ff5a57] px-1.5 py-0.5 text-[11px] font-bold text-white">
            19:19
          </span>
          <span className="h-px flex-1 bg-[#ff5a57]/70" />
        </div>
      </div>
    </div>
  );
}

function CalendarEventBlock({ event }: { event: CalendarEvent }) {
  return (
    <div
      className={
        event.dashed
          ? "absolute left-2 right-2 z-10 rounded-md border border-dashed border-[#ff3b30] bg-[#201a1a] p-2 text-xs font-bold text-white"
          : `absolute left-2 right-2 z-10 rounded-md p-2 text-xs ${event.className}`
      }
      style={{ top: `${event.top}%`, height: event.height }}
    >
      <p className="line-clamp-2">{event.title}</p>
      <p className="mt-0.5 text-[11px] opacity-80">{event.time}</p>
    </div>
  );
}

function CalendarTopButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-[#252525] px-3 text-sm font-semibold text-zinc-200 transition hover:bg-[#303030]"
    >
      {children}
    </button>
  );
}

function CalendarIconButton({
  label,
  icon: Icon,
  compact,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-200 ${
        compact ? "size-6" : "size-8"
      }`}
    >
      <Icon className={compact ? "size-3.5" : "size-4"} />
    </button>
  );
}

function EventRow({
  event,
}: {
  event: {
    date: string;
    title?: string;
    time?: string;
    empty?: string;
    emoji?: string;
    tone: string;
    today?: boolean;
  };
}) {
  return (
    <>
      <div
        className={
          event.today
            ? "text-sm font-semibold text-[#ff6257]"
            : "text-sm font-semibold text-zinc-200"
        }
      >
        {event.date}
      </div>
      <div className="flex min-h-10 gap-3">
        <div className={`w-1 rounded-full ${event.tone}`} />
        {event.empty ? (
          <p className="pt-1 text-sm text-zinc-500">{event.empty}</p>
        ) : (
          <div>
            <p className="text-base font-semibold text-zinc-200">
              {event.title}{" "}
              {event.emoji ? (
                <span className="emoji text-sm">{event.emoji}</span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{event.time}</p>
          </div>
        )}
      </div>
    </>
  );
}
