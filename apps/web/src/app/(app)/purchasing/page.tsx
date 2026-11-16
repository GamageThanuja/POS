import type { Metadata } from "next";
import { ModulePage } from "@/components/shell/module-page";

export const metadata: Metadata = { title: "Purchasing" };

export default function Page() {
  return <ModulePage href="/purchasing" />;
}
