"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleHelp,
  Columns3,
  Database,
  EyeOff,
  Filter,
  LayoutList,
  ListChecks,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

type TaskSource = {
  id: string;
  name: string;
  workspace: string;
  tasks: number;
  color: string;
  requiredProperties: string[];
};

type CreatedTask = {
  id: string;
  title: string;
  sourceId: string;
  status: "Not started" | "In progress" | "Done";
  assignee: string;
  dueDate: string;
};

const taskSources: TaskSource[] = [
  {
    id: "noteflow-development",
    name: "NoteFlow - Development",
    workspace: "Mayukh Das's Notion",
    tasks: 7,
    color: "bg-[#5a5a5f]",
    requiredProperties: ["Status", "Assignee", "Due date"],
  },
  {
    id: "my-planner",
    name: "My planner",
    workspace: "Private",
    tasks: 4,
    color: "bg-[#6b5a3f]",
    requiredProperties: ["Status", "Assignee", "Due date"],
  },
  {
    id: "study-board",
    name: "Study task board",
    workspace: "Library",
    tasks: 9,
    color: "bg-[#465b6e]",
    requiredProperties: ["Status", "Assignee", "Due date"],
  },
];

type FilterOption = "Assigned to me" | "Team tasks" | "Due this week";
type SortOption = "Due date" | "Priority" | "Status" | "Created time";
type TaskView = "List" | "Board" | "Calendar";

