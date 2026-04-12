"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, X, Braces, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AISidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatAI = useAction(api.ai.chat);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatAI({
        message: userMessage,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I had trouble connecting to my brain." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white z-40"
        size="icon"
      >
        <Sparkles className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%", x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 md:top-0 right-0 w-full md:w-96 h-[80vh] md:h-screen bg-card border-l border-t md:border-t-0 border-border z-50 flex flex-col shadow-2xl rounded-t-2xl md:rounded-none overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
              <div className="flex items-center gap-2 font-semibold">
                <Bot className="w-5 h-5 text-indigo-500" />
                <span>NoteFlow AI</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50 space-y-2">
                  <Braces className="w-8 h-8" />
                  <p className="text-sm">Ask me to summarize, plan, or brainstorm your notes.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none border border-border"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-secondary p-3 rounded-2xl rounded-tl-none border border-border">
                    <motion.div 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex gap-1"
                    >
                      <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                    </motion.div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border bg-background">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask NoteFlow..."
                  className="pr-10 bg-secondary/50 border-border/50 rounded-xl"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-indigo-500 hover:text-indigo-600"
                  onClick={handleSend}
                  disabled={isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
