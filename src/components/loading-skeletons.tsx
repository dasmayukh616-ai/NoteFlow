import type { ComponentType } from "react";
import {
  CalendarClock,
  Clock3,
  LayoutDashboard,
  Palette,
  Sparkles,
  User,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const dashboardSkeleton = "bg-zinc-700/35";
const panelSkeleton = "bg-zinc-700/30";

export function DashboardHomeSkeleton() {
  return (
    <div
      aria-label="Loading dashboard"
      className="min-h-screen w-full overflow-y-auto bg-[#191919] px-6 py-10 text-zinc-100 md:px-10 lg:px-14"
      role="status"
    >
      <span className="sr-only">Loading dashboard</span>
      <section className="mx-auto flex w-full max-w-[1220px] flex-col gap-9">
        <header className="pt-6 text-center md:pt-10">
          <Skeleton
            className={`mx-auto h-12 w-72 max-w-full md:h-14 md:w-96 ${dashboardSkeleton}`}
          />
        </header>

        <section>
          <SkeletonSectionTitle icon={Clock3} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="overflow-hidden rounded-lg bg-[#262626]"
                key={`recent-card-${index}`}
              >
                <Skeleton
                  className={`h-20 rounded-b-lg rounded-t-none ${panelSkeleton}`}
                />
                <div className="px-3 pb-4 pt-3">
                  <Skeleton className={`h-4 w-4/5 ${dashboardSkeleton}`} />
                  <Skeleton className={`mt-2 h-3 w-12 ${dashboardSkeleton}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SkeletonSectionTitle icon={CalendarClock} />
          <div className="rounded-lg bg-[#222222] p-5 md:p-6">
            <div className="grid gap-5 md:grid-cols-[150px_1fr]">
              {Array.from({ length: 3 }).map((_, index) => (
                <EventSkeletonRow index={index} key={`event-row-${index}`} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <SkeletonSectionTitle icon={LayoutDashboard} />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg bg-[#222222] p-5 md:p-6">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                <Skeleton className={`h-5 w-32 ${dashboardSkeleton}`} />
                <Skeleton className={`h-5 w-24 ${dashboardSkeleton}`} />
                <Skeleton className={`h-7 w-28 rounded-full ${dashboardSkeleton}`} />
              </div>
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <HabitSkeletonRow key={`habit-row-${index}`} />
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-[#222222] p-5 md:p-6">
              <Skeleton className={`mb-7 h-5 w-20 ${dashboardSkeleton}`} />
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className="flex items-center gap-3"
                    key={`todo-row-${index}`}
                  >
                    <Skeleton
                      className={`size-4 shrink-0 rounded-full ${dashboardSkeleton}`}
                    />
                    <Skeleton
                      className={`h-4 ${index === 0 ? "w-48" : "w-36"} ${dashboardSkeleton}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div
      aria-label="Loading calendar"
      className="mx-auto max-w-4xl space-y-8 p-6 md:p-10"
      role="status"
    >
      <span className="sr-only">Loading calendar</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <CalendarEventsSkeleton />
    </div>
  );
}

export function CalendarEventsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="rounded-xl border border-border bg-card p-5"
          key={`calendar-event-skeleton-${index}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton
                className={`h-5 ${index % 2 === 0 ? "w-2/3" : "w-1/2"}`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div
      aria-label="Loading settings"
      className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 pb-20 md:pb-8"
      role="status"
    >
      <span className="sr-only">Loading settings</span>
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>

      <div className="grid h-11 w-full max-w-md grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1">
        {[Palette, Sparkles, User].map((Icon, index) => (
          <div
            className="flex items-center justify-center gap-2 rounded-lg bg-background/50"
            key={`settings-tab-${index}`}
          >
            <Icon className="hidden size-4 text-muted-foreground md:block" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/40 bg-card/50 p-6">
        <div className="space-y-3 border-b border-border/40 pb-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="space-y-6 pt-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              className="flex items-center justify-between gap-4"
              key={`settings-row-${index}`}
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiResponseSkeleton() {
  return (
    <div className="mb-4 flex justify-start">
      <div className="w-[78%] max-w-[260px] rounded-2xl rounded-tl-none border border-border bg-secondary p-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-11/12 bg-foreground/15" />
          <Skeleton className="h-3 w-4/5 bg-foreground/15" />
          <Skeleton className="h-3 w-2/5 bg-foreground/15" />
        </div>
      </div>
    </div>
  );
}

function SkeletonSectionTitle({
  icon: Icon,
}: {
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 text-zinc-400">
      <Icon className="size-4" />
      <Skeleton className={`h-5 w-36 ${dashboardSkeleton}`} />
    </div>
  );
}

function EventSkeletonRow({ index }: { index: number }) {
  return (
    <>
      <Skeleton
        className={`h-5 ${index === 0 ? "w-24" : "w-32"} ${dashboardSkeleton}`}
      />
      <div className="flex min-h-10 gap-3">
        <Skeleton className={`w-1 rounded-full ${dashboardSkeleton}`} />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className={`h-5 w-52 max-w-full ${dashboardSkeleton}`} />
          <Skeleton className={`h-4 w-40 max-w-full ${dashboardSkeleton}`} />
        </div>
      </div>
    </>
  );
}

function HabitSkeletonRow() {
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-4">
      <Skeleton className={`h-4 w-20 ${dashboardSkeleton}`} />
      <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-1">
        {Array.from({ length: 28 }).map((_, index) => (
          <Skeleton
            className={`aspect-square rounded-sm ${dashboardSkeleton}`}
            key={`habit-cell-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
