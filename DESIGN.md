# Bambu Filament Guide - Design & Specification

## 1. Project Overview
A web application to manage, share, and customize 3D printing profiles and filament settings for Bambu Lab printers (A1 Mini, X1 Carbon, etc.). It allows users to view community profiles, create their own, and manage a personal library.

## 2. Architecture
*   **Frontend:** Vue.js 3 (Composition API) built with Vite.
*   **Styling:** Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL Database, Authentication).
*   **State Management:** Reactive Vue refs in `App.vue`.
*   **Testing:** Vitest + Vue Test Utils for component/unit tests and App-level integration tests (mocked Supabase client); Playwright for end-to-end tests that drive the real built app in a browser against a mocked Supabase network layer (see Section 6).

## 3. Database Schema
The application relies on a relational database with JSONB columns for flexible setting storage.

### Tables
*   **`print_profiles`**
    *   `id` (UUID, PK): Unique identifier.
    *   `user_id` (UUID, FK): Owner of the profile.
    *   `name` (Text): Display name.
    *   `printer_model` (Text): Target printer (e.g., "A1 Mini").
    *   `quality` (JSONB): Stores layer height, seam settings, etc.
    *   `strength` (JSONB): Stores walls, infill settings.
    *   `speed` (JSONB): Stores print speeds.
    *   `support` (JSONB): Stores support settings.
    *   `others` (JSONB): Stores brim/skirt settings.
    *   `created_at` (Timestamp).

*   **`filaments`**
    *   `id` (UUID, PK).
    *   `user_id` (UUID, FK).
    *   `name` (Text).
    *   `print_profile_id` (UUID, FK, Nullable): Linked print profile.
    *   `basic_settings` (JSONB): Vendor, color, diameter, etc.
    *   `temp_settings` (JSONB): Nozzle/Bed temperatures.
    *   `cooling_settings` (JSONB): Fan speeds.
    *   `override_settings` (JSONB): Retraction, Z-hop.
    *   `scarf_seam` (JSONB): Scarf seam specific settings.
    *   `created_at` (Timestamp).

*   **`printers`** — private, owner-only (not shared with other users)
    *   `id` (UUID, PK).
    *   `user_id` (UUID, FK): Owner of the printer.
    *   `name` (Text): User-given label, e.g. "My A1 Mini".
    *   `model` (Text): One of the known Bambu models (A1 Mini, A1, P1P, P1S, X1, X1 Carbon, X1E).
    *   `bed_size_x`, `bed_size_y` (Number).
    *   `nozzle_diameter` (Number).
    *   `default_print_profile_id` (UUID, FK to `print_profiles`, Nullable): The profile used as the starting point when printing on this machine. `on delete set null` — deleting the referenced profile just clears the default rather than failing.

*   **`favorites`**
    *   `user_id` (UUID, FK).
    *   `print_profile_id` (UUID, FK, Nullable).
    *   `filament_id` (UUID, FK, Nullable).

### Configuration Objects (JSONB Structures)

