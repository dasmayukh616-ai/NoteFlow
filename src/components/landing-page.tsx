"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Command,
  Feather,
  MessageSquareText,
  Sparkles,
  Users,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-120px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const featureCards = [
  {
    icon: Bot,
    title: "AI that writes inside the work",
    description:
      "Draft, rewrite, and brainstorm without jumping to a separate chat window or losing the page you are shaping.",
  },
  {
    icon: CalendarClock,
    title: "Meetings become usable notes",
    description:
      "Pull upcoming events into NoteFlow, generate meeting structures, and keep decisions tied to the moment they happened.",
  },
  {
    icon: Waypoints,
    title: "One live source of truth",
    description:
      "Pages, prompts, and planning stay in sync so teams can think together instead of reconciling scattered tools later.",
  },
];

const workflowSteps = [
  {
    label: "01",
    title: "Open the day with context",
    copy:
      "See the writing surface, your meeting rhythm, and the next decision that needs attention in one place.",
  },
  {
    label: "02",
    title: "Turn conversations into structure",
    copy:
      "Generate agendas, capture notes, and reshape rough thinking into something the team can act on immediately.",
  },
  {
    label: "03",
    title: "Keep momentum after the call",
    copy:
      "Use AI follow-ups, shared pages, and workspace search to keep projects moving after everyone closes the tab.",
  },
];

const proofPoints = [
  "Multi-model AI assistance",
  "Calendar-aware meeting notes",
  "Live collaborative workspace",
  "Command-first navigation",
];

const workspaceSignals = [
  {
    icon: MessageSquareText,
    title: "Ask the page what is missing",
    copy:
      "Use the AI sidebar to pressure-test ideas, summarize the room, or draft the next message without breaking focus.",
  },
  {
    icon: Users,
    title: "Built for shared momentum",
    copy:
      "Keep notes, meeting context, and next actions close enough that handoffs feel natural instead of fragile.",
  },
  {
    icon: Command,
    title: "Fast enough for daily use",
    copy:
      "Search, switch, and create from the keyboard so the workspace feels like an instrument, not admin overhead.",
  },
];

type LandingPageProps = {
  pageClassName: string;
  headingClassName: string;
};

