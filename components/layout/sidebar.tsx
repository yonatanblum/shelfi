"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload } from "lucide-react";

import { commonContent } from "@/config/content";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: ROUTES.dashboard,
    label: commonContent.nav.dashboard,
    icon: LayoutDashboard,
  },
  {
    href: ROUTES.upload,
    label: commonContent.nav.upload,
    icon: Upload,
  },
] as const;

type SidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r-2 border-foreground bg-card",
        className,
      )}
    >
      <div className="border-b-2 border-foreground px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {commonContent.tagline}
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">
          {commonContent.appName}
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === ROUTES.dashboard
              ? pathname === ROUTES.dashboard
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "brutal-press flex items-center gap-3 rounded-md border-2 px-4 py-3 text-sm font-semibold",
                isActive
                  ? "border-foreground bg-primary text-primary-foreground brutal-shadow-sm"
                  : "border-transparent bg-muted hover:border-foreground hover:bg-secondary",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t-2 border-foreground px-6 py-4">
        <p className="text-xs text-muted-foreground">
          {commonContent.sidebar.footer}
        </p>
      </div>
    </aside>
  );
}
