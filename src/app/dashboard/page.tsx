"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FilePlus2, Search, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-24 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Good morning</h1>
        <p className="text-muted-foreground">What do you want to write about today?</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex mb-12 relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          className="h-14 pl-12 rounded-2xl text-lg bg-secondary/30 backdrop-blur-sm border-border/50 shadow-sm"
          placeholder="Search documents or create a new one... (Press ⌘K)"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Quick Action Cards */}
        <div className="group cursor-pointer p-6 rounded-2xl border border-border/40 bg-card hover:bg-secondary/50 transition-colors shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <FilePlus2 className="w-5 h-5" />
          </div>
          <div>
             <h3 className="font-medium mb-1 group-hover:text-indigo-500 transition-colors">Draft a new document</h3>
             <p className="text-sm text-muted-foreground">Start from a blank canvas.</p>
          </div>
        </div>

        <div className="group cursor-pointer p-6 rounded-2xl border border-border/40 bg-card hover:bg-secondary/50 transition-colors shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
             <h3 className="font-medium mb-1 group-hover:text-purple-500 transition-colors">Generate from meeting</h3>
             <p className="text-sm text-muted-foreground">Pull from upcoming events.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
