"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";

import { HomeViewsSection } from "@/components/dashboard/home-views-section";
import { RecentlyVisitedSection } from "@/components/dashboard/recently-visited-section";
import { UpcomingEventsSection } from "@/components/dashboard/upcoming-events-section";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const firstName = user?.firstName || "Mayukh";
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#191919] px-6 py-10 text-zinc-100 md:px-10 lg:px-14">
      <section className="mx-auto flex w-full max-w-[1220px] flex-col gap-9">
        <header className="pt-6 text-center md:pt-10">
          {isLoaded ? (
            <h1 className="text-4xl font-extrabold tracking-normal text-zinc-50 md:text-5xl">
              {greeting}, {firstName}
            </h1>
          ) : (
            <Skeleton className="mx-auto h-12 w-72 max-w-full bg-zinc-700/35 md:h-14 md:w-96" />
          )}
        </header>

        <RecentlyVisitedSection />
        <UpcomingEventsSection />
        <HomeViewsSection />
      </section>
    </div>
  );
}
