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
      <div className="flex w-full min-h-screen bg-background relative overflow-hidden">
        <AppSidebar />
        <main className="flex-1 min-w-0 relative flex flex-col">
          <div className="absolute top-4 left-4 z-50 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </main>
        <GlobalCommand />
        <AISidebar />
      </div>
    </SidebarProvider>
  );
}
