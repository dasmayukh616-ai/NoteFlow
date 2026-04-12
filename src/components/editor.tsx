"use client";

import React, { useState } from "react";
import { 
  EditorRoot, 
  EditorContent, 
  EditorInstance, 
  JSONContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  handleCommandNavigation
} from "novel";
import { slashCommand, suggestionItems } from "./slash-command";

interface EditorProps {
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
}

export default function Editor({ initialValue, onChange }: EditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(initialValue);

  return (
    <EditorRoot>
      <EditorContent
        initialContent={content}
        extensions={[slashCommand]}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          attributes: {
            class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
          },
        }}
        onUpdate={({ editor }: { editor: EditorInstance }) => {
          const json = editor.getJSON();
          setContent(json);
          onChange?.(json);
        }}
      >
        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white dark:bg-stone-900 px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-stone-500">
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex w-full cursor-pointer items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800 focus:bg-stone-100 dark:focus:bg-stone-800 outline-none"
                key={item.title}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-stone-900 dark:text-stone-100">{item.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  );
}
