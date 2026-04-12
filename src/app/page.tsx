"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Calendar, Feather, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000" />

      {/* Navigation */}
      <nav className="w-full z-50 fixed top-0 border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Feather className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">NoteFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden sm:inline-flex rounded-full">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 border border-border/50"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Now with Multi-Model AI & Real-time Sync</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
        >
          The workspace that thinks <br className="hidden md:block" /> with you.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl"
        >
          NoteFlow combines powerful block-based editing with Google Calendar and
          advanced AI models to supercharge your productivity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6)] transition-all">
              Try NoteFlow Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-border/50 bg-background/50 backdrop-blur hover:bg-secondary/80">
              Explore Features
            </Button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div id="features" className="mt-32 w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Bot className="w-6 h-6 text-blue-500" />}
            title="Multi-Model AI Canvas"
            description="Toggle between Groq, Kimi, and GPT on the fly. Real-time streaming generation inside your documents."
            delay={0.4}
          />
          <FeatureCard 
            icon={<Calendar className="w-6 h-6 text-purple-500" />}
            title="Google Calendar Integration"
            description="Auto-generate meeting notes. Two-way task sync. Context-aware AI suggestions based on your schedule."
            delay={0.5}
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-500" />}
            title="Real-Time Multiplayer"
            description="Powered by Convex. Seamless collaborative editing with instant sync across all your devices."
            delay={0.6}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground z-10">
        <p>© {new Date().getFullYear()} NoteFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center p-8 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl relative group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-sm border border-border/30">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground text-center leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