#### Filament Settings
*   **Basic:** Type (Default: PLA), Vendor (Default: Overture), Color (Default: #000000), Diameter (Default: 1.75mm), Flow Ratio (Default: 0.98), Density (Default: 1.22 g/cm³), Shrinkage (Default: 100%), Velocity Adaptation (Default: 1), Price (Default: 24.52), Softening Temp (Default: 45°C).
*   **Temperatures:** Nozzle (Min/Max, First/Other), Bed (Cool/Eng/PEI plates), Vitrification.
*   **Cooling:** Fan speeds (Min/Max/Aux), Layer times.
*   **Overrides:** Max Volumetric Speed, Retraction, Z-Hop.
*   **Scarf Seam:**
    *   `scarf_seam_type`: None, Outer, Inner, Both.
    *   `scarf_start_height`: Height to start scarf seam.
    *   `scarf_slope_gap`: Gap in slope.
    *   `scarf_length`: Overlap length.

#### Print Profile Settings
*   **Quality:** Layer height, Seam position, Wall generator, Ironing.
*   **Strength:** Wall loops, Shell layers, Infill (density/pattern).
*   **Speed:** Wall/Infill/Travel/First Layer speeds, Acceleration.
*   **Support:** Enable, Type (Normal/Tree), Style, Threshold angle.
*   **Others:** Brim (type/width), Skirt loops.

## 4. Application Flows

### 4.1 Authentication
1.  **Sign Up:** User enters Email/Password -> Supabase creates user -> Sends confirmation email.
2.  **Sign In:** User enters credentials -> Supabase returns Session -> App updates `user` state.
3.  **Sign Out:** Clears session and local state.
4.  **Forgot Password:** From the Sign In view, user clicks "Forgot password?" -> `AuthModal` switches to an email-only "Reset Password" form -> submitting calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })` -> Supabase emails the user a recovery link.
5.  **Password Recovery:** User clicks the emailed link -> lands back on the app with a recovery token in the URL -> Supabase client fires a `PASSWORD_RECOVERY` auth event -> `App.vue`'s `onAuthStateChange` listener catches this event and opens `ResetPasswordModal` (instead of treating it as a normal sign-in) -> user enters a new password (with confirm-match and min-length validation) -> `supabase.auth.updateUser({ password })` updates the account.

    > Requires the app's URL(s) to be listed under **Authentication → URL Configuration → Redirect URLs** in the Supabase dashboard, or Supabase will refuse to redirect back after the emailed link is clicked.

### 4.2 Data Access (RLS Policies)
*   **Read:** Public access allowed for all profiles/filaments/printers.
*   **Write/Update/Delete:** Restricted to the `user_id` matching the authenticated user.

### 4.3 Profile/Filament Editing
1.  **Open:** User clicks a card.
    *   If Owner: Opens in Edit mode.
    *   If Not Owner: Opens in Read-Only mode.
2.  **Edit:** `EditorModal` renders fields dynamically based on `schemas.js`.
3.  **Validation:** Inputs enforce types (number, color) and constraints (min values).
4.  **Save:**
    *   New Item: `INSERT` into DB.
    *   Existing Item: `UPDATE` row in DB.
5.  **Unsaved Changes:** Closing the modal with modified data triggers a confirmation prompt.

### 4.4 Forking (Cloning)
1.  User clicks "Fork" on a community profile.
2.  App creates a deep copy of the object.
3.  Removes `id` and `created_at`.
4.  Sets `user_id` to current user.
5.  Appends "(Copy)" to the name.
6.  Inserts into DB as a new record.

### 4.5 Printer Management
1.  **View:** The Printers tab lists only the signed-in user's own printers (enforced by RLS — `printers` has no public-read policy). Signed-out users see a sign-in prompt instead of a table.
2.  **Add:** "+ New Printer" opens `PrinterModal` with sensible defaults (A1 Mini, 0.4mm nozzle, 180×180mm bed, no default profile) -> Save inserts a new row.
3.  **Edit:** Clicking a printer row opens the same modal pre-filled with that printer's data, including a **Default Print Profile** dropdown listing every visible print profile (the user's own plus community profiles). Changing the selection and saving updates `default_print_profile_id` via `UPDATE ... WHERE id = :id`.
4.  The Printers table's "Default Profile" column resolves and displays the linked profile's name (or "—" if none is set) by looking it up in the already-loaded `profiles` list — no extra query.

## 5. Component Structure

### `App.vue` (Main Controller)
*   **Responsibilities:**
    *   Layout (Sidebar + Main Content).
    *   Routing (View switching: Profiles/Filaments/Printers).
    *   Data Fetching (`loadData`).
    *   Global State (`user`, `profiles`, etc.).
    *   Modal Management.

### `components/EditorModal.vue`
*   **Responsibilities:**
    *   Renders form based on `props.type` ('profile' or 'filament').
    *   Uses `src/constants/schemas.js` to generate inputs.
    *   Handles local state of the object being edited.
    *   Emits `save` event with payload.

### `components/AuthModal.vue`
*   **Responsibilities:**
    *   Form for Sign In / Sign Up / Forgot Password (three modes via `authMode`).
    *   Emits `authenticate` (sign in/up) and `forgot-password` (reset request) events.

### `components/ResetPasswordModal.vue`
*   **Responsibilities:**
    *   Shown when a `PASSWORD_RECOVERY` auth event fires (user arrived via the emailed reset link).
    *   New-password + confirm-password fields with min-length and match validation.
    *   Emits `submit` with the new password.

### `components/PrinterModal.vue`
*   **Responsibilities:**
    *   Create/edit form for a printer: name, model, nozzle diameter, bed size, and a **Default Print Profile** selector.
    *   Emits `save` (upsert) and `close` (with an unsaved-changes confirm guard, same pattern as `EditorModal`).

### `constants/schemas.js`
*   **Responsibilities:**
    *   Single source of truth for configuration fields.
    *   Defines UI labels, types, and tooltips.

## 6. Testing Strategy

Three layers, from fastest/most-isolated to slowest/most-realistic:

*   **Unit / component tests** (`src/__tests__/*.test.js`, Vitest + Vue Test Utils): each component mounted in isolation with fake props. Covers `schemas.js` shape validation, and rendering/emit behavior of `AuthModal`, `ResetPasswordModal`, `PrinterModal`, and `EditorModal` (both profile and filament layouts).
*   **Integration tests** (`src/__tests__/App.integration.test.js`): mounts the full `App.vue` tree with a mocked `@/lib/supabase` module (a lightweight thenable "chain" mock standing in for the PostgREST query builder). Exercises the actual handler logic in `App.vue` — profile/filament/printer create & update, forking, favorites, sign out, and both halves of the password-reset flow — asserting on the exact table/payload sent to Supabase and the resulting UI state.
*   **End-to-end tests** (`e2e/*.spec.js`, Playwright): drives the real app in a real Chromium browser against `npm run dev`, with Supabase REST (`/rest/v1/**`) and Auth (`/auth/v1/**`) requests intercepted and served canned responses (`e2e/fixtures/supabase-mock.js`) instead of hitting the live project. This keeps E2E runs deterministic and side-effect-free while still validating the real DOM, routing, and network-request shapes. Run via `npm run test:e2e`.

    > The "recovery" half of password reset (clicking the emailed link and landing back on the app with a valid session) is not covered end-to-end — that requires a real email and a real Supabase-issued token. It's covered at the integration layer instead, by invoking the app's `onAuthStateChange` callback directly with a `PASSWORD_RECOVERY` event.

**Reports:** every run prints a per-test pass/fail line to the terminal and also writes a machine-readable report:
*   `npm test` → per-test console output (verbose reporter) + `test-results/unit-report.json`.
*   `npm run test:e2e` → per-test console output (list reporter) + `test-results/e2e-report.json` + a browsable HTML report at `playwright-report/index.html` (open directly, or run `npx playwright show-report`).