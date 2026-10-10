# Codebase Engineering Audit & Technical Debt Roadmap

This document outlines architectural anti-patterns, maintainability issues, code quality gaps, and technical debt identified in the **Trishul Admin** codebase. It serves as a single source of truth for engineering improvements to be tackled incrementally.

---

## Executive Summary & Scorecard

| Domain | Current Status | Severity | Primary Risk |
| :--- | :--- | :--- | :--- |
| **Component Architecture** | Massive "God Components" (up to 5,400 lines) | 🔴 Critical | High cognitive load, severe merge conflicts, cascading re-renders |
| **TypeScript & Type Safety** | 400+ `: any` usages, untyped RTK queries | 🔴 Critical | Hidden runtime crashes, broken refactoring guarantees |
| **Form & State Management** | Dozens of `useState` per page, unused form libraries | 🟠 High | Buggy validation, boilerplate bloat, difficult testing |
| **Styling & Design System** | Mixed MUI + Emotion + Custom CSS + Inline styles | 🟠 High | Inflated bundle size, CSS specificity wars, visual inconsistency |
| **Security & Auth Handling** | Tokens in plain `localStorage`, no refresh token | 🟠 High | XSS token theft, abrupt session logouts |
| **Performance & Rendering** | Zero list virtualization, frequent full-tree re-renders | 🟡 Medium | UI lag on workspaces with 100+ seats or large student lists |
| **Error Handling & Observability** | Basic catch toasts, silent catches, uninstrumented error boundaries | 🟡 Medium | Production issues invisible until user reports them |
| **Testing & CI/CD** | 1 test file, no PR lint/type-checking in CI | 🔴 Critical | Broken code can deploy directly to production |
| **Repository Hygiene** | Scratch python/js scripts in repo root | 🟢 Low | Cluttered project workspace |

---

## 1. Component Architecture & "God Components"

### ❌ The Problems
Several page components violate the Single Responsibility Principle and have grown into massive monolithic files containing business logic, API calls, data manipulation, multiple modals, and rendering logic all in one place:

- **`src/pages/Seats.tsx` (~5,392 lines, 80 `useState` hooks)**:
  - Manages seat layout visual grid, drag-and-drop, floor CRUD, room CRUD, seat CRUD, student seat allocations, shift selections, payment modals, Razorpay verifications, filter panels, and analytics.
- **`src/pages/Billing.tsx` (~1,917 lines)**:
  - Combines billing overview, payment creation, invoice generation, discount application, receipts, export handling, and tables.
- **`src/pages/Students.tsx` (~1,747 lines, 36 `useState` hooks)**:
  - Manages student tables, search, admission status, seat allocation, photo compression, dues settlement, and delete workflows.
- **`src/pages/MessagesBroadcast.tsx` (~1,079 lines)**:
  - Broadcast forms, template creators, history tables, channel pickers.
- **`src/pages/Login.tsx` (~896 lines)**:
  - Combines login, tenant registration with 10+ inputs, Google GIS script injection, simulator modal, and custom styles.
- **`src/components/AllocateSeatModal.tsx` (~746 lines)**:
  - Modal that acts as an entire sub-application for seat mapping and payment.

### 💡 Future Solution & Best Practice
- **Extract by Domain Feature**:
  - Break `Seats.tsx` into modular subdirectories:
    - `features/seats/components/SeatMapGrid.tsx`
    - `features/seats/components/SeatDetailsDrawer.tsx`
    - `features/seats/components/FloorRoomManager.tsx`
    - `features/seats/hooks/useSeatMapState.ts`
    - `features/seats/hooks/useSeatAllocation.ts`
- **Container / Presentational Pattern**:
  - Separate data fetching and state orchestration from pure presentation components.
- **Extract Reusable Modals**:
  - Keep modals in standalone components with their own isolated local state rather than having the parent page hold 10 different modal open states and their input fields.

---

## 2. TypeScript & Type Safety Violations

