"use client";

import { use } from "react";
import { TrackerPage } from "@/components/progress/tracker-page";
import { getDsaContent } from "@/lib/progress/content";

const contentPromise = getDsaContent();

export default function DsaPage() {
  const { items, groups, groupLabels, difficulties } = use(contentPromise);
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
