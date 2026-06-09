"use client";

import * as React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalCommand } from "@/components/global-command";
import { AISidebar } from "@/components/ai-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full overflow-hidden bg-[#191919] text-zinc-100">
        <AppSidebar />
        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="absolute top-4 left-4 z-50 md:hidden">
            <SidebarTrigger className="bg-[#242424] text-zinc-200 hover:bg-[#303030]" />
          </div>
          {children}
        </main>
        <GlobalCommand />
        <AISidebar />
      </div>
    </SidebarProvider>
  );
}
