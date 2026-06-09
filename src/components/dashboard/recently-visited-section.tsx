"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock3, FileText } from "lucide-react";

import { SectionTitle } from "@/components/dashboard/section-title";

type RecentlyVisitedNote = {
  id: string;
  title: string;
  date: string;
  emoji: string;
  swatch: string;
};

const recentlyVisited: RecentlyVisitedNote[] = [
  {
    id: "calculus-notes",
    title: "Calculus Notes",
    date: "Mar 28",
    emoji: "📐",
    swatch: "bg-[#465b6e]",
  },
  {
    id: "topic-one",
    title: "Topic #1",
    date: "Mar 16",
    emoji: "",
    swatch: "bg-[#222225]",
  },
  {
    id: "physical-health",
    title: "physical health",
    date: "Mar 16",
    emoji: "🏃",
    swatch: "bg-[#3a3a3f]",
  },
  {
    id: "mental-health",
    title: "mental health",
    date: "Mar 16",
    emoji: "🧠",
    swatch: "bg-[#561f20]",
  },
  {
    id: "cs-notes",
    title: "CS Notes",
    date: "Mar 15",
    emoji: "💻",
    swatch: "bg-[#242426]",
  },
  {
    id: "untitled",
    title: "#Untitled",
    date: "Mar 3",
    emoji: "",
    swatch: "bg-[#5b3a78]",
  },
];

export function RecentlyVisitedSection() {
  const router = useRouter();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const openNote = (noteId: string) => {
    setOpeningId(noteId);
    window.setTimeout(() => {
      router.push(`/dashboard/notes/${noteId}`);
    }, 180);
  };

  return (
    <section>
      <SectionTitle icon={Clock3} label="Recently visited" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {recentlyVisited.map((item) => {
          const isOpening = openingId === item.id;

          return (
            <motion.button
              key={item.title}
              type="button"
              onClick={() => openNote(item.id)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              animate={
                isOpening
                  ? {
                      scale: 1.04,
                      opacity: 0.78,
                      filter: "blur(1px)",
                    }
                  : {
                      scale: 1,
                      opacity: 1,
                      filter: "blur(0px)",
                    }
              }
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="group overflow-hidden rounded-lg bg-[#262626] text-left shadow-[0_12px_40px_rgba(0,0,0,0)] outline-none transition hover:bg-[#2d2d2d] hover:shadow-[0_18px_48px_rgba(0,0,0,0.28)] focus-visible:ring-2 focus-visible:ring-zinc-500/70"
            >
              <div className={`grid h-20 place-items-center rounded-b-lg ${item.swatch}`}>
                {item.emoji ? (
                  <span className="emoji text-2xl">{item.emoji}</span>
                ) : (
                  <FileText className="size-7 text-zinc-500" />
                )}
              </div>
              <div className="px-3 pb-4 pt-3">
                <p className="truncate text-sm font-semibold text-zinc-200">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.date}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
