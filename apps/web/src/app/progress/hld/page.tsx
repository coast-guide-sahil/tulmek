"use client";

import { use } from "react";
import { TrackerPage } from "@/components/progress/tracker-page";
import { getHldContent } from "@/lib/progress/content";

const contentPromise = getHldContent();

export default function HldPage() {
  const { items, groups, groupLabels, difficulties } = use(contentPromise);
  return (
    <TrackerPage
      title="High-Level Design"
      category="hld"
      items={items}
      groups={groups}
      groupLabels={groupLabels}
      difficulties={difficulties}
    />
  );
}
