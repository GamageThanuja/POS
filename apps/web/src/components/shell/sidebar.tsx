"use client";

import { cn } from "@pos/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sidebar-foreground/80 flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
              active && "bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
