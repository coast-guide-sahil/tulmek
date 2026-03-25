# Swapping Providers

The clean architecture makes swapping third-party dependencies straightforward. Each swap follows the same pattern:

1. Create a new adapter implementing the port interface
2. Change one line in `apps/web/src/infrastructure/composition-root.ts`

## Examples

### Drizzle → Prisma
1. Create `apps/web/src/infrastructure/database/prisma/user.repository.ts` implementing `UserRepository`
2. Update composition-root import

### Better Auth → Clerk
1. Create `apps/web/src/infrastructure/auth/clerk.adapter.ts` implementing `AuthPort`
2. Update composition-root import

### mailchecker → custom
1. Create a new adapter implementing `EmailValidatorPort`
2. Update composition-root import

### Add mobile app
1. Create `apps/mobile/`
2. Import `@tulmek/core` and `@tulmek/config`
3. Create mobile-specific adapters
4. Same use cases, zero duplication
