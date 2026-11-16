import type { Metadata } from "next";
import { ModulePage } from "@/components/shell/module-page";

export const metadata: Metadata = { title: "POS" };

export default function Page() {
  return <ModulePage href="/pos" />;
}
