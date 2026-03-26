"use client";

import { use } from "react";
import { TrackerPage } from "@/components/progress/tracker-page";
import { getBehavioralContent } from "@/lib/progress/content";

const contentPromise = getBehavioralContent();

export default function BehavioralPage() {
  const { items, groups, groupLabels, difficulties } = use(contentPromise);
  return (
    <TrackerPage
      title="Behavioral Questions"
      items={items}
      groups={groups}
      groupLabels={groupLabels}
      difficulties={difficulties}
    />
  );
}
