import type { CategorizedItem, ContentCategory } from "../domain/progress";

/**
 * Port for loading content items.
 *
 * Adapters: StaticContentSource (JSON files), CmsContentSource (Sanity/Contentful), etc.
 * Swap the adapter to change where content comes from — zero UI changes needed.
 */
export interface ContentSource {
  getDsaContent(): Promise<ContentSection>;
  getHldContent(): Promise<ContentSection>;
  getLldContent(): Promise<ContentSection>;
  getBehavioralContent(): Promise<ContentSection>;
  getAllContent(): Promise<CategorizedItem[]>;
  getDashboardSections(): Promise<DashboardSection[]>;
}

export interface ContentSection {
  readonly items: CategorizedItem[];
  readonly groups: readonly string[];
  readonly groupLabels: Record<string, string>;
  readonly difficulties: readonly string[];
}

export interface DashboardSection {
  readonly category: ContentCategory;
  readonly label: string;
  readonly href: string;
  readonly items: readonly CategorizedItem[];
  readonly description: string;
}
