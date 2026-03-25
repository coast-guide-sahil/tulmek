"use client";

import { TrackerPage } from "@/components/progress/tracker-page";
import { getHldContent } from "@/lib/progress/content";

const { items, groups, groupLabels, difficulties } = getHldContent();

export default function HldPage() {
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
