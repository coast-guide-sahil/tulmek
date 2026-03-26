# Swapping Providers

The clean architecture makes swapping third-party dependencies straightforward. Each swap follows the same pattern:

1. Create a new adapter implementing the port interface
2. Change one line in `apps/web/src/lib/progress/provider.tsx` (the `deps` prop)

## Examples

### Progress: localStorage → cloud DB
1. Create `apps/web/src/infrastructure/storage/cloud-progress.adapter.ts` implementing `ProgressStore`
2. Update `deps` in `ProgressProvider`

### Progress: IndexedDB notes → cloud storage
1. Create adapter implementing `NoteStore`
2. Update `deps` in `ProgressProvider`

### Progress: Orama → server-side search
1. Create adapter implementing `SearchEngine`
2. Update `deps` in `ProgressProvider`

### Progress: Static JSON → CMS
1. Create adapter implementing `ContentSource` (in `packages/core/src/ports/`)
2. Replace `StaticContentSource` in `src/lib/progress/content.ts`

### Add mobile app
1. Create `apps/mobile/`
2. Import `@tulmek/core` and `@tulmek/config`
3. Create mobile-specific adapters
4. Same domain types, zero duplication
