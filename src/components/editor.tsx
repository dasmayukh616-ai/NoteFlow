"use client";

import type React from "react";
import { useMemo, useState } from "react";
import {
  Color,
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  GlobalDragHandle,
  HighlightExtension,
  HorizontalRule,
  type JSONContent,
  Mathematics,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapLink,
  TiptapUnderline,
  handleCommandNavigation,
} from "novel";
import {
  Bold,
  Code2,
  Highlighter,
  Italic,
  Link2,
  Palette,
  Strikethrough,
  Underline,
} from "lucide-react";

import { slashCommand, suggestionItems } from "./slash-command";

interface EditorProps {
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
}

function getCommandMeta(description?: string) {
  const [category, ...detailParts] = (description ?? "").split(":");

  if (!detailParts.length) {
    return { category: "Block", detail: description ?? "" };
  }

  return {
    category: category.trim(),
    detail: detailParts.join(":").trim(),
  };
}

export default function Editor({ initialValue, onChange }: EditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(initialValue);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        horizontalRule: false,
      }),
      TiptapLink.configure({
        HTMLAttributes: {
          class: "text-zinc-100 underline decoration-zinc-500 underline-offset-4",
        },
        openOnClick: false,
      }),
      TiptapUnderline,
      TextStyle,
      Color,
      HighlightExtension,
      HorizontalRule,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Mathematics,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? `Heading ${node.attrs.level}`
            : "Type / for blocks",
        includeChildren: true,
      }),
      GlobalDragHandle.configure({
        dragHandleWidth: 26,
        scrollTreshold: 120,
        excludedTags: ["pre"],
      }),
      slashCommand,
    ],
    [],
  );

  return (
    <EditorRoot>
      <EditorContent
        className="noteflow-editor-shell"
        initialContent={content}
        immediatelyRender={false}
        extensions={extensions}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          attributes: {
            class:
              "noteflow-editor ProseMirror min-h-[360px] max-w-none text-[16px] leading-7 text-zinc-300 outline-none",
          },
        }}
        onUpdate={({ editor }: { editor: EditorInstance }) => {
          const json = editor.getJSON();
          setContent(json);
          onChange?.(json);
        }}
      >
        <EditorBubble
          tippyOptions={{ placement: "top", duration: 120 }}
          className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#262626]/95 p-1 text-zinc-200 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <BubbleButton label="Bold" onSelect={(editor) => editor.chain().focus().toggleBold().run()}>
            <Bold className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Italic"
            onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Underline"
            onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Strike"
            onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Code"
            onSelect={(editor) => editor.chain().focus().toggleCode().run()}
          >
            <Code2 className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Link"
            onSelect={(editor) => {
              const previousUrl = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Paste a link", previousUrl ?? "https://");

              if (url === null) return;
              if (url.trim() === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }

              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
          >
            <Link2 className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Gray text"
            onSelect={(editor) => editor.chain().focus().setColor("#a1a1aa").run()}
          >
            <Palette className="size-4" />
          </BubbleButton>
          <BubbleButton
            label="Highlight"
            onSelect={(editor) =>
              editor.chain().focus().toggleHighlight({ color: "rgba(113, 113, 122, 0.28)" }).run()
            }
          >
            <Highlighter className="size-4" />
          </BubbleButton>
        </EditorBubble>

        <EditorCommand className="z-[120] h-auto max-h-[430px] w-[min(390px,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-white/[0.09] bg-[#242424]/98 p-1.5 text-zinc-100 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all">
          <EditorCommandEmpty className="px-3 py-6 text-center text-sm text-zinc-500">
            No matching command
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => {
              const commandMeta = getCommandMeta(item.description);

              return (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm outline-none transition hover:bg-white/[0.06] aria-selected:bg-white/[0.08]"
                  key={item.title}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition group-hover:border-white/[0.14] group-hover:bg-white/[0.07] group-hover:text-zinc-100">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-zinc-100">
                        {item.title}
                      </p>
                      <span className="shrink-0 rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
                        {commandMeta.category}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                      {commandMeta.detail}
                    </p>
                  </div>
                </EditorCommandItem>
              );
            })}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  );
}

function BubbleButton({
  children,
  label,
  onSelect,
}: {
  children: React.ReactNode;
  label: string;
  onSelect: (editor: EditorInstance) => void;
}) {
  return (
    <EditorBubbleItem
      aria-label={label}
      title={label}
      onSelect={onSelect}
      className="grid size-8 cursor-pointer place-items-center rounded-md text-zinc-300 transition hover:bg-white/[0.08] hover:text-zinc-50 aria-selected:bg-white/[0.1] aria-selected:text-zinc-50"
    >
      {children}
    </EditorBubbleItem>
  );
}
