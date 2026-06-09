import Link from "next/link";
import { CheckCircle2, Circle, LayoutDashboard } from "lucide-react";

import { SectionTitle } from "@/components/dashboard/section-title";

const habits = [
  {
    title: "New Notes",
    cells: [
      4, 1, 0, 0, 0, 2, 2, 4, 0, 0, 0, 4, 2, 2, 3, 1, 2, 2, 4, 0, 0, 0, 2, 2,
      0, 0, 0, 0,
    ],
  },
  {
    title: "To-Dos",
    cells: [
      3, 3, 0, 2, 3, 3, 3, 0, 2, 3, 3, 2, 0, 2, 3, 3, 0, 2, 3, 2, 0, 2, 3, 3,
      0, 2, 2, 0,
    ],
  },
  {
    title: "Daily Review",
    cells: [
      0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 0, 0, 2, 0, 1, 0, 0, 0, 2, 2, 2, 2, 0,
      0, 0, 2, 0,
    ],
  },
];

const todos = [
  { title: "Wake up and freshen up", done: true },
  { title: "Have breakfast", done: false },
  { title: "Morning workout", done: false },
];

export function HomeViewsSection() {
  return (
    <section>
      <SectionTitle icon={LayoutDashboard} label="Home views" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg bg-[#222222] p-5 md:p-6">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-200">
              Habit Tracker
            </h2>
            <span className="text-sm text-zinc-500">Last 4 weeks</span>
            <span className="rounded-full bg-[#7a4a14] px-3 py-1 text-sm font-semibold text-orange-200">
              <span className="emoji">🔥</span> 4 day streak
            </span>
          </div>

          <div className="space-y-5">
            {habits.map((habit) => (
              <HabitRow key={habit.title} habit={habit} />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-1 text-[10px] text-zinc-500">
            <span>Less</span>
            {[1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={`size-2 rounded-sm ${habitColor(level)}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        <Link
          href="/dashboard/tasks"
          className="rounded-lg bg-[#222222] p-5 outline-none transition hover:bg-[#262626] focus-visible:ring-2 focus-visible:ring-zinc-500/70 md:p-6"
        >
          <h2 className="mb-7 text-base font-semibold text-zinc-200">
            To-Dos
          </h2>
          <div className="space-y-5">
            {todos.map((todo) => (
              <div key={todo.title} className="flex items-center gap-3">
                {todo.done ? (
                  <CheckCircle2 className="size-4 text-zinc-500" />
                ) : (
                  <Circle className="size-4 text-zinc-400" />
                )}
                <span
                  className={
                    todo.done
                      ? "text-sm text-zinc-500 line-through"
                      : "text-sm text-zinc-300"
                  }
                >
                  {todo.title}
                </span>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </section>
  );
}

function HabitRow({
  habit,
}: {
  habit: { title: string; cells: number[] };
}) {
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-4">
      <p className="text-sm text-zinc-400">{habit.title}</p>
      <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-1">
        {habit.cells.map((level, index) => (
          <span
            key={`${habit.title}-${index}`}
            className={`aspect-square rounded-sm ${habitColor(level)}`}
          />
        ))}
      </div>
    </div>
  );
}

function habitColor(level: number) {
  switch (level) {
    case 4:
      return "bg-[#5bd16d]";
    case 3:
      return "bg-[#16883c]";
    case 2:
      return "bg-[#0d652f]";
    case 1:
      return "bg-[#1f3d2a]";
    default:
      return "bg-[#2d2d31]";
  }
}
