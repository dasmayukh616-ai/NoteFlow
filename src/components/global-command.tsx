"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  FileText,
  Filter,
  Home,
  Inbox,
  Link2,
  ListFilter,
  Loader2,
  MessageSquare,
  PanelRight,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SearchGroup = "Past week" | "Past 30 days" | "Older" | "Navigation";
type SearchType = "page" | "command" | "meeting" | "ai";
type SearchAuthor = "Mayukh Das" | "NoteFlow AI";
type SearchLocation = "Private" | "Favorites" | "Meetings" | "Library";
type SearchDate = "Past week" | "Past 30 days" | "Older";
type PreviewBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullet"; text: string };

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  type: SearchType;
  href: string;
  group: SearchGroup;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
  author: SearchAuthor;
  location: SearchLocation;
  date: SearchDate;
  previewTitle: string;
  preview: PreviewBlock[];
};

const paragraph = (text: string): PreviewBlock => ({ type: "paragraph", text });
const heading = (text: string): PreviewBlock => ({ type: "heading", text });
const bullet = (text: string): PreviewBlock => ({ type: "bullet", text });

const searchItems: SearchItem[] = [
  {
    id: "rust-migration",
    title: "Rust Migration#1",
    subtitle: "NoteFlow - Development / roadmap",
    type: "page",
    href: "/dashboard/notes/rust-migration",
    group: "Past week",
    emoji: "🦀",
    author: "Mayukh Das",
    location: "Favorites",
    date: "Past week",
    previewTitle: "Rust Migration#1",
    preview: [
      paragraph(
        "Migrating a codebase from TypeScript/Node.js to Rust is a major shift. It can yield performance and safety benefits, but it changes the entire tech stack, deploys, and team workflows.",
      ),
      paragraph(
        "Executive options for how to structure the migration before the rewrite begins.",
      ),
      bullet("Path A: Rust as the backend microservice."),
      bullet("Keep the existing frontend in TypeScript and React intact."),
      bullet("Expose stable REST or RPC APIs before cutting over production flows."),
      bullet("Track parity with tests, rollout gates, and a clear fallback path."),
      heading("Open questions"),
      bullet("Which features must be API-compatible on day one?"),
      bullet("What data migration can wait until the editor surface is stable?"),
      bullet("Who owns observability during the transition window?"),
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    subtitle: "Private / onboarding",
    type: "page",
    href: "/dashboard/notes/getting-started",
    group: "Past week",
    icon: FileText,
    author: "Mayukh Das",
    location: "Private",
    date: "Past week",
    previewTitle: "Getting Started",
    preview: [
      paragraph("A starter guide for shaping the NoteFlow workspace."),
      bullet("Create a first page for daily notes."),
      bullet("Connect meeting notes to calendar events."),
      bullet("Use the command palette for quick page switching."),
    ],
  },
  {
    id: "topic-one",
    title: "Topic #1",
    subtitle: "Study Notes / Black / SUBJECT #1",
    type: "page",
    href: "/dashboard/notes/topic-one",
    group: "Past week",
    emoji: "⚪",
    author: "Mayukh Das",
    location: "Library",
    date: "Past week",
    previewTitle: "Topic #1",
    preview: [
      paragraph("Collected study notes with definitions, references, and open questions."),
      bullet("Review core definitions before class."),
      bullet("Mark unclear sections for follow-up."),
      bullet("Promote finished notes into Library pages."),
    ],
  },
  {
    id: "roadmap",
    title: "NoteFlow - Development Roadmap & Recommendations",
    subtitle: "Project planning / rewrite",
    type: "page",
    href: "/dashboard/notes/roadmap",
    group: "Past 30 days",
    emoji: "🚀",
    author: "Mayukh Das",
    location: "Favorites",
    date: "Past 30 days",
    previewTitle: "NoteFlow - Development Roadmap",
    preview: [
      paragraph("Frontend-first rewrite notes, parity scope, and milestone checkpoints."),
      bullet("Program setup and landing page are complete."),
      bullet("Dashboard shell and sidebar have the current dark workspace direction."),
      bullet("Command palette is the active surface before editor creation begins."),
      heading("Next recommended passes"),
      bullet("Finish search filters and previews."),
      bullet("Create the actual editor UI surface."),
      bullet("Wire workspace data once Convex page schema is ready."),
    ],
  },
  {
    id: "insurance-notes",
    title: "insurance notes",
    subtitle: "my planner / notes",
    type: "page",
    href: "/dashboard/notes/insurance-notes",
    group: "Older",
    emoji: "🏢",
    author: "Mayukh Das",
    location: "Private",
    date: "Older",
    previewTitle: "insurance notes",
    preview: [
      paragraph("Reference notes for policy terms, renewals, and follow-up tasks."),
      bullet("Capture renewal date and document checklist."),
      bullet("Summarize coverage gaps in plain language."),
      bullet("Move finished actions into the planner."),
    ],
  },
  {
    id: "apple-areas",
    title: "Apple's areas of operation",
    subtitle: "Research / business notes",
    type: "page",
    href: "/dashboard/notes/apple-areas",
    group: "Older",
    emoji: "🟦",
    author: "Mayukh Das",
    location: "Library",
    date: "Older",
    previewTitle: "Apple's areas of operation",
    preview: [
      paragraph("A quick map of Apple's major product, platform, and services lines."),
      bullet("Hardware: iPhone, Mac, iPad, Watch, and accessories."),
      bullet("Services: App Store, iCloud, Apple Music, Apple TV+, and payments."),
      bullet("Platform ecosystem: operating systems, developer tools, and privacy features."),
    ],
  },
  {
    id: "calendar-patterns",
    title: "Google Calendar Integration Patterns for Note-Taking Apps",
    subtitle: "Research / calendar",
    type: "page",
    href: "/dashboard/calendar",
    group: "Older",
    icon: CalendarDays,
    author: "Mayukh Das",
    location: "Meetings",
    date: "Older",
    previewTitle: "Google Calendar Integration Patterns",
    preview: [
      paragraph(
        "Patterns for importing events, generating notes, and writing links back to calendar descriptions.",
      ),
      bullet("Create meeting notes from upcoming calendar events."),
      bullet("Preserve event ownership, guests, and conferencing links."),
      bullet("Handle sync conflicts without overwriting user edits."),
    ],
  },
  {
    id: "new-page",
    title: "New page",
    subtitle: "Private / untitled draft",
    type: "page",
    href: "/dashboard/notes/new-page",
    group: "Older",
    icon: FileText,
    author: "Mayukh Das",
    location: "Private",
    date: "Older",
    previewTitle: "New page",
    preview: [
      paragraph("Blank page shell created for quick capture."),
      bullet("Add a title."),
      bullet("Drop in notes, tasks, or meeting context."),
      bullet("Move it into the right workspace section once it has shape."),
    ],
  },
  {
    id: "progress-report",
    title: "NoteFlow - Project Progress Report",
    subtitle: "Private / status",
    type: "page",
    href: "/dashboard/notes/progress-report",
    group: "Older",
    emoji: "📊",
    author: "NoteFlow AI",
    location: "Private",
    date: "Older",
    previewTitle: "NoteFlow - Project Progress Report",
    preview: [
      paragraph("Summary of completed program setup, landing page design, and dashboard home UI."),
      bullet("Landing page visual direction is locked: dark, grey, Manrope."),
      bullet("Dashboard home now matches the Notion-style workspace baseline."),
      bullet("Command palette work is in progress before actual UI creation begins."),
    ],
  },
  {
    id: "noteflow-progress",
    title: "NoteFlow Progress",
    subtitle: "Private / progress tracker",
    type: "page",
    href: "/dashboard/notes/noteflow-progress",
    group: "Older",
    emoji: "▦",
    author: "NoteFlow AI",
    location: "Private",
    date: "Older",
    previewTitle: "NoteFlow Progress",
    preview: [
      paragraph("A lightweight progress tracker for visible product surfaces."),
      bullet("Program setup: complete."),
      bullet("Landing page: polished."),
      bullet("Home dashboard: first pass complete."),
      bullet("Command palette: finishing details now."),
    ],
  },
  {
    id: "my-planner",
    title: "my planner",
    subtitle: "Private / daily planning",
    type: "page",
    href: "/dashboard/notes/my-planner",
    group: "Older",
    emoji: "💡",
    author: "Mayukh Das",
    location: "Private",
    date: "Older",
    previewTitle: "my planner",
    preview: [
      paragraph("Daily planning hub for tasks, habits, and short reminders."),
      bullet("Morning reset checklist."),
      bullet("Class and project focus blocks."),
      bullet("End-of-day review notes."),
    ],
  },
  {
    id: "holiday",
    title: "Holiday",
    subtitle: "my planner / assessment schedule",
    type: "page",
    href: "/dashboard/notes/holiday",
    group: "Older",
    emoji: "✈️",
    author: "Mayukh Das",
    location: "Private",
    date: "Older",
    previewTitle: "Holiday",
    preview: [
      paragraph("Planning notes for holiday dates and assessment schedule conflicts."),
      bullet("Check exam windows before locking travel plans."),
      bullet("Keep important reminders in the planner."),
      bullet("Add final dates once the schedule is confirmed."),
    ],
  },
  {
    id: "home",
    title: "Home",
    subtitle: "Go to workspace home",
    type: "command",
    href: "/dashboard",
    group: "Navigation",
    icon: Home,
    author: "Mayukh Das",
    location: "Private",
    date: "Past week",
    previewTitle: "Home",
    preview: [paragraph("Open the dashboard home view.")],
  },
  {
    id: "meetings",
    title: "Meetings",
    subtitle: "Open calendar and meeting notes",
    type: "meeting",
    href: "/dashboard/calendar",
    group: "Navigation",
    icon: MessageSquare,
    author: "Mayukh Das",
    location: "Meetings",
    date: "Past week",
    previewTitle: "Meetings",
    preview: [paragraph("Open the calendar integration and meeting-note surface.")],
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "Workspace preferences",
    type: "command",
    href: "/dashboard/settings",
    group: "Navigation",
    icon: Settings,
    author: "Mayukh Das",
    location: "Private",
    date: "Past week",
    previewTitle: "Settings",
    preview: [paragraph("Open workspace preferences and AI model controls.")],
  },
  {
    id: "inbox",
    title: "Inbox",
    subtitle: "Review captured notes",
    type: "command",
    href: "/dashboard",
    group: "Navigation",
    icon: Inbox,
    author: "Mayukh Das",
    location: "Private",
    date: "Past week",
    previewTitle: "Inbox",
    preview: [paragraph("Open captured notes and incoming tasks.")],
  },
  {
    id: "trash",
    title: "Trash",
    subtitle: "Review deleted pages",
    type: "command",
    href: "/dashboard",
    group: "Navigation",
    icon: Trash2,
    author: "Mayukh Das",
    location: "Private",
    date: "Past week",
    previewTitle: "Trash",
    preview: [paragraph("Open deleted pages.")],
  },
];

const fuse = new Fuse(searchItems, {
  keys: ["title", "subtitle", "preview.text", "location", "author"],
  threshold: 0.34,
  ignoreLocation: true,
});

const groups: SearchGroup[] = ["Past week", "Past 30 days", "Older", "Navigation"];
const authorFilters = ["All creators", "Mayukh Das", "NoteFlow AI"] as const;
const locationFilters = ["All locations", "Private", "Favorites", "Meetings", "Library"] as const;
const dateFilters = ["Any time", "Past week", "Past 30 days", "Older"] as const;
const resultTypeFilters = ["All result types", "Pages", "Commands", "Meetings"] as const;
const extraFilterOptions = [
  {
    key: "date",
    label: "Date",
    description: "Filter results by recency.",
    icon: CalendarDays,
  },
  {
    key: "type",
    label: "Result type",
    description: "Show only pages, commands, or meetings.",
    icon: Filter,
  },
] as const;

type AuthorFilter = (typeof authorFilters)[number];
type LocationFilter = (typeof locationFilters)[number];
type DateFilter = (typeof dateFilters)[number];
type ResultTypeFilter = (typeof resultTypeFilters)[number];
type ExtraFilterKey = (typeof extraFilterOptions)[number]["key"];

export function GlobalCommand() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeId, setActiveId] = React.useState(searchItems[0]?.id ?? "");
  const [titleOnly, setTitleOnly] = React.useState(false);
  const [authorFilter, setAuthorFilter] = React.useState<AuthorFilter>("All creators");
  const [locationFilter, setLocationFilter] = React.useState<LocationFilter>("All locations");
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("Any time");
  const [resultTypeFilter, setResultTypeFilter] =
    React.useState<ResultTypeFilter>("All result types");
  const [enabledExtraFilters, setEnabledExtraFilters] = React.useState<ExtraFilterKey[]>([]);
  const [showFilters, setShowFilters] = React.useState(true);
  const [aiLoading, setAiLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const resetFilters = React.useCallback(() => {
    setTitleOnly(false);
    setAuthorFilter("All creators");
    setLocationFilter("All locations");
    setDateFilter("Any time");
    setResultTypeFilter("All result types");
    setEnabledExtraFilters([]);
  }, []);

  const toggleExtraFilter = React.useCallback((key: ExtraFilterKey) => {
    setEnabledExtraFilters((current) => {
      if (current.includes(key)) {
        if (key === "date") setDateFilter("Any time");
        if (key === "type") setResultTypeFilter("All result types");
        return current.filter((item) => item !== key);
      }

      return [...current, key];
    });
  }, []);

  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    const down = (event: KeyboardEvent) => {
      const isCommandSearch =
        (event.key.toLowerCase() === "k" || event.key.toLowerCase() === "p") &&
        (event.metaKey || event.ctrlKey);

      if (isCommandSearch) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("noteflow:open-command", handleOpen);
    document.addEventListener("keydown", down);
    return () => {
      window.removeEventListener("noteflow:open-command", handleOpen);
      document.removeEventListener("keydown", down);
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  const filteredItems = React.useMemo(() => {
    const trimmedQuery = query.trim();
    const base = trimmedQuery
      ? titleOnly
        ? searchItems.filter((item) =>
            item.title.toLowerCase().includes(trimmedQuery.toLowerCase()),
          )
        : fuse.search(trimmedQuery).map((result) => result.item)
      : searchItems;

    return base.filter((item) => {
      if (authorFilter !== "All creators" && item.author !== authorFilter) return false;
      if (locationFilter !== "All locations" && item.location !== locationFilter) return false;
      if (dateFilter !== "Any time" && item.date !== dateFilter) return false;
      if (resultTypeFilter === "Pages" && item.type !== "page") return false;
      if (resultTypeFilter === "Commands" && item.type !== "command") return false;
      if (resultTypeFilter === "Meetings" && item.type !== "meeting") return false;
      return true;
    });
  }, [authorFilter, dateFilter, locationFilter, query, resultTypeFilter, titleOnly]);

  const actionItems = React.useMemo(() => {
    if (!query.trim()) return [];
    return [
      {
        id: "ask-ai",
        label: `Ask NoteFlow AI about "${query.trim()}"`,
        icon: Sparkles,
        action: "ai",
      },
      {
        id: "new-page-action",
        label: `Create new page "${query.trim()}"`,
        icon: Plus,
        action: "new-page",
      },
    ] as const;
  }, [query]);

  const flatRows = React.useMemo(() => {
    return [
      ...actionItems.map((item) => ({ kind: "action" as const, id: item.id })),
      ...filteredItems.map((item) => ({ kind: "item" as const, id: item.id })),
    ];
  }, [actionItems, filteredItems]);

  React.useEffect(() => {
    if (flatRows.length === 0) return;
    if (!flatRows.some((row) => row.id === activeId)) {
      setActiveId(flatRows[0].id);
    }
  }, [activeId, flatRows]);

  const activeItem =
    filteredItems.find((item) => item.id === activeId) ?? filteredItems[0] ?? searchItems[0];

  const runAction = React.useCallback(
    (id: string) => {
      if (id === "ask-ai") {
        setAiLoading(true);
        window.setTimeout(() => setAiLoading(false), 700);
        return;
      }

      if (id === "new-page-action") {
        setOpen(false);
        router.push("/dashboard");
        return;
      }

      const item = searchItems.find((entry) => entry.id === id);
      if (item) {
        setOpen(false);
        router.push(item.href);
      }
    },
    [router],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (flatRows.length === 0) return;
      const currentIndex = Math.max(
        0,
        flatRows.findIndex((row) => row.id === activeId),
      );
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + delta + flatRows.length) % flatRows.length;
      setActiveId(flatRows[nextIndex].id);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runAction(activeId);
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      copyActiveLink(activeItem);
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      copyActiveLink(activeItem, true);
    }
  };

  const hasCustomFilters =
    titleOnly ||
    authorFilter !== "All creators" ||
    locationFilter !== "All locations" ||
    dateFilter !== "Any time" ||
    resultTypeFilter !== "All result types";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[48%] grid h-[min(760px,calc(100dvh-1rem))] w-[min(1180px,calc(100vw-1rem))] max-w-none grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-xl border border-white/10 bg-[#1f1f1f] p-0 text-zinc-100 shadow-[0_32px_120px_rgba(0,0,0,0.6)] sm:w-[min(1180px,calc(100vw-3rem))]"
      >
        <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Search className="size-5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or ask a question in Mayukh Das's NoteFlow..."
              className="h-9 min-w-0 flex-1 bg-transparent text-base font-medium text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <IconButton
              active={showFilters}
              label="Toggle filter row"
              icon={PanelRight}
              onClick={() => setShowFilters((current) => !current)}
            />
            <IconButton
              active={activeId === "ask-ai" || aiLoading}
              label="Ask NoteFlow AI"
              icon={Bot}
              variant="ai"
              onClick={() => {
                if (query.trim()) {
                  setActiveId("ask-ai");
                  runAction("ask-ai");
                } else {
                  setQuery("Summarize this workspace");
                  setActiveId("ask-ai");
                }
              }}
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
            >
              <X className="size-4" />
            </button>
          </div>

          {showFilters ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FilterDropdown icon={ListFilter} label="Title only" active={titleOnly}>
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Search mode
                </DropdownMenuLabel>
                <MenuChoice
                  selected={!titleOnly}
                  title="All content"
                  description="Search titles, breadcrumbs, and preview text."
                  onClick={() => setTitleOnly(false)}
                />
                <MenuChoice
                  selected={titleOnly}
                  title="Title only"
                  description="Only match page or command titles."
                  onClick={() => setTitleOnly(true)}
                />
              </FilterDropdown>

              <FilterDropdown
                icon={UserRound}
                label="Created by"
                value={authorFilter === "All creators" ? undefined : authorFilter}
                active={authorFilter !== "All creators"}
              >
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Created by
                </DropdownMenuLabel>
                {authorFilters.map((author) => (
                  <MenuChoice
                    key={author}
                    selected={authorFilter === author}
                    title={author}
                    onClick={() => setAuthorFilter(author)}
                  />
                ))}
              </FilterDropdown>

              <FilterDropdown
                icon={FileText}
                label="In"
                value={locationFilter === "All locations" ? undefined : locationFilter}
                active={locationFilter !== "All locations"}
              >
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  In
                </DropdownMenuLabel>
                {locationFilters.map((location) => (
                  <MenuChoice
                    key={location}
                    selected={locationFilter === location}
                    title={location}
                    onClick={() => setLocationFilter(location)}
                  />
                ))}
              </FilterDropdown>

              {enabledExtraFilters.includes("date") ? (
                <FilterDropdown
                  icon={CalendarDays}
                  label="Date"
                  value={dateFilter === "Any time" ? undefined : dateFilter}
                  active={dateFilter !== "Any time"}
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Date
                  </DropdownMenuLabel>
                  {dateFilters.map((date) => (
                    <MenuChoice
                      key={date}
                      selected={dateFilter === date}
                      title={date}
                      onClick={() => setDateFilter(date)}
                    />
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => toggleExtraFilter("date")}
                    className="cursor-pointer px-2 py-2 text-xs text-zinc-400 focus:bg-white/[0.08] focus:text-zinc-100"
                  >
                    Remove date filter
                  </DropdownMenuItem>
                </FilterDropdown>
              ) : null}

              {enabledExtraFilters.includes("type") ? (
                <FilterDropdown
                  icon={Circle}
                  label="Type"
                  value={resultTypeFilter === "All result types" ? undefined : resultTypeFilter}
                  active={resultTypeFilter !== "All result types"}
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Result type
                  </DropdownMenuLabel>
                  {resultTypeFilters.map((type) => (
                    <MenuChoice
                      key={type}
                      selected={resultTypeFilter === type}
                      title={type}
                      onClick={() => setResultTypeFilter(type)}
                    />
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => toggleExtraFilter("type")}
                    className="cursor-pointer px-2 py-2 text-xs text-zinc-400 focus:bg-white/[0.08] focus:text-zinc-100"
                  >
                    Remove type filter
                  </DropdownMenuItem>
                </FilterDropdown>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-2.5 text-xs font-medium text-zinc-400 outline-none transition hover:bg-white/[0.08] hover:text-zinc-100 data-[popup-open]:bg-white/[0.08] data-[popup-open]:text-zinc-100"
                >
                  <Plus className="size-3.5" />
                  <span>Filter</span>
                  <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <CommandMenuContent className="min-w-64">
                  <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Add filter
                  </DropdownMenuLabel>
                  {extraFilterOptions.map((option) => (
                    <MenuChoice
                      key={option.key}
                      selected={enabledExtraFilters.includes(option.key)}
                      icon={option.icon}
                      title={option.label}
                      description={option.description}
                      onClick={() => toggleExtraFilter(option.key)}
                    />
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={resetFilters}
                    className="cursor-pointer px-2 py-2 text-xs text-zinc-400 focus:bg-white/[0.08] focus:text-zinc-100"
                  >
                    {hasCustomFilters ? "Reset all filters" : "No active filters"}
                  </DropdownMenuItem>
                </CommandMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        <div className="grid min-h-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-h-0 overflow-y-auto border-white/[0.08] px-3 py-4 md:border-r md:px-4">
            {actionItems.length > 0 ? (
              <div className="mb-4 space-y-1">
                {actionItems.map((action) => (
                  <CommandRow
                    key={action.id}
                    active={activeId === action.id}
                    title={action.label}
                    subtitle={action.action === "ai" ? "Search all sources with AI" : "Add a blank page"}
                    icon={action.icon}
                    right={action.id === "ask-ai" && aiLoading ? "Thinking" : "Enter"}
                    loading={action.id === "ask-ai" && aiLoading}
                    onMouseEnter={() => setActiveId(action.id)}
                    onClick={() => runAction(action.id)}
                  />
                ))}
              </div>
            ) : null}

            {filteredItems.length === 0 ? (
              <div className="grid h-72 place-items-center text-center">
                <div>
                  <Search className="mx-auto mb-3 size-6 text-zinc-500" />
                  <p className="text-sm font-medium text-zinc-300">No results found</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Try removing a filter or searching a broader term.
                  </p>
                </div>
              </div>
            ) : (
              groups.map((group) => {
                const items = filteredItems.filter((item) => item.group === group);
                if (items.length === 0) return null;
                return (
                  <section key={group} className="mb-5">
                    <p className="mb-2 px-2 text-xs font-semibold text-zinc-500">
                      {group}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          active={activeId === item.id}
                          onMouseEnter={() => setActiveId(item.id)}
                          onClick={(event) => {
                            if (event.metaKey || event.ctrlKey) {
                              window.open(item.href, "_blank");
                              return;
                            }
                            runAction(item.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          <PreviewPanel item={activeItem} onOpen={() => runAction(activeItem.id)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  item,
  active,
  onMouseEnter,
  onClick,
}: {
  item: SearchItem;
  active: boolean;
  onMouseEnter: () => void;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-md px-2 text-left transition",
        active ? "bg-white/10 text-zinc-100" : "text-zinc-300 hover:bg-white/[0.06]",
      )}
    >
      <span className="grid size-5 shrink-0 place-items-center text-zinc-400">
        {item.emoji ? (
          <span className="emoji text-base leading-none">{item.emoji}</span>
        ) : Icon ? (
          <Icon className="size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{item.title}</span>
        <span className="block truncate text-xs text-zinc-500">{item.subtitle}</span>
      </span>
    </button>
  );
}

function CommandRow({
  active,
  title,
  subtitle,
  icon: Icon,
  right,
  loading,
  onMouseEnter,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  right: string;
  loading?: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-md px-2 text-left transition",
        active ? "bg-white/10 text-zinc-100" : "text-zinc-300 hover:bg-white/[0.06]",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/[0.08] text-zinc-300">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-zinc-500">{subtitle}</span>
      </span>
      <span className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-zinc-500">
        {right}
      </span>
    </button>
  );
}

function PreviewPanel({
  item,
  onOpen,
}: {
  item: SearchItem;
  onOpen: () => void;
}) {
  const Icon = item.icon;
  return (
    <aside className="hidden min-h-0 bg-[#1b1b1b] p-5 md:block">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#171717]">
        <div className="h-20 shrink-0 bg-[#242424]" />
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-md bg-white/[0.08] text-zinc-200">
              {item.emoji ? (
                <span className="emoji text-3xl leading-none">{item.emoji}</span>
              ) : Icon ? (
                <Icon className="size-6" />
              ) : (
                <FileText className="size-6" />
              )}
            </div>
            <div className="flex rounded-md border border-white/10 bg-[#202020] p-0.5">
              <button
                type="button"
                className="grid size-7 place-items-center rounded text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
                aria-label="Copy link"
                onClick={() => copyActiveLink(item)}
              >
                <Link2 className="size-3.5" />
              </button>
              <button
                type="button"
                className="grid size-7 place-items-center rounded text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
                aria-label="Open page"
                onClick={onOpen}
              >
                <ArrowUpRight className="size-3.5" />
              </button>
            </div>
          </div>
          <h3 className="text-lg font-bold text-zinc-50">{item.previewTitle}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {item.location} · {item.author}
          </p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-300">
            {item.preview.map((block, index) => {
              if (block.type === "heading") {
                return (
                  <p
                    key={`${block.text}-${index}`}
                    className="pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500"
                  >
                    {block.text}
                  </p>
                );
              }

              if (block.type === "bullet") {
                return (
                  <div key={`${block.text}-${index}`} className="flex gap-2 pl-1">
                    <span className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-zinc-500" />
                    <p>{block.text}</p>
                  </div>
                );
              }

              return <p key={`${block.text}-${index}`}>{block.text}</p>;
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
            <span className="rounded border border-white/10 px-2 py-1">Enter open</span>
            <span className="rounded border border-white/10 px-2 py-1">Cmd L copy link</span>
            <span className="rounded border border-white/10 px-2 py-1">Esc close</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilterDropdown({
  icon: Icon,
  label,
  value,
  active,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-2.5 text-xs font-medium text-zinc-400 outline-none transition hover:bg-white/[0.08] hover:text-zinc-100 data-[popup-open]:bg-white/[0.08] data-[popup-open]:text-zinc-100",
          active && "border-white/20 bg-white/10 text-zinc-100",
        )}
      >
        <Icon className="size-3.5" />
        <span>{value ?? label}</span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <CommandMenuContent>{children}</CommandMenuContent>
    </DropdownMenu>
  );
}

function CommandMenuContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuContent
      align="start"
      sideOffset={8}
      className={cn(
        "min-w-52 border border-white/10 bg-[#252525] p-1.5 text-zinc-200 shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {children}
    </DropdownMenuContent>
  );
}

function MenuChoice({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className="cursor-pointer gap-2 px-2 py-2 text-zinc-300 focus:bg-white/[0.08] focus:text-zinc-50"
    >
      {Icon ? <Icon className="size-3.5 text-zinc-500" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] leading-4 text-zinc-500">
            {description}
          </span>
        ) : null}
      </span>
      {selected ? <Check className="size-3.5 text-zinc-200" /> : null}
    </DropdownMenuItem>
  );
}

function IconButton({
  icon: Icon,
  label,
  active,
  variant = "ghost",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  variant?: "ghost" | "ai";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100",
        active && "bg-white/10 text-zinc-100",
        variant === "ai" &&
          "rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:text-sky-100",
        variant === "ai" && active && "bg-sky-500/20 text-sky-100",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function copyActiveLink(item: SearchItem, markdown = false) {
  const href = `${window.location.origin}${item.href}`;
  const value = markdown ? `[${item.title}](${href})` : href;
  void navigator.clipboard?.writeText(value);
}
