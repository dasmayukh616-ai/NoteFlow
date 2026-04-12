"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  Calendar,
  Settings,
  Search,
  PlusCircle,
  FileText,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { title: "Search", icon: Search, href: "/dashboard/search" },
  { title: "Calendar", icon: Calendar, href: "/dashboard/calendar" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-4 border-b border-border/40 flex justify-between items-center flex-row">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 rounded-md">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
            <AvatarFallback className="rounded-md">NF</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user?.firstName}&apos;s NoteFlow</span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Core items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={pathname === item.href} render={<Link href={item.href} />}>
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Private workspaces/pages */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center group/label">
            <span>Pages</span>
            <button className="opacity-0 group-hover/label:opacity-100 transition-opacity p-1 hover:bg-secondary rounded-md">
              <PlusCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dummy data for now, ideally populated via Convex useQuery(api.pages.list) */}
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/dashboard/doc1"} render={<Link href="/dashboard/doc1" />}>
                    <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                    <span>Project Alpha</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/dashboard/doc2"} render={<Link href="/dashboard/doc2" />}>
                    <FileText className="w-4 h-4 mr-2 text-purple-500" />
                    <span>Meeting Notes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
             <ThemeToggle />
             <SignOutButton>
               <button className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground">
                 <LogOut className="w-4 h-4" />
               </button>
             </SignOutButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