### ❌ The Problems
1. **Pervasive `: any` types (Over 400 instances)**:
   - Throughout `Students.tsx`, `Seats.tsx`, `Billing.tsx`, and `Login.tsx`, API payloads, error objects, and function parameters frequently use `: any`.
   - Example: `catch (err: any)` and `data?.map((item: any) => ...)` bypass TypeScript's type checker completely.
2. **Untyped RTK Query Endpoints**:
   - In `src/store/api/students.ts`, `seats.ts`, `payments.ts`, query definitions are defined without generic type parameters:
     ```ts
     // CURRENT:
     getStudents: builder.query({
       query: (params) => ({ url: 'students', params }),
     })
     ```
     This forces consumers in React components to guess the response shape or cast it as `any`.
3. **Inconsistent Shared Model Types**:
   - Entities like `Student`, `Seat`, `Shift`, `Invoice`, and `Workspace` are redefined with slight variations in multiple components instead of being centralized in `src/types/`.

### 💡 Future Solution & Best Practice
- Define strict model contracts in `src/types/` (e.g., `student.types.ts`, `seat.types.ts`, `billing.types.ts`).
- Strongly type all RTK Query endpoints:
  ```ts
  getStudents: builder.query<PaginatedResponse<Student>, GetStudentsQueryParams>({
    query: (params) => ({ url: 'students', params }),
  })
  ```
- Enable TypeScript strict checks in `tsconfig.json` (`noImplicitAny: true`, `strictNullChecks: true`).
- Type API errors using a shared `ApiErrorResponse` helper instead of `catch (err: any)`.

---

## 3. Form Handling & State Management

### ❌ The Problems
1. **Unused Dependencies (`react-hook-form`)**:
   - `react-hook-form` is listed in `package.json` (`^7.79.0`) but is **not imported or used anywhere** in `src/`.
2. **Form State Boilerplate (`useState` Overload)**:
   - Forms (such as in `Login.tsx`, `NewAdmission.tsx`, `Students.tsx`) define 15–20 individual `useState` hooks for each input field (`name`, `email`, `address`, `pincode`, `gstNumber`, `password`, `logo`, etc.).
   - Every input has its own `onChange` handler with handwritten string validation and regex checking inside component files.
3. **Absence of Schema Validation (`zod` / `yup`)**:
   - Form validation logic is duplicated across pages using custom regex string parsing (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) rather than declaratively validated schemas.

### 💡 Future Solution & Best Practice
- Adopt **`react-hook-form`** with **`@hookform/resolvers/zod`** and **`zod`**:
  ```ts
  const admissionSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Must be a 10-digit number'),
    shiftId: z.string().nonempty('Please select a shift'),
  });
  ```
- This eliminates 80% of boilerplate state code, unifies validation error rendering, and isolates form re-renders from the main page.

---

## 4. Authentication, Security & Session Management

### ❌ The Problems
1. **Access Token Stored in `localStorage`**:
   - Storing JWT access tokens in `localStorage` (`localStorage.setItem('token', ...)`) leaves tokens vulnerable to XSS (Cross-Site Scripting) attacks.
2. **Lack of Refresh Token Rotation**:
   - The frontend currently stores only an access token. When it expires, the backend returns `401`, triggering `api.dispatch(logout('expired'))`, which abruptly boots the user out of the app.
3. **User Profile Cache Validation**:
   - `localStorage.getItem('user')` is parsed on startup without verifying its integrity against the backend `/api/profile` or `/api/auth/me` endpoint. If local storage is tampered with, the client might briefly think it is in a different role before an API call fails.

### 💡 Future Solution & Best Practice
- **HttpOnly Cookies for Auth Tokens**:
  - Prefer setting `accessToken` and `refreshToken` via secure `HttpOnly`, `SameSite=Strict` cookies issued by the backend so client JavaScript cannot read them.
- **Silent Refresh Interceptor**:
  - Implement a token refresh flow in `baseApi.ts` where a `401` response triggers a refresh request before automatically logging the user out.
- **Session Revalidation on Load**:
  - Validate the session on initial app boot via a `/api/auth/verify` query.

---

## 5. Styling Architecture & Design System Fragmentation

