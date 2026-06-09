"use client";

import type * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  Home,
  Inbox,
  MessageSquare,
  PanelLeftClose,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const primaryItems = [
  { title: "Home", icon: Home, href: "/dashboard" },
  { title: "Meetings", icon: MessageSquare, href: "/dashboard/calendar" },
  { title: "NoteFlow AI", icon: Bot, href: "/dashboard", muted: true },
  { title: "Inbox", icon: Inbox, href: "/dashboard", muted: true },
  { title: "Library", icon: BookOpen, href: "/dashboard", muted: true },
];

const favoriteItems = [
  { title: "NoteFlow - Development", emoji: "📒" },
  { title: "physical health", emoji: "🏃" },
  { title: "My planner", emoji: "🥲" },
];

const notionAppItems = [
  { title: "My Tasks", icon: CheckCircle2, href: "/dashboard/tasks" },
];

const footerItems = [
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
  { title: "Explore", icon: Compass, href: "/dashboard" },
  { title: "Trash", icon: Trash2, href: "/dashboard" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { toggleSidebar } = useSidebar();
  const displayName = user?.fullName || "Mayukh Das";

  return (
    <Sidebar className="border-r border-white/5 [&_[data-sidebar=sidebar]]:bg-[#202020] [&_[data-sidebar=sidebar]]:text-zinc-300">
      <SidebarHeader className="px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          {isLoaded ? (
            <p className="truncate text-[15px] font-semibold text-zinc-100">
              {displayName}&apos;s NoteFlow
            </p>
          ) : (
            <Skeleton className="h-5 flex-1 bg-zinc-700/35" />
          )}
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-white/[0.08] hover:text-zinc-100"
            aria-label="Collapse sidebar"
            onClick={toggleSidebar}
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("noteflow:open-command"))}
          className="mb-3 flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] text-zinc-400 transition hover:bg-white/[0.08] hover:text-zinc-100"
        >
          <Search className="size-4 shrink-0" />
          <span>Search</span>
        </button>

        <SidebarMenu className="gap-1">
          {primaryItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.href && !item.muted}
                render={<Link href={item.href} />}
                className={cn(
                  "h-9 rounded-lg px-3 text-[15px] font-medium text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100 data-active:bg-white/[0.08] data-active:text-zinc-100",
                  item.title === "NoteFlow AI" && "pl-9",
                )}
              >
                {item.title !== "NoteFlow AI" ? (
                  <item.icon className="size-4" />
                ) : null}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSection title="Favorites">
          {favoriteItems.map((item) => (
            <button
              key={item.title}
              type="button"
              className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] text-zinc-400 transition hover:bg-white/[0.08] hover:text-zinc-100"
            >
              <span className="emoji w-4 text-base leading-none">{item.emoji}</span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </SidebarSection>

        <SidebarSection title="Recents" />
        <SidebarSection title="Shared" />
        <SidebarSection title="Private" />
        <SidebarSection title="Notion apps">
          {notionAppItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] font-medium text-zinc-400 transition hover:bg-white/[0.08] hover:text-zinc-100",
                pathname === item.href && "bg-white/[0.08] text-zinc-100",
              )}
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </SidebarSection>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-5">
        <SidebarMenu className="gap-1">
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                className="h-9 rounded-lg px-3 text-[15px] font-medium text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100"
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <p className="mb-2 px-3 text-[13px] font-medium text-zinc-500">{title}</p>
      {children}
    </section>
  );
}
