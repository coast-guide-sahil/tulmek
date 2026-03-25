"use client";

import { TrackerPage } from "@/components/progress/tracker-page";
import { getDsaContent } from "@/lib/progress/content";

const { items, groups, groupLabels, difficulties } = getDsaContent();

export default function DsaPage() {
  return (
    <TrackerPage
      title="DSA Problems"
      category="dsa"
      items={items}
      groups={groups}
      groupLabels={groupLabels}
      difficulties={difficulties}
    />
  );
}