### ❌ The Problems
1. **Conflicting Styling Paradigms**:
   - The project uses **four competing styling approaches simultaneously**:
     1. Material UI (`@mui/material`, `@emotion/react`, `@emotion/styled`) in pages like `Billing.tsx`, `Complaints.tsx`, `Settings.tsx`.
     2. Custom UI components in `src/components/ui/` (`Button.tsx`, `Input.tsx`, `Modal.tsx`) using custom CSS files.
     3. Massive global and page-specific stylesheets (`Globals.css` 16KB, `Landing.css` 1,946 lines, `Login.css` 1,618 lines).
     4. Heavy inline styles (`style={{ display: 'flex', ... }}`) throughout SuperAdmin pages.
2. **Bundle Size Bloat**:
   - Shipping the full MUI component suite and Emotion runtime alongside custom CSS and Lucide icons adds unnecessary megabytes to the initial JavaScript bundle.
3. **Hardcoded Color Tokens**:
   - Colors are hardcoded as raw hex values in various files (`#0f172a`, `#fbbf24`, `#1e293b`) alongside CSS variables in `tokens.css` and JS colors in `colors.ts`.

### 💡 Future Solution & Best Practice
- **Unify the Design System**:
  - Choose one primary design system strategy:
    - *Option A*: Pure Vanilla CSS with centralized CSS variables / design tokens (`tokens.css`) and clean reusable UI primitives in `src/components/ui/`.
    - *Option B*: Standardized component library (like Tailwind CSS or clean Radix UI primitives).
- Remove unused MUI/Emotion dependencies once pages are migrated to the primary design system to reduce bundle footprint.
- Replace all hardcoded hex strings with semantic design tokens (`var(--color-bg-primary)`, `var(--color-brand)`, etc.).

---

## 6. Performance & Rendering Bottlenecks

### ❌ The Problems
1. **Lack of List Virtualization**:
   - The student directory, seat maps, and transaction logs render every item directly into the DOM as native HTML nodes. For reading rooms with hundreds of seats or active workspaces with 1,000+ students, rendering hundreds of complex DOM nodes causes noticeable scrolling stutter.
2. **Cascading Re-renders**:
   - In `Seats.tsx` and `Students.tsx`, updating a minor state like a search input or hover tooltip triggers re-renders of the entire 5,000-line tree because handlers and filter pipelines are not memoized with `useCallback` and `useMemo`.
3. **Client-Side Image Compression in UI Thread**:
   - `Students.tsx` defines a custom canvas-based `compressImage` function executed directly on the main thread, which can freeze the browser during high-resolution photo uploads.

### 💡 Future Solution & Best Practice
- Use **`@tanstack/react-virtual`** for student tables, transaction logs, and large seat grids.
- Memoize heavy derived collections (filtering students, calculating floor seat counts) with `useMemo`.
- Offload heavy image compression to web workers or use dedicated modern libraries like `browser-image-compression`.

---

## 7. Error Handling, Resilience & Observability

### ❌ The Problems
1. **Simplistic Error Boundary**:
   - `PageBoundary.tsx` has a basic React error boundary that renders a generic fallback message, but:
     - It does not implement `componentDidCatch(error, errorInfo)` to record error stacks.
     - It does not report exceptions to an error monitoring service (e.g., Sentry, Bugsnag).
2. **Ad-hoc Error Reporting**:
   - Errors in API calls are caught with inconsistent fallbacks:
     ```ts
     showToast(err?.data?.message || 'Failed', 'error');
     ```
     Some mutations ignore errors entirely or use empty catch blocks (`catch (e) {}`).
3. **No Offline Support / Network Status Notification**:
   - If the user's connection drops, queries fail with generic errors without indicating that network connectivity was lost.

### 💡 Future Solution & Best Practice
- Enhance `PageBoundary` with full error logging, stack trace capture, and error reporting integration.
- Implement an API error utility (`getErrorMessage(error)`) that parses standard backend validation structures consistently.
- Add a global network connectivity listener (`navigator.onLine` / `window.addEventListener('offline')`) displaying an offline banner.

