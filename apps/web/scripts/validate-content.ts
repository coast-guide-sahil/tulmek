/**
 * Content validation script — runs Zod schemas against all JSON content files.
 * Usage: npx tsx scripts/validate-content.ts
 * Add to CI: pnpm validate-content
 */

import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  dsaPatternFileSchema,
  hldFileSchema,
  lldFileSchema,
  behavioralFileSchema,
} from "../src/content/schema";
import {
  feedFileSchema,
  feedMetadataSchema,
} from "../src/content/hub-schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "../src/content");

let errors = 0;
let totalItems = 0;

function validate(
  filePath: string,
  schema: { parse: (data: unknown) => unknown },
  label: string,
) {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const result = schema.parse(data);
    const count = Array.isArray(result) ? result.length : 0;
    totalItems += count;
    console.log(`  ✓ ${label} — ${count} items`);
  } catch (err) {
    errors++;
    console.error(`  ✗ ${label} — FAILED`);
    if (err instanceof Error) {
      console.error(`    ${err.message.slice(0, 500)}`);
    }
  }
}

console.log("Validating content...\n");

// DSA files
console.log("DSA patterns:");
const dsaDir = join(CONTENT_DIR, "dsa");
const dsaFiles = readdirSync(dsaDir).filter((f) => f.endsWith(".json"));
for (const file of dsaFiles.sort()) {
  validate(join(dsaDir, file), dsaPatternFileSchema, file);
}

// HLD
console.log("\nHLD:");
validate(join(CONTENT_DIR, "hld.json"), hldFileSchema, "hld.json");

// LLD
console.log("\nLLD:");
validate(join(CONTENT_DIR, "lld.json"), lldFileSchema, "lld.json");

// Behavioral
console.log("\nBehavioral:");
validate(
  join(CONTENT_DIR, "behavioral.json"),
  behavioralFileSchema,
  "behavioral.json",
);

// Hub content (lives in @tulmek/content package)
console.log("\nHub feed:");
const hubDir = join(__dirname, "../../../packages/content/src/hub");
validate(join(hubDir, "feed.json"), feedFileSchema, "feed.json");
validate(join(hubDir, "metadata.json"), feedMetadataSchema, "metadata.json");

// Summary
console.log(`\n${"─".repeat(40)}`);
console.log(`Total items: ${totalItems}`);
if (errors > 0) {
  console.error(`\n✗ ${errors} file(s) failed validation`);
  process.exit(1);
} else {
  console.log("✓ All content files valid");
}
