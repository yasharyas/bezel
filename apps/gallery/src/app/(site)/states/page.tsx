import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { readPackageDoc } from "@/lib/docs";

export const metadata: Metadata = {
  title: "States",
  description:
    "The eight states every interactive Bezel primitive is specified against, and an audit of which components render each one.",
  alternates: { canonical: "/states" },
};

export default function StatesPage() {
  return <DocPage source={readPackageDoc("STATES.md")} file="STATES.md" />;
}
