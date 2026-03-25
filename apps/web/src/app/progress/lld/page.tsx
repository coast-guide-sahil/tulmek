"use client";

import { TrackerPage } from "@/components/progress/tracker-page";
import { getLldContent } from "@/lib/progress/content";

const { items, groups, groupLabels, difficulties } = getLldContent();

export default function LldPage() {
  return (
    <TrackerPage
      title="Low-Level Design"
      category="lld"
      items={items}
      groups={groups}
      groupLabels={groupLabels}
      difficulties={difficulties}
    />
  );
}
