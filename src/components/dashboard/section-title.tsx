import type * as React from "react";

export function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 text-zinc-400">
      <Icon className="size-4" />
      <h2 className="text-base font-medium">{label}</h2>
    </div>
  );
}
