import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProgressShell } from "@/components/progress/progress-shell";
import { APP_NAME } from "@tulmek/config/constants";

export const metadata: Metadata = {
  title: `Progress Tracker — ${APP_NAME}`,
  description:
    "Track your DSA, System Design, LLD, and Behavioral interview preparation progress. 690 items across 4 categories.",
  alternates: { canonical: "/progress" },
  openGraph: {
    title: `Progress Tracker — ${APP_NAME}`,
    description: "Track interview prep across 690 items. DSA, System Design, LLD, Behavioral.",
  },
};

export default function ProgressLayout({ children }: { children: ReactNode }) {
  return <ProgressShell>{children}</ProgressShell>;
}
