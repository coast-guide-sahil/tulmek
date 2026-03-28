/**
 * Company display names — single source of truth.
 * Used by web, mobile, and desktop for company pages, filters, and OG images.
 */

export const COMPANY_DISPLAY = {
  google: "Google", amazon: "Amazon", meta: "Meta", apple: "Apple",
  microsoft: "Microsoft", netflix: "Netflix", uber: "Uber", airbnb: "Airbnb",
  stripe: "Stripe", coinbase: "Coinbase", nvidia: "NVIDIA", tesla: "Tesla",
  openai: "OpenAI", anthropic: "Anthropic", palantir: "Palantir",
  databricks: "Databricks", snowflake: "Snowflake", linkedin: "LinkedIn",
  salesforce: "Salesforce", oracle: "Oracle", adobe: "Adobe",
  bloomberg: "Bloomberg", jpmorgan: "JPMorgan", goldman: "Goldman Sachs",
  flipkart: "Flipkart", atlassian: "Atlassian", shopify: "Shopify",
  spotify: "Spotify", dropbox: "Dropbox", doordash: "DoorDash",
  pinterest: "Pinterest", samsung: "Samsung", ibm: "IBM",
  paypal: "PayPal", cloudflare: "Cloudflare", datadog: "Datadog",
  mongodb: "MongoDB", vercel: "Vercel", github: "GitHub",
} as const satisfies Record<string, string>;

/** All company slugs */
export const COMPANY_SLUGS = Object.keys(COMPANY_DISPLAY) as string[];

/** Get display name for a company slug, with title-case fallback for unknown slugs */
export function getCompanyName(slug: string): string {
  return (COMPANY_DISPLAY as Record<string, string>)[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}
