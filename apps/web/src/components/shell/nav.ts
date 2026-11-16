import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Landmark,
  type LucideIcon,
  Settings,
  ShoppingCart,
  Truck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Milestone(s) in TODO.md that deliver this module. */
  milestone: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Today's sales, payment mix, low stock and cash position.",
    milestone: "M9",
  },
  {
    href: "/pos",
    label: "POS",
    icon: ShoppingCart,
    description: "Counter and table sales, shifts, payments, receipts, refunds; works offline.",
    milestone: "M5–M6",
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Boxes,
    description: "Item master, stock ledger, adjustments, transfers and counts.",
    milestone: "M3–M4",
  },
  {
    href: "/purchasing",
    label: "Purchasing",
    icon: Truck,
    description: "Suppliers, purchase orders, goods received, invoices and returns.",
    milestone: "M7",
  },
  {
    href: "/finance",
    label: "Finance",
    icon: Landmark,
    description: "Chart of accounts, journals, bank reconciliation, AR/AP and statements.",
    milestone: "M4, M8",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    description: "Sales, inventory, purchasing, finance and staff reports with exports.",
    milestone: "M9",
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Settings,
    description: "Business setup, outlets, users, roles, approvals, notifications and audit log.",
    milestone: "M1–M2",
  },
];

export function navItem(href: string): NavItem {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (!item) throw new Error(`Unknown nav item ${href}`);
  return item;
}
