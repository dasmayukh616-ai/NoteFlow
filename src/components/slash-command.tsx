import { Command, createSuggestionItems, renderItems } from "novel";
import type { SuggestionItem } from "novel";
import {
  AtSign,
  BarChart3,
  Bell,
  BookOpen,
  Braces,
  CalendarDays,
  CheckSquare,
  Columns3,
  Copy,
  Database,
  File,
  FileAudio,
  FileImage,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  KanbanSquare,
  LayoutDashboard,
  Link2,
  List,
  ListOrdered,
  MessageSquare,
  Minus,
  Palette,
  PanelTop,
  Paperclip,
  Pilcrow,
  Quote,
  Sigma,
  Smile,
  Sparkles,
  Table2,
  Text,
  Trash2,
  Video,
  Wand2,
} from "lucide-react";

type CommandProps = Parameters<NonNullable<SuggestionItem["command"]>>[0];

const insertScaffold =
  (title: string, detail: string) =>
  ({ editor, range }: CommandProps) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: title,
              marks: [{ type: "bold" }],
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: detail }],
        },
      ])
      .run();
  };

const setParagraph = ({ editor, range }: CommandProps) => {
  editor.chain().focus().deleteRange(range).setNode("paragraph").run();
};

export const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Basic block: start writing with plain text.",
    searchTerms: ["plain", "paragraph"],
    icon: <Text size={18} />,
    command: setParagraph,
  },
  {
    title: "Plain text",
    description: "Basic block: a simple paragraph block.",
    searchTerms: ["text", "paragraph"],
    icon: <Pilcrow size={18} />,
    command: setParagraph,
  },
  {
    title: "Page",
    description: "Basic block: create a new nested page.",
    searchTerms: ["new page", "subpage"],
    icon: <FileText size={18} />,
    command: insertScaffold(
      "New nested page",
      "This placeholder will become a real page link once workspace pages are persistent.",
    ),
  },
  {
    title: "Bulleted list",
    description: "Basic block: create a simple bullet list.",
    searchTerms: ["bullet", "unordered", "point"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Basic block: create an ordered list.",
    searchTerms: ["num", "ordered", "list"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do list",
    description: "Basic block: track tasks with checkboxes.",
    searchTerms: ["todo", "task", "check", "checkbox"],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Toggle list",
    description: "Basic block: collapsible content scaffold.",
    searchTerms: ["toggle", "collapse", "accordion"],
    icon: <PanelTop size={18} />,
    command: insertScaffold(
      "Toggle list",
      "Collapsed/expanded toggle behavior will be wired as a custom block.",
    ),
  },
  {
    title: "Divider",
    description: "Basic block: visually separate sections.",
    searchTerms: ["div", "line", "separator"],
    icon: <Minus size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Quote",
    description: "Basic block: emphasize a quote or callout line.",
    searchTerms: ["blockquote", "quote"],
    icon: <Quote size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Heading 1",
    description: "Basic block: large section heading.",
    searchTerms: ["h1", "#", "title", "large"],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Basic block: medium section heading.",
    searchTerms: ["h2", "##", "subtitle", "medium"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Basic block: small section heading.",
    searchTerms: ["h3", "###", "subtitle", "small"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Link to page",
    description: "Basic block: link an existing or new page.",
    searchTerms: ["link", "page link", "[[", "+"],
    icon: <Link2 size={18} />,
    command: insertScaffold(
      "Page link",
      "Searchable page links will connect here after workspace page indexing lands.",
    ),
  },
  {
    title: "Mention",
    description: "Inline: mention a person, page, or date.",
    searchTerms: ["mention", "person", "page", "@"],
    icon: <AtSign size={18} />,
    command: insertScaffold("@Mention", "People, page, and date mentions will resolve from workspace data."),
  },
  {
    title: "Date",
    description: "Inline: add a date or timestamp.",
    searchTerms: ["date", "timestamp", "calendar"],
    icon: <CalendarDays size={18} />,
    command: insertScaffold("Today", "Date picker integration will attach reminders and due dates."),
  },
  {
    title: "Reminder",
    description: "Inline: add a reminder.",
    searchTerms: ["remind", "alert", "notification"],
    icon: <Bell size={18} />,
    command: insertScaffold("Reminder", "Reminder scheduling will connect to notifications later."),
  },
  {
    title: "Inline equation",
    description: "Inline: add a TeX equation.",
    searchTerms: ["equation", "math", "latex", "tex"],
    icon: <Sigma size={18} />,
    command: insertScaffold("Inline equation", "Type TeX here, for example: E = mc^2."),
  },
  {
    title: "Emoji",
    description: "Inline: insert an Apple emoji.",
    searchTerms: ["emoji", "smile"],
    icon: <Smile size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent("✨").run();
    },
  },
  {
    title: "Image",
    description: "Media: upload or embed an image.",
    searchTerms: ["image", "photo", "unsplash"],
    icon: <FileImage size={18} />,
    command: insertScaffold("Image block", "Image upload and drag/drop media handling will attach here."),
  },
  {
    title: "PDF",
    description: "Media: embed a PDF inline.",
    searchTerms: ["pdf", "document"],
    icon: <File size={18} />,
    command: insertScaffold("PDF block", "PDF previews will render inside this media block."),
  },
  {
    title: "Bookmark",
    description: "Media: create a rich web bookmark.",
    searchTerms: ["book", "bookmark", "url"],
    icon: <BookOpen size={18} />,
    command: insertScaffold("Web bookmark", "Paste a URL here to generate a bookmark preview."),
  },
  {
    title: "Video",
    description: "Media: upload or embed video.",
    searchTerms: ["video", "youtube"],
    icon: <Video size={18} />,
    command: insertScaffold("Video block", "Video embeds will support uploaded files and provider URLs."),
  },
  {
    title: "Audio",
    description: "Media: upload or embed audio.",
    searchTerms: ["audio", "sound"],
    icon: <FileAudio size={18} />,
    command: insertScaffold("Audio block", "Audio waveform/player support will attach here."),
  },
  {
    title: "Code",
    description: "Media: create a code block.",
    searchTerms: ["code", "snippet"],
    icon: <Braces size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "File",
    description: "Media: upload a file or create an embed.",
    searchTerms: ["file", "attachment", "upload"],
    icon: <Paperclip size={18} />,
    command: insertScaffold("File attachment", "File upload and storage will attach to this block."),
  },
  {
    title: "Embed",
    description: "Media: embed supported third-party content.",
    searchTerms: ["embed", "iframe", "third party"],
    icon: <Braces size={18} />,
    command: insertScaffold("Embed block", "Paste a supported service URL to render an embed."),
  },
  {
    title: "Duplicate block",
    description: "Advanced: duplicate the current block scaffold.",
    searchTerms: ["duplicate", "copy"],
    icon: <Copy size={18} />,
    command: insertScaffold("Duplicated block", "Selection-aware duplication will use the block action menu."),
  },
  {
    title: "Move to",
    description: "Advanced: move this block to another page.",
    searchTerms: ["moveto", "move", "page"],
    icon: <Wand2 size={18} />,
    command: insertScaffold("Move to page", "A destination picker will move selected blocks between pages."),
  },
  {
    title: "Delete",
    description: "Advanced: delete the current block.",
    searchTerms: ["delete", "trash", "remove"],
    icon: <Trash2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
    },
  },
  {
    title: "Table of contents",
    description: "Advanced: generate a heading outline.",
    searchTerms: ["toc", "outline", "contents"],
    icon: <List size={18} />,
    command: insertScaffold("Table of contents", "This will list page headings once heading indexing is wired."),
  },
  {
    title: "Button",
    description: "Advanced: create a button/template action.",
    searchTerms: ["button", "template button"],
    icon: <PanelTop size={18} />,
    command: insertScaffold("Button", "Template actions will run from this block."),
  },
  {
    title: "Template",
    description: "Advanced: create a template button.",
    searchTerms: ["template", "button"],
    icon: <PanelTop size={18} />,
    command: insertScaffold("Template button", "Reusable page templates will be generated from here."),
  },
  {
    title: "Breadcrumbs",
    description: "Advanced: insert page breadcrumbs.",
    searchTerms: ["bread", "breadcrumb", "path"],
    icon: <Link2 size={18} />,
    command: insertScaffold("Dashboard / Notes / Current page", "Breadcrumbs will reflect real workspace hierarchy."),
  },
  {
    title: "Math equation",
    description: "Advanced: add a block TeX equation.",
    searchTerms: ["math", "latex", "equation"],
    icon: <Sigma size={18} />,
    command: insertScaffold("Block equation", "\\int_0^1 x^2 dx = 1/3"),
  },
  {
    title: "Database",
    description: "Database: create an inline database.",
    searchTerms: ["database", "table", "data"],
    icon: <Database size={18} />,
    command: insertScaffold("Database", "Tables, boards, calendars, lists, galleries, and timelines will mount here."),
  },
  {
    title: "Table",
    description: "Database view: table layout.",
    searchTerms: ["table", "database"],
    icon: <Table2 size={18} />,
    command: insertScaffold("Table view", "Database properties, filtering, and sorting will appear here."),
  },
  {
    title: "Board",
    description: "Database view: Kanban-style layout.",
    searchTerms: ["board", "kanban"],
    icon: <KanbanSquare size={18} />,
    command: insertScaffold("Board view", "Cards will group by status, priority, or another property."),
  },
  {
    title: "Calendar",
    description: "Database view: calendar layout.",
    searchTerms: ["calendar", "date", "database"],
    icon: <CalendarDays size={18} />,
    command: insertScaffold("Calendar view", "Date-based database items will appear on this calendar."),
  },
  {
    title: "Gallery",
    description: "Database view: visual cards.",
    searchTerms: ["gallery", "cards"],
    icon: <FileImage size={18} />,
    command: insertScaffold("Gallery view", "Cards will render with cover images and selected properties."),
  },
  {
    title: "List database",
    description: "Database view: compact list.",
    searchTerms: ["list", "database"],
    icon: <List size={18} />,
    command: insertScaffold("List view", "Rows will show database pages and visible properties."),
  },
  {
    title: "Timeline",
    description: "Database view: timeline layout.",
    searchTerms: ["timeline", "date range"],
    icon: <CalendarDays size={18} />,
    command: insertScaffold("Timeline view", "Date ranges will render across a horizontal timeline."),
  },
  {
    title: "Chart",
    description: "Database view: bar, line, donut, or number chart.",
    searchTerms: ["chart", "bar", "line", "donut", "number"],
    icon: <BarChart3 size={18} />,
    command: insertScaffold("Chart", "Choose vertical bar, horizontal bar, line, donut, or number chart."),
  },
  {
    title: "Dashboard",
    description: "Database view: multi-widget dashboard.",
    searchTerms: ["dash", "dashboard", "widgets"],
    icon: <LayoutDashboard size={18} />,
    command: insertScaffold("Dashboard", "Tables, boards, calendars, charts, and timelines can live here."),
  },
  {
    title: "Columns",
    description: "Layout: create a column scaffold.",
    searchTerms: ["columns", "layout", "side by side"],
    icon: <Columns3 size={18} />,
    command: insertScaffold("Two-column layout", "Drag blocks beside each other here once custom columns are wired."),
  },
  {
    title: "Turn into",
    description: "Transform: convert this block to another type.",
    searchTerms: ["turn", "transform", "convert"],
    icon: <Wand2 size={18} />,
    command: insertScaffold("Turn into", "The transform menu will expose text, quote, callout, page, and list options."),
  },
  {
    title: "Turn into bullet",
    description: "Transform: convert to a bullet list.",
    searchTerms: ["turnbullet", "bullet"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Turn into callout",
    description: "Transform: convert to a callout block.",
    searchTerms: ["turncallout", "callout"],
    icon: <Sparkles size={18} />,
    command: insertScaffold("Callout", "Use this space for an important note, warning, or reminder."),
  },
  {
    title: "Comment",
    description: "Action: add a comment to this block.",
    searchTerms: ["comment", "discussion"],
    icon: <MessageSquare size={18} />,
    command: insertScaffold("Comment", "Threaded block comments will attach here."),
  },
  {
    title: "Text color",
    description: "Color: apply gray, brown, orange, yellow, green, blue, purple, pink, or red.",
    searchTerms: ["red", "blue", "gray", "default", "color"],
    icon: <Palette size={18} />,
    command: insertScaffold("Color menu", "Supported text colors: default, gray, brown, orange, yellow, green, blue, purple, pink, red."),
  },
  {
    title: "Background color",
    description: "Color: apply a block background highlight.",
    searchTerms: ["background", "highlight", "blue background", "gray background"],
    icon: <Highlighter size={18} />,
    command: insertScaffold(
      "Background color menu",
      "Supported backgrounds: gray, brown, orange, yellow, green, blue, purple, pink, red.",
    ),
  },
  {
    title: "AI Meeting Notes",
    description: "AI: create meeting notes with /meet.",
    searchTerms: ["meet", "ai meeting", "meeting notes"],
    icon: <Sparkles size={18} />,
    command: insertScaffold(
      "AI Meeting Notes",
      "Meeting capture, transcript summaries, action items, and follow-ups will be generated here.",
    ),
  },
]);

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
