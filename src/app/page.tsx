import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LandingPage } from "@/components/landing-page";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NoteFlow | Notes that move with your day",
  description:
    "Capture ideas, turn meetings into action, and work alongside AI in a calendar-aware NoteFlow workspace.",
};

export default function Page() {
  return (
    <LandingPage
      pageClassName={manrope.className}
      headingClassName={manrope.className}
    />
  );
}
