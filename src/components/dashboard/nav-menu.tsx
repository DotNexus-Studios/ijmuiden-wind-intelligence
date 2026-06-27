"use client";

import Link from "next/link";
import { BarChart3, Database, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/i18n/nl";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavMenuProps {
  className?: string;
}

export function NavMenu({ className }: NavMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("text-muted-foreground", className)}
        aria-label={UI.menuOpen}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{UI.appTitle}</p>
              <p className="text-sm text-muted-foreground">{UI.menuTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={UI.menuClose}
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">{UI.navDashboard}</p>
                <p className="text-xs text-slate-500">{UI.menuDashboardHint}</p>
              </div>
            </Link>

            <Link
              href="/intelligence"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
            >
              <Database className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">{UI.dataIntelligence}</p>
                <p className="text-xs text-slate-500">{UI.menuIntelligenceHint}</p>
              </div>
            </Link>
          </nav>

          <p className="text-[11px] text-center text-slate-400 pb-6 px-4 safe-bottom">{UI.menuFooter}</p>
        </div>
      )}
    </>
  );
}
