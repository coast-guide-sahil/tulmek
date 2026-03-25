"use client";

import { TrackerPage } from "@/components/progress/tracker-page";
import { getBehavioralContent } from "@/lib/progress/content";

const { items, groups, groupLabels, difficulties } = getBehavioralContent();

export default function BehavioralPage() {
  return (
    <TrackerPage
      title="Behavioral Questions"
      category="behavioral"
      items={items}
      groups={groups}
      groupLabels={groupLabels}
      difficulties={difficulties}
    />
  );
}
