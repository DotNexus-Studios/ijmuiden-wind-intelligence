"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { BarChart3, Database, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/i18n/nl";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavMenuProps {
  className?: string;
}

export function NavMenu({ className }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const overlay = open ? (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white"
      style={{ minHeight: "100dvh", width: "100vw" }}
      role="dialog"
      aria-modal="true"
      aria-label={UI.menuTitle}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
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

      <p className="text-[11px] text-center text-slate-400 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 shrink-0">
        {UI.menuFooter}
      </p>
    </div>
  ) : null;

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
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
