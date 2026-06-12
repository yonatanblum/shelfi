"use client";

import { Menu } from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <MobileNav
            trigger={
              <Button
                variant="outline"
                size="icon"
                className="brutal-border brutal-shadow-sm brutal-press lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" />
              </Button>
            }
          />
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <div className="hidden rounded-md border-2 border-foreground bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide md:block">
            Shelfi
          </div>
        </div>
      </div>
    </header>
  );
}
