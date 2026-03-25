"use client";

import { Dashboard } from "@/components/progress/dashboard";
import { getDashboardSections } from "@/lib/progress/content";

const sections = getDashboardSections();

export default function ProgressPage() {
  return <Dashboard sections={sections} />;
}
