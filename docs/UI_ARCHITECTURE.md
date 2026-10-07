# UI and data architecture

The public homepage, landing pages and login keep their existing components and CSS. Signed-in screens use an explicit admin theme; this is a single app with separate visual scopes, not two copies of its UI or data layer.

```text
src/
  app/
    AppProviders.tsx       Redux, router, alerts and toast providers
    AppRoutes.tsx          Public, authenticated and super-admin routes
    PageBoundary.tsx       Page-local Suspense and render error boundary
    lazyPage.tsx           Retryable page chunk imports
  theme/
    tokens.css             Shared CSS defaults, including legacy token aliases
    admin.css              Scoped authenticated surface, motion and focus styles
    AdminTheme.tsx         Admin scope and matching Material UI provider
    colors.ts              Existing JS/chart color palette
  components/
    ui/                    Shared buttons, fields, selects, cards, form sections
    feedback/              Skeletons, background refresh and retry feedback
    Layout.tsx             Persistent tenant navigation and page outlet
  hooks/
    useDebouncedValue.ts   Request debouncing for search
  store/
    index.ts               One store; session-aware cache reset and reconnect listener
    authSlice.ts           Auth state and safe local session restoration
    api.ts                 Compatibility exports for existing consumers
    api/
      baseApi.ts           One RTK Query API/cache and authenticated base query
      auth.ts              Auth and profile
      dashboard.ts         Tenant metrics
      students.ts          Students and dues
      seats.ts             Seat maps, allocations, floors and rooms
      payments.ts          Payment operations
      library.ts           Books and issues
      complaints.ts        Complaint operations
      messaging.ts         WhatsApp, SMS and email
      workspaces.ts        Workspace administration, branches and shifts
      subscriptions.ts     SaaS plans, trials and subscriptions
      notices.ts           Announcements
      settings.ts          Workspace configuration and safety alarm
  pages/                   Route screens and existing feature-specific views
```

## Adding a screen

1. Keep public styling under its existing page scope. Add authenticated color/surface changes to `theme/admin.css`, scoped through `body[data-theme="admin"]`. The body scope includes portalled dialogs and menus; leaving protected routes removes it. Material UI receives the same signed-in brand palette through `AdminTheme`.
2. Reuse `Button`, `Input`, `Textarea`, `Select`, `Card` and `FormSection`. Native controls retain browser keyboard and mobile support. Inputs use stable IDs and linked error/help messages. Put `type="submit"` on submit buttons; other shared buttons default to `button`.
3. Put API endpoints in the matching `store/api` feature module and inject into `baseApi`. Do not create another `createApi`, store or provider. The compatibility barrel keeps old imports working; new features may import their domain directly.
4. Add protected pages using `lazyPage`. Suspense belongs inside each persistent layout's outlet. Never key the whole app or store by pathname/query status.
5. Show `LoadingState` only when that section has no data. Keep cached content visible during a refetch and show `QueryFeedback` nearby. Use `currentData` when changing entity IDs, branch or pagination must not show the previous entity under new controls. A failed initial request should not be displayed as an empty successful result.
6. Set `Button.isLoading` from the relevant mutation; do not block the whole screen. Shared error feedback retries the affected query. HTTP/session errors navigate through the router, not `window.location`.

## Cache policy

- Query data remains in memory for five minutes after its last subscriber leaves. A mounted query older than one minute may revalidate when revisited; cached content remains available. Network reconnection revalidates subscribed queries. These durations are explicit in `baseApi.ts` and can be tuned after measuring API load.
- Successful mutations invalidate affected resource tags. Failed mutations do not invalidate. Student detail queries have ID tags; list mutations include the list tag. Cross-resource effects such as payments updating student dues also invalidate the relevant domain.
- Existing redundant profile/subscription `refetch()` calls have been removed where mutations already invalidate those tags. Intentional manual refreshes that are used to obtain an immediate result remain.
- Dashboard and navigation use the same default metrics arguments to share the cache entry. Student search is debounced by 300ms. Messaging logs load only for the visible channel and log tab.
- Logout, identity/workspace changes, and token changes clear the API cache. Late responses from the old session cannot log out the new session. Query data is not persisted to local storage.

## Validation

Run `npm run build` and `npm run test:cache`. The cache tests cover reuse, local invalidation, no refetch after failed writes, cached content during refetch, logout/account isolation, late-session errors, malformed session storage, and shared-field accessibility markup.

Browser acceptance checks still required before release: public and login visual comparison, 390px and desktop layouts, keyboard navigation, reduced motion, slow and failed requests, route chunk failure/retry, and real authenticated backend workflows. Mocked cache tests do not validate server authorization or payment processing.

## Follow-up refactors

The existing seat-map, billing and student screens are still large. Extract feature-specific drawers, pricing editors and table rows into `features/<domain>/components` incrementally, retaining route screens as composition layers. This change establishes shared infrastructure without rewriting those business flows. Existing API response models also need gradual typing; the repository still contains pre-existing lint failures.
