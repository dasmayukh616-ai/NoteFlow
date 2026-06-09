"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { JSONContent } from "novel";
import {
  ArchiveRestore,
  ArrowLeft,
  Bot,
  ChevronDown,
  Check,
  Clock3,
  Copy,
  Database,
  Download,
  EyeOff,
  FileText,
  Globe2,
  Image as ImageIcon,
  Link2,
  LockKeyhole,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import Editor from "@/components/editor";

type NotePage = {
  id: string;
  title: string;
  icon?: string;
  cover: string;
  location: string;
  updatedAt: string;
  initialContent: JSONContent;
};

type PanelKind =
  | "icon"
  | "cover"
  | "comment"
  | "share"
  | "more"
  | "templates"
  | "quickMore"
  | null;

type ShareAccess = "Restricted" | "Published";

const paragraph = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

const boldParagraph = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text, marks: [{ type: "bold" }] }],
});

const heading = (text: string, level = 2) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

const bullet = (text: string) => ({
  type: "bulletList",
  content: [
    {
      type: "listItem",
      content: [paragraph(text)],
    },
  ],
});

const taskList = (text: string) => ({
  type: "taskList",
  content: [
    {
      type: "taskItem",
      attrs: { checked: false },
      content: [paragraph(text)],
    },
  ],
});

const emptyDoc = (): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});

function nodeHasText(node: JSONContent): boolean {
  if (typeof node.text === "string" && node.text.trim().length > 0) {
    return true;
  }

  return node.content?.some(nodeHasText) ?? false;
}

function isEditorContentEmpty(content: JSONContent) {
  const blocks = content.content ?? [];
  return blocks.length === 0 || blocks.every((block) => !nodeHasText(block));
}

const notePages: Record<string, NotePage> = {
  "calculus-notes": {
    id: "calculus-notes",
    title: "Calculus Notes",
    icon: "📐",
    cover: "#465b6e",
    location: "Study Notes / Mathematics",
    updatedAt: "Edited Mar 28 at 9:42 PM",
    initialContent: {
      type: "doc",
      content: [
        paragraph("Limits, derivatives, and quick exam prep notes collected into one study page."),
        bullet("Review derivative rules before solving mixed practice sets."),
        bullet("Chain rule questions need one more focused pass."),
        bullet("Add examples for implicit differentiation and related rates."),
      ],
    },
  },
  "topic-one": {
    id: "topic-one",
    title: "Topic #1",
    cover: "#242426",
    location: "Study Notes / Black / SUBJECT #1",
    updatedAt: "Edited Mar 16 at 7:15 PM",
    initialContent: {
      type: "doc",
      content: [
        paragraph("A rough capture page for class definitions, references, and open questions."),
        paragraph("Clean up the heading structure before this becomes a library page."),
      ],
    },
  },
  "physical-health": {
    id: "physical-health",
    title: "physical health",
    icon: "🏃",
    cover: "#3a3a3f",
    location: "Private / Wellness",
    updatedAt: "Edited Mar 16 at 6:20 PM",
    initialContent: {
      type: "doc",
      content: [
        paragraph("Training notes, recovery reminders, and lightweight habit observations."),
        bullet("Keep workouts consistent rather than intense."),
        bullet("Track sleep, water, and soreness next to workout notes."),
      ],
    },
  },
  "mental-health": {
    id: "mental-health",
    title: "mental health",
    icon: "🧠",
    cover: "#561f20",
    location: "Private / Wellness",
    updatedAt: "Edited Mar 16 at 5:58 PM",
    initialContent: {
      type: "doc",
      content: [
        paragraph("A calmer place for check-ins, reflections, and energy management."),
        bullet("Use short entries instead of long summaries when tired."),
        bullet("Name the trigger, then write one next action."),
      ],
    },
  },
  "cs-notes": {
    id: "cs-notes",
    title: "CS Notes",
    icon: "💻",
    cover: "#242426",
    location: "Library / Computer Science",
    updatedAt: "Edited Mar 15 at 11:04 PM",
    initialContent: {
      type: "doc",
      content: [
        paragraph("Computer science notes for concepts, snippets, and exam reminders."),
        bullet("Group algorithms by pattern, not by source."),
        bullet("Add small examples for stacks, queues, and recursion."),
      ],
    },
  },
  untitled: {
    id: "untitled",
    title: "#Untitled",
    cover: "#5b3a78",
    location: "Private / Drafts",
    updatedAt: "Edited Mar 3 at 8:11 PM",
    initialContent: {
      type: "doc",
      content: [
        paragraph("An unfinished scratch page waiting for a clearer name and destination."),
        paragraph("Type / to add blocks, media, databases, comments, charts, dashboards, and more."),
      ],
    },
  },
};

