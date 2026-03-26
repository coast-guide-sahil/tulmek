"use client";

import { use } from "react";
import { TrackerPage } from "@/components/progress/tracker-page";
import { getLldContent } from "@/lib/progress/content";

const contentPromise = getLldContent();

export default function LldPage() {
  const { items, groups, groupLabels, difficulties } = use(contentPromise);
  return (
    <TrackerPage
      title="Low-Level Design"
      items={items}
      groups={groups}
      groupLabels={groupLabels}
      difficulties={difficulties}
    />
  );
}
