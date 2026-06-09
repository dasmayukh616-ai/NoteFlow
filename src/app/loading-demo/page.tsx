import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  AiResponseSkeleton,
  CalendarPageSkeleton,
  DashboardHomeSkeleton,
  SettingsPageSkeleton,
} from "@/components/loading-skeletons";

export default function LoadingDemoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-5 md:p-8">
        <header className="border-b border-border pb-5">
          <h1 className="text-2xl font-semibold tracking-normal">
            Skeleton Loading Preview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Route and component fallbacks rendered directly, without waiting on
            auth, Convex, or Google Calendar.
          </p>
        </header>

        <PreviewSection title="Calendar route">
          <CalendarPageSkeleton />
        </PreviewSection>

        <PreviewSection title="Settings route">
          <SettingsPageSkeleton />
        </PreviewSection>

        <PreviewSection title="AI response">
          <div className="max-w-md rounded-md border border-border bg-card p-4">
            <AiResponseSkeleton />
          </div>
        </PreviewSection>

        <PreviewSection title="Dashboard route">
          <div className="overflow-hidden rounded-md border border-border">
            <DashboardHomeSkeleton />
          </div>
        </PreviewSection>
      </div>
    </main>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
