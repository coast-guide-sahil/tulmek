"use client";

import { use } from "react";
import { Dashboard } from "@/components/progress/dashboard";
import { getDashboardSections } from "@/lib/progress/content";

const sectionsPromise = getDashboardSections();

export default function ProgressPage() {
  const sections = use(sectionsPromise);
  return <Dashboard sections={sections} />;
}