---

## 8. Testing & CI/CD Pipeline Deficiencies

### ❌ The Problems
1. **Virtually Nonexistent Test Coverage**:
   - The repository contains only a single test file: `tests/cache-behavior.cjs`.
   - There are **zero unit tests** for critical business logic (e.g., shift duration calculations, fee calculations in `dateUtils.ts`, auth guards, billing logic).
   - There are **zero component tests** (e.g., React Testing Library) or end-to-end tests (Playwright/Cypress).
2. **Unsafe Deployment Workflow**:
   - `.github/workflows/deploy.yml` triggers on push to `main` and immediately executes `/usr/local/bin/deploy-admin` on a self-hosted runner.
   - It runs **no automated checks** prior to deployment:
     - No `npm run lint`
     - No `npx tsc --noEmit`
     - No unit tests
   - A single TypeScript typo or missing import pushed to `main` can break the production build.

### 💡 Future Solution & Best Practice
- **Establish a CI Pipeline**:
  - Update `.github/workflows/deploy.yml` to include a validation job before deployment:
    ```yaml
    jobs:
      validate:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: 20 }
          - run: npm ci
          - run: npm run lint
          - run: npx tsc --noEmit
          - run: npm test
    ```
- Add unit tests for utility functions in `src/utils/dateUtils.test.ts` using Vitest.
- Add integration tests for key flows (Authentication, Student creation, Seat allocation).

---

## 9. Repository Hygiene & Code Cleanliness

### ❌ The Problems
1. **Ad-hoc Scripts in Project Root**:
   - Files like `patch_seat_service.py`, `patch_shift_model.py`, `test-api.js`, and `update_billing.js` are stored in the root of the React Admin frontend repository. These should live in the backend repository or a dedicated `/scripts` directory.
2. **Missing Scripts in `package.json`**:
   - No `test` script (only `test:cache`).
   - No `format` script (Prettier).

### 💡 Future Solution & Best Practice
- Move temporary/maintenance scripts into a dedicated `scripts/` directory or delete one-off migration scripts.
- Add and configure **Prettier** for automated code formatting across the team.
- Add standard scripts in `package.json`:
  ```json
  "typecheck": "tsc --noEmit",
  "format:check": "prettier --check .",
  "format": "prettier --write ."
  ```

---

## Prioritized Implementation Roadmap

### Phase 1: Immediate Safety & Hygiene (Completed ✅)
- [x] Protect routes with `AuthenticatedRoute` and `UnauthenticatedRoute` to prevent auth/unauth back navigation leakage.
- [x] Add automated pre-deployment validation in GitHub Actions (`.github/workflows/deploy.yml`) to enforce `tsc -b` and `eslint` before deployment.
- [x] Configure ESLint to run cleanly with zero errors in CI (`npm run lint`).
- [x] Move ad-hoc root scripts (`*.py`, `test-api.js`, `update_billing.js`) into dedicated `scripts/` folder.
- [x] Add `"typecheck": "tsc -b"` and `"test"` script commands in `package.json`.
- [x] Upgrade `PageBoundary.tsx` with error stack capture, logging, and user recovery controls.
- [x] Create centralized domain types in `src/types/` (`user.ts`, `student.ts`, `seat.ts`, `billing.ts`, `api.ts`).

### Phase 2: Forms & Monolith Refactoring (For Future Iterations ⏳)
- [ ] Deconstruct `Seats.tsx` (5,400 lines) into focused subcomponents and custom hooks (`features/seats/`).
- [ ] Deconstruct `Billing.tsx` and `Students.tsx` into modular feature directories.
- [ ] Adopt `react-hook-form` and `zod` for student admission, workspace setup, and login forms to replace dozens of manual `useState` hooks.

### Phase 3: Styling Unification & Performance (Long-term ⏳)
- [ ] Eliminate mixed MUI dependency in favor of unified CSS token design system.
- [ ] Implement list virtualization (`@tanstack/react-virtual`) for the student table and seat grid.
- [ ] Implement silent refresh token rotation and enhanced error telemetry (Sentry).

