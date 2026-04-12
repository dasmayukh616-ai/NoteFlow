"use client";

import React, { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Unplug,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  attendees: { email: string; name: string; self: boolean }[];
  htmlLink: string;
}

export default function CalendarPage() {
  const isConnected = useQuery(api.calendarHelpers.isCalendarConnected);
  const fetchEvents = useAction(api.calendar.fetchEvents);
  const createMeetingNote = useAction(api.calendar.createMeetingNote);
  const disconnectCalendar = useMutation(api.calendarHelpers.disconnectCalendar);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingNoteFor, setCreatingNoteFor] = useState<string | null>(null);

  const handleConnect = () => {
    window.location.href = "/api/calendar/auth";
  };

  const handleFetchEvents = async () => {
    setIsLoading(true);
    try {
      const result = await fetchEvents({ maxResults: 15 });
      setEvents(result as CalendarEvent[]);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (event: CalendarEvent) => {
    setCreatingNoteFor(event.id);
    try {
      await createMeetingNote({
        eventId: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        description: event.description || undefined,
        attendees: event.attendees.length > 0 ? event.attendees : undefined,
        location: event.location || undefined,
      });
      // Optionally redirect to the newly created note using Next.js router
    } catch (error) {
      console.error("Failed to create meeting note:", error);
    } finally {
      setCreatingNoteFor(null);
    }
  };

  const handleDisconnect = async () => {
    await disconnectCalendar();
    setEvents([]);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  if (isConnected === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <CalendarIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Connect Google Calendar</h1>
          <p className="text-muted-foreground">
            Sync your meetings and generate structured notes automatically.
          </p>
          <Button onClick={handleConnect} size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Connect Google Calendar
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isConnected === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📅 Calendar Sync</h1>
          <p className="text-muted-foreground text-sm mt-1">Your upcoming meetings from Google Calendar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFetchEvents} disabled={isLoading} className="rounded-lg">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            {events.length === 0 ? "Load Events" : "Refresh"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-400 hover:text-red-500 rounded-lg">
            <Unplug className="w-4 h-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </div>

      {events.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
          <CalendarIcon className="w-12 h-12" />
          <p className="text-sm">Click &quot;Load Events&quot; to pull your upcoming meetings.</p>
        </div>
      )}

      <AnimatePresence>
        <div className="grid gap-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-5 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-semibold text-base truncate">{event.summary}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.start)} · {formatTime(event.start)} – {formatTime(event.end)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                    )}
                    {event.attendees.length > 0 && (
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleCreateNote(event)} disabled={creatingNoteFor === event.id} className="rounded-lg text-xs">
                    {creatingNoteFor === event.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                    Create Note
                  </Button>
                  {event.htmlLink && (
                    <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="rounded-lg text-xs"><ExternalLink className="w-3 h-3" /></Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