export function LandingPage({
  pageClassName,
  headingClassName,
}: LandingPageProps) {
  return (
    <div
      className={cn(
        pageClassName,
        "relative min-h-screen overflow-hidden bg-[#0b0b0c] text-zinc-100",
      )}
    >
      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-[0_14px_35px_-18px_rgba(15,23,42,0.65)] sm:h-11 sm:w-11">
              <Feather className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-300 sm:text-sm sm:tracking-[0.28em]">
                NoteFlow
              </p>
              <p className="hidden text-sm text-zinc-400 sm:block">
                Notes that move with your day
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="hidden rounded-full px-4 text-zinc-300 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="rounded-full border border-white/20 bg-white px-4 text-zinc-950 shadow-[0_18px_35px_-18px_rgba(15,23,42,0.7)] hover:bg-zinc-200 sm:px-5">
                Open
                <span className="hidden sm:inline">&nbsp;workspace</span>
              </Button>
            </Link>
          </div>
        </header>

        <main>
          <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-8 sm:gap-16 sm:px-8 sm:pb-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:px-10 lg:pb-24 lg:pt-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-zinc-300" />
                AI writing, calendar context, and live sync in one workspace
              </div>

              <h1
                className={cn(
                  headingClassName,
                  "mt-7 text-4xl leading-[0.95] font-semibold tracking-[-0.03em] text-balance sm:mt-8 sm:text-6xl sm:tracking-[-0.035em] lg:text-7xl xl:text-[5.5rem]",
                )}
              >
                Work that starts as notes and ends as momentum.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:mt-7 sm:text-xl sm:leading-8">
                NoteFlow brings drafting, meetings, and AI assistance into the
                same surface so ideas do not evaporate between tabs. Write,
                refine, and follow through while your schedule stays in view.
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href="/dashboard">
                  <Button className="h-12 rounded-full border border-white/20 bg-white px-6 text-base text-zinc-950 shadow-[0_18px_35px_-18px_rgba(15,23,42,0.75)] hover:bg-zinc-200">
                    Enter NoteFlow
                    <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link href="#workflow">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-zinc-200 hover:bg-white/[0.08]"
                  >
                    See the workflow
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2.5 text-sm text-zinc-300 sm:mt-10 sm:gap-3">
                {proofPoints.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-zinc-300" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-zinc-950 p-4 shadow-[0_40px_100px_-40px_rgba(15,23,42,0.35)] sm:rounded-[2rem] sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">
                      Morning brief
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Product sync notes
                    </h2>
                  </div>
                  <div className="rounded-full border border-zinc-400/40 bg-zinc-500/15 px-3 py-1 text-xs font-medium text-zinc-200">
                    Live
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-[1.4rem] border border-white/10 bg-zinc-900 p-4">
                    <div className="flex items-center justify-between text-sm text-zinc-300">
                      <span>09:30 AM design review</span>
                      <span>Agenda ready</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-zinc-200">
                      AI drafted a kickoff outline from last week&apos;s action
                      items, calendar invite, and the page history.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[1.4rem] border border-white/10 bg-[#151515] p-4 text-zinc-100">
                      <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">
                        Ask NoteFlow
                      </p>
                      <p className="mt-3 text-sm leading-7 text-zinc-200">
                        Summarize the customer risk, highlight open questions,
                        and draft a follow-up message for the team.
                      </p>
                    </div>

                    <div className="rounded-[1.4rem] border border-white/10 bg-zinc-900 p-4">
                      <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">
                        Next moves
                      </p>
                      <ul className="mt-3 space-y-3 text-sm text-zinc-200">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-zinc-300" />
                          Align on launch scope
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-zinc-300" />
                          Draft recap before noon
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-zinc-300" />
                          Create action page from call
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-zinc-900 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">
                        Workspace signal
                      </p>
                      <span className="text-xs text-zinc-400">
                        cmd+k ready
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <SignalBadge label="Pages synced" value="12" />
                      <SignalBadge label="Upcoming meetings" value="4" />
                      <SignalBadge label="AI prompts today" value="18" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-8 lg:px-10">
            <motion.div
              {...fadeUp}
              className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)]"
            >
              <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">
                    Built for the real workday
                  </p>
                  <h2
                    className={cn(
                      headingClassName,
                      "mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl",
                    )}
                  >
                    Less tab choreography. More forward motion.
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {workspaceSignals.map(({ icon: Icon, title, copy }) => (
                    <article
                      key={title}
                      className="rounded-[1.5rem] border border-white/10 bg-zinc-900 p-5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-zinc-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-zinc-300">
                        {copy}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12 lg:px-10" id="features">
            <motion.div {...fadeUp} className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">
                Core strengths
              </p>
              <h2
                className={cn(
                  headingClassName,
                  "mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl",
                )}
              >
                The workspace stays calm even when the day does not.
              </h2>
            </motion.div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {featureCards.map(({ icon: Icon, title, description }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="rounded-[1.8rem] border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-zinc-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    {description}
                  </p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12 lg:px-10" id="workflow">
            <motion.div
              {...fadeUp}
              className="rounded-[1.6rem] border border-white/10 bg-[#121212] p-5 text-zinc-100 shadow-[0_40px_100px_-55px_rgba(15,23,42,0.7)] sm:rounded-[2rem] sm:p-7"
            >
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">
                    Workflow
                  </p>
                  <h2
                    className={cn(
                      headingClassName,
                      "mt-4 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl",
                    )}
                  >
                    A better path from meeting to meaningful follow-through.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-zinc-300">
                    NoteFlow is designed for the messy middle of work: the part
                    where notes, scheduling, and decisions usually drift apart.
                  </p>
                </div>

                <div className="grid gap-4">
                  {workflowSteps.map((step) => (
                    <div
                      key={step.label}
                      className="rounded-[1.6rem] border border-white/10 bg-zinc-900 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-zinc-300">
                          {step.label}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{step.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-zinc-300">
                            {step.copy}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-12 lg:px-10">
            <motion.div
              {...fadeUp}
              className="rounded-[1.6rem] border border-white/10 bg-zinc-950 p-6 text-center shadow-[0_35px_90px_-55px_rgba(15,23,42,0.4)] sm:rounded-[2rem] sm:p-8"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">
                Ready when you are
              </p>
              <h2
                className={cn(
                  headingClassName,
                  "mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl",
                )}
              >
                Start with a note, leave with a plan.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-zinc-300">
                Open the workspace, connect the context you already have, and
                let NoteFlow carry the thread from idea to action.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/dashboard">
                  <Button className="h-12 rounded-full border border-white/20 bg-white px-6 text-base text-zinc-950 hover:bg-zinc-200">
                    Open the dashboard
                    <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link href="/sign-in" className="sm:hidden">
                    <Button
                      variant="outline"
                      className="h-12 rounded-full border-white/15 bg-transparent px-6 text-base text-zinc-200 hover:bg-white/[0.08]"
                    >
                      Sign in
                    </Button>
                </Link>
                <Link href="/sign-in" className="hidden sm:block">
                    <Button
                      variant="outline"
                      className="h-12 rounded-full border-white/15 bg-transparent px-6 text-base text-zinc-200 hover:bg-white/[0.08]"
                    >
                      Sign in to continue
                    </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="border-t border-white/10 px-5 py-6 text-sm text-zinc-400 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>NoteFlow blends writing, meetings, and AI into one shared workspace.</p>
            <p>&copy; {new Date().getFullYear()} NoteFlow</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SignalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-zinc-800 p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
