import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h2>
      {action}
    </div>
  );
}