const iconChoices = ["📐", "🧠", "🏃", "💻", "🦀", "🚀", "📊", "📝", "🔥", "✨"];
const coverChoices = ["#465b6e", "#3a3a3f", "#561f20", "#5b3a78", "#2f3d34", "#4a3f35", "#222225"];

export default function NoteEditorPage() {
  const params = useParams<{ noteId: string }>();
  const rawNoteId = params.noteId;
  const noteId = Array.isArray(rawNoteId) ? rawNoteId[0] : rawNoteId;

  const note = useMemo<NotePage>(() => {
    const resolvedNoteId = noteId ?? "new-page";

    if (notePages[resolvedNoteId]) return notePages[resolvedNoteId];

    const fallbackTitle = decodeURIComponent(resolvedNoteId)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return {
      id: resolvedNoteId,
      title: fallbackTitle,
      cover: "#2f2f2f",
      location: "Private / Drafts",
      updatedAt: "Edited just now",
      initialContent: emptyDoc(),
    } satisfies NotePage;
  }, [noteId]);

  return <NoteEditorWorkspace key={note.id} note={note} />;
}

function NoteEditorWorkspace({ note }: { note: NotePage }) {
  const router = useRouter();
  const toastTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState(note.title);
  const [pageIcon, setPageIcon] = useState(note.icon ?? "");
  const [coverColor, setCoverColor] = useState(note.cover);
  const [isCoverVisible, setIsCoverVisible] = useState(false);
  const [savedLabel, setSavedLabel] = useState(note.updatedAt);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [shareAccess, setShareAccess] = useState<ShareAccess>("Restricted");
  const [isPageInfoOpen, setIsPageInfoOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<PanelKind>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [editorContent, setEditorContent] = useState<JSONContent>(note.initialContent);
  const [editorRevision, setEditorRevision] = useState(0);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    const titleInput = titleInputRef.current;
    if (!titleInput) return;

    titleInput.style.height = "0px";
    titleInput.style.height = `${titleInput.scrollHeight}px`;
  }, [title]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const markEdited = () => {
    setSavedLabel("Unsaved changes");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const savedTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());
      setSavedLabel(`Saved locally ${savedTime}`);
    }, 900);
  };

  const closePanel = () => setOpenPanel(null);

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Page link copied");
    } catch {
      showToast("Could not copy link");
    }
  };

  const appendBlocks = (blocks: JSONContent[], label: string) => {
    setEditorContent((current) => ({
      ...current,
      content: isEditorContentEmpty(current)
        ? blocks
        : [...(current.content ?? []), ...blocks],
    }));
    setEditorRevision((revision) => revision + 1);
    markEdited();
    showToast(`${label} inserted`);
    closePanel();
  };

  const addComment = () => {
    const trimmedComment = commentDraft.trim();
    if (!trimmedComment) return;

    setComments((current) => [trimmedComment, ...current]);
    setCommentDraft("");
    markEdited();
    showToast("Comment added");
  };

  const updateShareAccess = (access: ShareAccess) => {
    setShareAccess(access);
    showToast(access === "Published" ? "Publishing enabled" : "Publishing disabled");
  };

  const duplicatePageLocally = () => {
    setTitle((current) => `${current || "Untitled"} copy`);
    markEdited();
    closePanel();
    showToast("Local duplicate created");
  };

  const exportMarkdown = () => {
    const markdown = toMarkdown(editorContent, title || "Untitled");
    const fileUrl = URL.createObjectURL(
      new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${slugify(title || "untitled")}.md`;
    link.click();
    URL.revokeObjectURL(fileUrl);
    closePanel();
    showToast("Markdown exported");
  };

  const insertMeetingNotes = () => {
    appendBlocks(
      [
        heading("AI Meeting Notes", 2),
        boldParagraph("Summary"),
        paragraph("Capture agenda, decisions, risks, and follow-up actions here."),
        boldParagraph("Action items"),
        bullet("Owner - next step - due date"),
      ],
      "AI Meeting Notes",
    );
  };

  const insertDatabase = () => {
    appendBlocks(
      [
        heading("Database", 2),
        paragraph("View: Table | Board | Calendar | List | Gallery | Timeline"),
        paragraph("Properties: Status, Assignee, Due date, Priority"),
        paragraph("Filters and sorting will connect when the real database model lands."),
      ],
      "Database scaffold",
    );
  };

  const insertForm = () => {
    appendBlocks(
      [
        heading("Form", 2),
        paragraph("Question: What should this form collect?"),
        paragraph("Response database: Not connected yet"),
      ],
      "Form scaffold",
    );
  };

  const editorIsEmpty = isEditorContentEmpty(editorContent);

  const insertTemplate = (templateName: string) => {
    const templateBlocks: Record<string, JSONContent[]> = {
      "Class notes": [
        heading("Class Notes", 2),
        paragraph("Topic:"),
        paragraph("Key ideas:"),
        bullet("Definition / formula / example"),
        paragraph("Questions to ask:"),
      ],
      "Project brief": [
        heading("Project Brief", 2),
        paragraph("Goal:"),
        paragraph("Scope:"),
        paragraph("Risks:"),
        bullet("Next action"),
      ],
      "Daily review": [
        heading("Daily Review", 2),
        paragraph("Wins:"),
        paragraph("Stuck points:"),
        paragraph("Tomorrow:"),
      ],
    };

    appendBlocks(templateBlocks[templateName] ?? templateBlocks["Class notes"], templateName);
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[#191919] text-zinc-100 selection:bg-zinc-100/20">
      <div className="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-white/[0.05] bg-[#191919]/94 px-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-1.5">
          <IconButton label="Back to home" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="size-4" />
          </IconButton>
          <IconButton
            label="Toggle page details"
            active={isPageInfoOpen}
            onClick={() => setIsPageInfoOpen((open) => !open)}
          >
            <PanelLeft className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => setOpenPanel("icon")}
            className="ml-1 flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.06]"
          >
            <span className="emoji grid size-5 shrink-0 place-items-center text-base">
              {pageIcon || "▣"}
            </span>
            <span className="truncate">{title || "New page"}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpenPanel("share")}
            className="hidden items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300 sm:inline-flex"
          >
            {shareAccess === "Published" ? (
              <Globe2 className="size-3" />
            ) : (
              <LockKeyhole className="size-3" />
            )}
            {shareAccess === "Published" ? "Published" : "Private"}
            <ChevronDown className="size-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden items-center gap-1.5 text-xs text-zinc-500 md:inline-flex">
            {savedLabel === "Unsaved changes" ? (
              <Clock3 className="size-3.5" />
            ) : (
              <Check className="size-3.5" />
            )}
            {savedLabel}
          </span>
          <IconButton
            label="Open comments"
            active={openPanel === "comment"}
            onClick={() => setOpenPanel("comment")}
          >
            <span className="relative grid size-full place-items-center">
              <MessageSquare className="size-4" />
              {comments.length ? (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-950">
                  {comments.length}
                </span>
              ) : null}
            </span>
          </IconButton>
          <button
            type="button"
            onClick={() => setOpenPanel("share")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.06]"
          >
            <Share2 className="size-3.5" />
            Share
            <ChevronDown className="size-3" />
          </button>
          <IconButton label="Copy page link" onClick={copyPageLink}>
            <Link2 className="size-4" />
          </IconButton>
          <IconButton
            label={isFavorite ? "Remove favorite" : "Add favorite"}
            active={isFavorite}
            onClick={() => {
              setIsFavorite((favorite) => !favorite);
              showToast(isFavorite ? "Removed from favorites" : "Added to favorites");
            }}
          >
            <Star className={isFavorite ? "size-4 fill-zinc-100" : "size-4"} />
          </IconButton>
          <IconButton label="More actions" onClick={() => setOpenPanel("more")}>
            <MoreHorizontal className="size-4" />
          </IconButton>
        </div>
      </div>

      {isPageInfoOpen ? (
        <aside className="fixed left-4 top-16 z-30 hidden w-72 rounded-lg border border-white/[0.08] bg-[#242424]/95 p-4 text-sm shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:block">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-zinc-100">Page details</p>
            <button
              type="button"
              onClick={() => setIsPageInfoOpen(false)}
              className="grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100"
            >
              <X className="size-4" />
            </button>
          </div>
          <DetailRow label="Location" value={note.location} />
          <DetailRow label="Visibility" value={shareAccess === "Published" ? "Published" : "Private"} />
          <DetailRow label="Favorite" value={isFavorite ? "Yes" : "No"} />
          <DetailRow label="Comments" value={`${comments.length}`} />
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-zinc-500">
              Outline
            </p>
            <p className="text-zinc-300">{title || "New page"}</p>
            <p className="mt-1 text-xs text-zinc-500">Editor blocks and headings will index here.</p>
          </div>
        </aside>
      ) : null}

      {isArchived ? (
        <div className="fixed left-1/2 top-14 z-[45] flex w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-red-300/20 bg-[#2a1b1b]/95 px-4 py-3 text-sm text-red-100 shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <span className="truncate">This page is in trash locally.</span>
          <button
            type="button"
            onClick={() => {
              setIsArchived(false);
              showToast("Page restored");
            }}
            className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-red-100 px-3 text-xs font-bold text-red-950 transition hover:bg-white"
          >
            <ArchiveRestore className="size-3.5" />
            Restore
          </button>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[860px] px-6 pb-32 pt-28 md:px-10 md:pt-36">
        {isCoverVisible ? (
          <div className="group relative mb-8 h-40 overflow-hidden rounded-lg border border-white/[0.05]">
            <button
              type="button"
              onClick={() => setOpenPanel("cover")}
              className="h-full w-full transition group-hover:brightness-110"
              style={{ backgroundColor: coverColor }}
              aria-label="Change cover"
            />
            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setOpenPanel("cover")}
                className="rounded-md bg-black/35 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 backdrop-blur transition hover:bg-black/50"
              >
                Change cover
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCoverVisible(false);
                  markEdited();
                  showToast("Cover removed");
                }}
                className="rounded-md bg-black/35 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 backdrop-blur transition hover:bg-black/50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <ToolbarTextButton onClick={() => setOpenPanel("icon")}>
            <span className="emoji">{pageIcon || "☺"}</span>
            {pageIcon ? "Change icon" : "Add icon"}
          </ToolbarTextButton>
          <ToolbarTextButton
            onClick={() => {
              setIsCoverVisible(true);
              setOpenPanel("cover");
            }}
          >
            <ImageIcon className="size-4" />
            {isCoverVisible ? "Change cover" : "Add cover"}
          </ToolbarTextButton>
          <ToolbarTextButton onClick={() => setOpenPanel("comment")}>
            <MessageSquare className="size-4" />
            {comments.length ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add comment"}
          </ToolbarTextButton>
        </div>

        <textarea
          ref={titleInputRef}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            markEdited();
          }}
          aria-label="Page title"
          rows={1}
          className="mb-5 block max-h-[260px] min-h-[4rem] w-full resize-none overflow-hidden bg-transparent text-5xl font-extrabold tracking-normal text-zinc-100 outline-none placeholder:text-zinc-700 md:text-6xl"
          placeholder="New page"
        />

        {editorIsEmpty ? (
          <div className="mb-7 grid gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 sm:grid-cols-3">
            <EmptyStarterButton
              icon={Sparkles}
              label="Meeting notes"
              onClick={insertMeetingNotes}
            />
            <EmptyStarterButton
              icon={Database}
              label="Database"
              onClick={insertDatabase}
            />
            <EmptyStarterButton
              icon={FileText}
              label="Template"
              onClick={() => insertTemplate("Class notes")}
            />
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <button
            type="button"
            onClick={() => appendBlocks([paragraph("Type / to add another block.")], "Text block")}
            className="rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
          >
            + Text
          </button>
          <button
            type="button"
            onClick={() => appendBlocks([taskList("New to-do item")], "To-do block")}
            className="rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
          >
            + To-do
          </button>
          <button
            type="button"
            onClick={() => setOpenPanel("templates")}
            className="rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
          >
            Templates
          </button>
        </div>

        <Editor
          key={editorRevision}
          initialValue={editorContent}
          onChange={(value) => {
            setEditorContent(value);
            markEdited();
          }}
        />
      </main>

      <div className="fixed bottom-5 left-1/2 z-30 hidden w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-white/[0.08] bg-[#242424]/95 px-3 py-2 shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:block">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="px-2">Get started with</span>
          <StartChip
            icon={Bot}
            label="Ask AI"
            onClick={() => {
              window.dispatchEvent(new Event("noteflow:open-ai"));
              showToast("Opening NoteFlow AI");
            }}
          />
          <StartChip icon={Sparkles} label="AI Meeting Notes" onClick={insertMeetingNotes} />
          <StartChip icon={Database} label="Database" onClick={insertDatabase} />
          <StartChip icon={FileText} label="Form" onClick={insertForm} />
          <StartChip icon={FileText} label="Templates" onClick={() => setOpenPanel("templates")} />
          <button
            type="button"
            onClick={() => setOpenPanel("quickMore")}
            className="grid size-8 place-items-center rounded-full bg-white/[0.06] text-zinc-400 transition hover:bg-white/[0.1] hover:text-zinc-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {openPanel ? (
        <PanelShell title={panelTitle(openPanel)} onClose={closePanel}>
          {openPanel === "icon" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
              {iconChoices.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    setPageIcon(icon);
                    markEdited();
                    showToast("Icon updated");
                    closePanel();
                  }}
                  className="emoji grid size-11 place-items-center rounded-lg bg-white/[0.05] text-xl transition hover:bg-white/[0.1]"
                >
                  {icon}
                </button>
              ))}
              </div>
              {pageIcon ? (
                <button
                  type="button"
                  onClick={() => {
                    setPageIcon("");
                    markEdited();
                    showToast("Icon removed");
                    closePanel();
                  }}
                  className="w-full rounded-lg border border-white/[0.08] px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  Remove icon
                </button>
              ) : null}
            </div>
          ) : null}

          {openPanel === "cover" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-2">
                {coverChoices.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setCoverColor(color);
                      setIsCoverVisible(true);
                      markEdited();
                      showToast("Cover updated");
                    }}
                    className="h-10 rounded-lg border border-white/[0.08] transition hover:scale-105"
                    style={{ backgroundColor: color }}
                    aria-label={`Use cover ${color}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCoverVisible(false);
                  markEdited();
                  closePanel();
                  showToast("Cover removed");
                }}
                className="w-full rounded-lg border border-white/[0.08] px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06]"
              >
                Remove cover
              </button>
            </div>
          ) : null}

          {openPanel === "comment" ? (
            <div className="space-y-3">
              <textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Add a comment..."
                className="min-h-24 w-full resize-none rounded-lg border border-white/[0.08] bg-[#1d1d1d] p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={addComment}
                disabled={!commentDraft.trim()}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                Add comment
              </button>
              {comments.length ? (
                <div className="space-y-2 border-t border-white/[0.06] pt-3">
                  {comments.map((comment, index) => (
                    <p key={`${comment}-${index}`} className="rounded-lg bg-white/[0.04] p-3 text-sm text-zinc-300">
                      {comment}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No comments yet.</p>
              )}
            </div>
          ) : null}

          {openPanel === "share" ? (
            <div className="space-y-3 text-sm">
              <div className="grid gap-2">
                <ShareOption
                  active={shareAccess === "Restricted"}
                  icon={EyeOff}
                  label="Restricted"
                  detail="Only you can open this page."
                  onClick={() => updateShareAccess("Restricted")}
                />
                <ShareOption
                  active={shareAccess === "Published"}
                  icon={Globe2}
                  label="Published"
                  detail="Anyone with the link can preview it later."
                  onClick={() => updateShareAccess("Published")}
                />
              </div>
              <button
                type="button"
                onClick={copyPageLink}
                className="flex w-full items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-2 text-left text-zinc-200 transition hover:bg-white/[0.08]"
              >
                <Copy className="size-4 text-zinc-500" />
                Copy page link
              </button>
              <div className="rounded-lg border border-white/[0.06] p-3 text-xs text-zinc-500">
                Invite and permission controls are local UI for now.
              </div>
            </div>
          ) : null}

          {openPanel === "more" ? (
            <div className="space-y-1">
              <PanelAction icon={Copy} label="Duplicate page" onClick={duplicatePageLocally} />
              <PanelAction icon={Download} label="Export Markdown" onClick={exportMarkdown} />
              <PanelAction
                icon={Wand2}
                label="Move to..."
                onClick={() => {
                  closePanel();
                  setIsPageInfoOpen(true);
                  showToast("Choose a destination after persistence lands");
                }}
              />
              <PanelAction
                icon={Trash2}
                label="Move to trash"
                danger
                onClick={() => {
                  setIsArchived(true);
                  closePanel();
                  showToast("Moved to trash locally");
                }}
              />
            </div>
          ) : null}

          {openPanel === "templates" ? (
            <div className="space-y-1">
              {["Class notes", "Project brief", "Daily review"].map((template) => (
                <PanelAction
                  key={template}
                  icon={FileText}
                  label={template}
                  onClick={() => insertTemplate(template)}
                />
              ))}
            </div>
          ) : null}

          {openPanel === "quickMore" ? (
            <div className="space-y-1">
              <PanelAction icon={FileText} label="Insert class notes template" onClick={() => insertTemplate("Class notes")} />
              <PanelAction icon={Database} label="Insert database scaffold" onClick={insertDatabase} />
              <PanelAction icon={Sparkles} label="Insert meeting notes" onClick={insertMeetingNotes} />
            </div>
          ) : null}
        </PanelShell>
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/[0.08] bg-[#2b2b2b] px-4 py-2 text-sm font-medium text-zinc-100 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function panelTitle(panel: PanelKind) {
  switch (panel) {
    case "icon":
      return "Choose icon";
    case "cover":
      return "Cover";
    case "comment":
      return "Comments";
    case "share":
      return "Share";
    case "more":
      return "More actions";
    case "templates":
      return "Templates";
    case "quickMore":
      return "More blocks";
    default:
      return "";
  }
}

function IconButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-md transition hover:bg-white/[0.06] hover:text-zinc-100 ${
        active ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarTextButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition hover:bg-white/[0.06] hover:text-zinc-300"
    >
      {children}
    </button>
  );
}

function StartChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 font-semibold text-zinc-100 transition hover:bg-white/[0.1]"
    >
      <Icon className="size-3.5 text-zinc-400" />
      {label}
    </button>
  );
}

function EmptyStarterButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-zinc-100"
    >
      <Icon className="size-4 text-zinc-500" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ShareOption({
  active,
  detail,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition ${
        active
          ? "border-zinc-400/30 bg-white/[0.08] text-zinc-100"
          : "border-white/[0.06] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-zinc-500" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{detail}</span>
      </span>
      {active ? <Check className="mt-0.5 size-4 shrink-0 text-zinc-200" /> : null}
    </button>
  );
}

function PanelShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed right-4 top-14 z-[65] w-[min(360px,calc(100vw-2rem))] rounded-lg border border-white/[0.08] bg-[#242424]/98 p-3 text-zinc-100 shadow-[0_24px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-100"
        >
          <X className="size-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

function PanelAction({
  danger,
  icon: Icon,
  label,
  onClick,
}: {
  danger?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
        danger ? "text-red-300" : "text-zinc-300"
      }`}
    >
      <Icon className="size-4 text-zinc-500" />
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.05] py-2">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-36 truncate text-zinc-300">{value}</span>
    </div>
  );
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "untitled"
  );
}

function toMarkdown(content: JSONContent, title: string) {
  const body = (content.content ?? [])
    .map((node) => renderMarkdownNode(node))
    .filter(Boolean)
    .join("\n\n");

  return `# ${title}\n\n${body}\n`;
}

function renderMarkdownNode(node: JSONContent): string {
  const text = renderInlineText(node);

  switch (node.type) {
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 2))} ${text}`;
    case "paragraph":
      return text;
    case "bulletList":
      return (node.content ?? [])
        .map((item) => `- ${renderInlineText(item)}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((item, index) => `${index + 1}. ${renderInlineText(item)}`)
        .join("\n");
    case "taskList":
      return (node.content ?? [])
        .map((item) => `- [${item.attrs?.checked ? "x" : " "}] ${renderInlineText(item)}`)
        .join("\n");
    case "blockquote":
      return `> ${text}`;
    case "codeBlock":
      return `\`\`\`\n${text}\n\`\`\``;
    case "horizontalRule":
      return "---";
    default:
      return text;
  }
}

function renderInlineText(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map((child) => renderInlineText(child)).join("");
}
