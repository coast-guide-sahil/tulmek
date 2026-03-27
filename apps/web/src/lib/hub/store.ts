/**
 * Hub store — re-exported from @tulmek/core/stores/hub.
 * The store factory lives in the shared package so mobile can reuse it.
 * This file re-exports for backward compatibility with existing imports.
 */
export { createHubStore } from "@tulmek/core/stores/hub";
export type { UseHubStore, HubStoreState, HubStoreDeps } from "@tulmek/core/stores/hub";
