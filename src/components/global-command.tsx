"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Settings, Search } from "lucide-react";
import Fuse from "fuse.js";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// Dummy data representing searchable entities in the workspace
const searchableItems = [
  { id: "dashboard", title: "Dashboard", type: "route", href: "/dashboard", icon: Search },
  { id: "settings", title: "Settings", type: "route", href: "/dashboard/settings", icon: Settings },
  { id: "calendar", title: "Calendar Sync", type: "route", href: "/dashboard/calendar", icon: Calendar },
  { id: "doc1", title: "Project Alpha Notes", type: "document", href: "/dashboard/doc1", icon: FileText },
  { id: "doc2", title: "Q3 Planning", type: "document", href: "/dashboard/doc2", icon: FileText },
];

const fuse = new Fuse(searchableItems, {
  keys: ["title", "type"],
  threshold: 0.3,
});

export function GlobalCommand() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const results = query ? fuse.search(query).map(result => result.item) : searchableItems;

  const routes = results.filter((item) => item.type === "route");
  const documents = results.filter((item) => item.type === "document");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query} 
        onValueChange={setQuery} 
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {routes.length > 0 && (
          <CommandGroup heading="Navigation">
            {routes.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => handleSelect(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {documents.length > 0 && (
          <>
            {routes.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Documents">
              {documents.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.href)}
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
