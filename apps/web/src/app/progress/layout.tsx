import type { ReactNode } from "react";
import { ProgressShell } from "@/components/progress/progress-shell";

export const metadata = {
  title: "Progress Tracker — TULMEK",
  description:
    "Track your DSA, System Design, and Behavioral interview preparation progress",
};

export default function ProgressLayout({ children }: { children: ReactNode }) {
  return <ProgressShell>{children}</ProgressShell>;
}