export default function TasksPage() {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeFilter, setActiveFilter] =
    useState<FilterOption>("Assigned to me");
  const [sortBy, setSortBy] = useState<SortOption>("Due date");
  const [view, setView] = useState<TaskView>("List");

  const visibleTasks = useMemo(() => {
    if (selectedSources.length === 0) return [];
    return createdTasks.filter((task) => selectedSources.includes(task.sourceId));
  }, [createdTasks, selectedSources]);

  const selectedSourceNames = selectedSources
    .map((sourceId) => taskSources.find((source) => source.id === sourceId)?.name)
    .filter(Boolean);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#191919] text-zinc-100">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#191919]/95 px-5 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <span className="grid size-5 place-items-center rounded border border-zinc-500 text-zinc-400">
            <CheckCircle2 className="size-3.5" />
          </span>
          My Tasks
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={favorite ? "Remove My Tasks from favorites" : "Favorite My Tasks"}
            onClick={() => setFavorite((current) => !current)}
            className="grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
          >
            <Star
              className={`size-4 ${favorite ? "fill-zinc-200 text-zinc-200" : ""}`}
            />
          </button>
          <button
            type="button"
            aria-label="Open My Tasks help"
            onClick={() => setHelpOpen((current) => !current)}
            className="grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
          >
            <CircleHelp className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 py-14 md:px-10">
        <div className="mb-5">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-50">
            My Tasks
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#202020] px-2.5 py-1.5 text-xs font-medium text-zinc-400">
            <CheckCircle2 className="size-3.5" />
            My Tasks
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <TaskToolbarButton
            active={activeFilter !== "Assigned to me"}
            icon={Filter}
            label={activeFilter}
            onClick={() =>
              setActiveFilter((current) =>
                current === "Assigned to me"
                  ? "Team tasks"
                  : current === "Team tasks"
                    ? "Due this week"
                    : "Assigned to me",
              )
            }
          />
          <TaskToolbarButton
            icon={ArrowUpDown}
            label={sortBy}
            onClick={() =>
              setSortBy((current) =>
                current === "Due date"
                  ? "Priority"
                  : current === "Priority"
                    ? "Status"
                    : current === "Status"
                      ? "Created time"
                      : "Due date",
              )
            }
          />
          <TaskToolbarButton
            icon={view === "List" ? LayoutList : view === "Board" ? Columns3 : CalendarDays}
            label={view}
            onClick={() =>
              setView((current) =>
                current === "List" ? "Board" : current === "Board" ? "Calendar" : "List",
              )
            }
          />
          <TaskIconButton
            active={searchOpen}
            label="Search tasks"
            icon={Search}
            onClick={() => setSearchOpen((current) => !current)}
          />
          <TaskIconButton
            active={settingsOpen}
            label="Customize properties"
            icon={SlidersHorizontal}
            onClick={() => setSettingsOpen((current) => !current)}
          />
          <button
            type="button"
            onClick={() => setNewTaskOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-[#1f5b93] px-3 text-sm font-semibold text-zinc-100 transition hover:bg-[#2469a8]"
          >
            <Plus className="size-4" />
            New task
          </button>
        </div>

        {searchOpen ? (
          <div className="mb-5 flex h-10 items-center gap-3 rounded-lg border border-white/[0.08] bg-[#202020] px-3 text-sm text-zinc-500">
            <Search className="size-4" />
            Search task title, status, assignee, or source...
          </div>
        ) : null}

        {settingsOpen ? (
          <PropertiesPanel onHide={() => setSettingsOpen(false)} />
        ) : null}

        <section className="relative min-h-[460px] rounded-xl border border-transparent">
          {selectedSources.length === 0 ? (
            <EmptyTasksState onConfigure={() => setSourcePanelOpen(true)} />
          ) : visibleTasks.length === 0 ? (
            <ConfiguredEmptyState
              sourceNames={selectedSourceNames}
              onNewTask={() => setNewTaskOpen(true)}
              onConfigure={() => setSourcePanelOpen(true)}
            />
          ) : (
            <TaskList tasks={visibleTasks} sources={taskSources} view={view} />
          )}
        </section>
      </main>

      {sourcePanelOpen ? (
        <TaskSourcesDialog
          selectedSources={selectedSources}
          onChange={setSelectedSources}
          onClose={() => setSourcePanelOpen(false)}
        />
      ) : null}

      {newTaskOpen ? (
        <NewTaskDialog
          selectedSources={selectedSources}
          onClose={() => setNewTaskOpen(false)}
          onCreate={(task) => {
            setCreatedTasks((current) => [task, ...current]);
            if (!selectedSources.includes(task.sourceId)) {
              setSelectedSources((current) => [task.sourceId, ...current].slice(0, 10));
            }
            setNewTaskOpen(false);
          }}
        />
      ) : null}

      {helpOpen ? <HelpPopover onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}

function EmptyTasksState({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="grid min-h-[430px] place-items-center text-center">
      <div>
        <div className="mx-auto mb-7 grid size-12 place-items-center rounded-lg border-2 border-zinc-600 text-zinc-500">
          <CheckCircle2 className="size-7" />
        </div>
        <p className="text-sm text-zinc-500">See all tasks assigned to you here.</p>
        <button
          type="button"
          onClick={onConfigure}
          className="mt-6 text-sm font-medium text-[#2383e2] transition hover:text-[#5aa7f0]"
        >
          Configure your task sources
        </button>
      </div>
    </div>
  );
}

function ConfiguredEmptyState({
  sourceNames,
  onNewTask,
  onConfigure,
}: {
  sourceNames: (string | undefined)[];
  onNewTask: () => void;
  onConfigure: () => void;
}) {
  return (
    <div className="grid min-h-[430px] place-items-center text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-6 grid size-12 place-items-center rounded-lg border border-white/10 bg-[#222222] text-zinc-500">
          <ListChecks className="size-7" />
        </div>
        <p className="text-sm font-semibold text-zinc-300">No tasks yet</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Sources are connected from {sourceNames.join(", ")}, but there are no
          tasks in this local mock view yet.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={onNewTask}
            className="rounded-md bg-[#1f5b93] px-3 py-1.5 text-sm font-semibold text-zinc-100 transition hover:bg-[#2469a8]"
          >
            New task
          </button>
          <button
            type="button"
            onClick={onConfigure}
            className="rounded-md bg-white/[0.08] px-3 py-1.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.12]"
          >
            Configure sources
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  sources,
  view,
}: {
  tasks: CreatedTask[];
  sources: TaskSource[];
  view: TaskView;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#202020]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 text-xs font-semibold text-zinc-500">
        <span>{view} view</span>
        <span>Status · Assignee · Due date · Source</span>
      </div>
      {tasks.map((task) => {
        const source = sources.find((item) => item.id === task.sourceId);
        return (
          <button
            key={task.id}
            type="button"
            className="grid w-full grid-cols-[1fr_auto] gap-4 border-b border-white/[0.06] px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.04]"
          >
            <span className="flex min-w-0 items-center gap-3">
              {task.status === "Done" ? (
                <CheckCircle2 className="size-4 shrink-0 text-zinc-500" />
              ) : (
                <Circle className="size-4 shrink-0 text-zinc-500" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-200">
                  {task.title}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {task.status} · {task.assignee} · {task.dueDate}
                </span>
              </span>
            </span>
            <span className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
              <span className={`size-2.5 rounded-sm ${source?.color ?? "bg-zinc-600"}`} />
              {source?.name ?? "Task database"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TaskSourcesDialog({
  selectedSources,
  onChange,
  onClose,
}: {
  selectedSources: string[];
  onChange: (sources: string[]) => void;
  onClose: () => void;
}) {
  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onChange(selectedSources.filter((id) => id !== sourceId));
      return;
    }

    onChange([sourceId, ...selectedSources].slice(0, 10));
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Configure task sources"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#202020] text-zinc-100 shadow-[0_32px_120px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/[0.08] p-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-50">
              Configure your task sources
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Choose up to 10 task databases. Each source must have Status,
              Assignee, and Due date properties.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close source configuration"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {taskSources.map((source) => {
            const selected = selectedSources.includes(source.id);
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className="flex w-full items-start gap-4 rounded-xl border border-white/[0.08] bg-[#1a1a1a] p-4 text-left transition hover:bg-[#242424]"
              >
                <span
                  className={`mt-1 grid size-5 place-items-center rounded border ${
                    selected
                      ? "border-[#2383e2] bg-[#2383e2] text-white"
                      : "border-zinc-600 text-transparent"
                  }`}
                >
                  <CheckCircle2 className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <span className={`size-3 rounded-sm ${source.color}`} />
                    {source.name}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {source.workspace} · {source.tasks} tasks ·{" "}
                    {source.requiredProperties.join(", ")}
                  </span>
                </span>
                <Database className="size-4 text-zinc-500" />
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/[0.08] px-5 py-4 text-xs leading-5 text-zinc-500">
          Duplicate-looking tasks may appear if multiple databases contain tasks
          with the same name. Filters can show teammate tasks, not just your own.
        </div>
      </section>
    </div>
  );
}

function NewTaskDialog({
  selectedSources,
  onClose,
  onCreate,
}: {
  selectedSources: string[];
  onClose: () => void;
  onCreate: (task: CreatedTask) => void;
}) {
  const defaultSource = selectedSources[0] ?? taskSources[0].id;
  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState(defaultSource);
  const [status, setStatus] = useState<CreatedTask["status"]>("Not started");
  const [assignee, setAssignee] = useState("Mayukh Das");
  const [dueDate, setDueDate] = useState("May 19, 2026");

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Create new task"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#202020] text-zinc-100 shadow-[0_32px_120px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
          <h2 className="text-lg font-bold text-zinc-50">New task</h2>
          <button
            type="button"
            aria-label="Close new task"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-500">
              Task name
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Type a task..."
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#191919] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <TaskSelect label="Destination" value={sourceId} onChange={setSourceId}>
              {taskSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </TaskSelect>
            <TaskSelect
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as CreatedTask["status"])}
            >
              <option>Not started</option>
              <option>In progress</option>
              <option>Done</option>
            </TaskSelect>
            <TaskInput label="Assignee" value={assignee} onChange={setAssignee} />
            <TaskInput label="Due date" value={dueDate} onChange={setDueDate} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/[0.08] p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/[0.08] px-3 py-1.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.12]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!title.trim()}
            onClick={() =>
              onCreate({
                id: crypto.randomUUID(),
                title: title.trim(),
                sourceId,
                status,
                assignee,
                dueDate,
              })
            }
            className="rounded-md bg-[#1f5b93] px-3 py-1.5 text-sm font-semibold text-zinc-100 transition hover:bg-[#2469a8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create task
          </button>
        </div>
      </section>
    </div>
  );
}

function TaskSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#191919] px-3 text-sm text-zinc-200 outline-none focus:border-zinc-500"
      >
        {children}
      </select>
    </label>
  );
}

function TaskInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#191919] px-3 text-sm text-zinc-200 outline-none focus:border-zinc-500"
      />
    </label>
  );
}

function PropertiesPanel({ onHide }: { onHide: () => void }) {
  return (
    <div className="mb-5 rounded-xl border border-white/[0.08] bg-[#202020] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-300">
          Visible properties
        </p>
        <button
          type="button"
          onClick={onHide}
          className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-300"
        >
          Hide
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
        {["Status", "Assignee", "Due date", "Source database", "Priority"].map(
          (property) => (
            <span
              key={property}
              className="rounded-md border border-white/[0.08] bg-[#191919] px-2.5 py-1"
            >
              {property}
            </span>
          ),
        )}
        <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#191919] px-2.5 py-1 text-zinc-500">
          <EyeOff className="size-3.5" />
          Hide from Home
        </span>
      </div>
    </div>
  );
}

function HelpPopover({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed right-6 top-16 z-[80] w-80 rounded-xl border border-white/10 bg-[#202020] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.5)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-zinc-100">About My Tasks</p>
        <button
          type="button"
          aria-label="Close help"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-sm leading-6 text-zinc-500">
        My Tasks collects assigned work from task databases across your workspace.
        Task sources need Status, Assignee, and Due date properties before they
        can appear here.
      </p>
    </div>
  );
}

function TaskToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm font-semibold transition ${
        active
          ? "bg-white/[0.1] text-zinc-100"
          : "text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200"
      }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
      <ChevronDown className="size-3.5" />
    </button>
  );
}

function TaskIconButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-md transition ${
        active
          ? "bg-white/[0.1] text-zinc-100"
          : "text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}
