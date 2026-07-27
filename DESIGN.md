# Bambu Filament Guide - Design & Specification

## 1. Project Overview
A web application to manage, share, and customize 3D printing profiles and filament settings for Bambu Lab printers (A1 Mini, X1 Carbon, etc.). It allows users to view community profiles, create their own, and manage a personal library.

## 2. Architecture
*   **Frontend:** Vue.js 3 (Composition API) built with Vite.
*   **Styling:** Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL Database, Authentication).
*   **State Management:** Reactive Vue refs in `App.vue`.
*   **Testing:** Vitest + Vue Test Utils for component/unit tests and App-level integration tests (mocked Supabase client); Playwright for end-to-end tests that drive the real built app in a browser against a mocked Supabase network layer (see Section 7).
*   **Hosting:** Static build on GitHub Pages, custom domain `draconas.org`, deployed via GitHub Actions on merge to `main` — see `DEPLOYMENT.md` for the full setup and security notes.

## 3. Database Schema
The application relies on a relational database with JSONB columns for flexible setting storage.

### Tables
*   **`print_profiles`**
    *   `id` (UUID, PK): Unique identifier.
    *   `user_id` (UUID, FK): Owner of the profile.
    *   `name` (Text): Display name.
    *   `printer_model` (Text, FK to `printer_models.name`): Target printer model class (e.g., "A1 Mini"), not a specific printer instance.
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
    *   `model` (Text, FK to `printer_models.name`).
    *   `bed_size_x`, `bed_size_y` (Number).
    *   `nozzle_diameter` (Number).
    *   `default_print_profile_id` (UUID, FK to `print_profiles`, Nullable): The profile used as the starting point when printing on this machine. `on delete set null` — deleting the referenced profile just clears the default rather than failing.

*   **`printer_models`** — shared, community-editable list of target printer models (public read; any signed-in user may insert or delete)
    *   `id` (UUID, PK).
    *   `name` (Text, unique): e.g. "A1 Mini", "X1 Carbon". Seeded with the 7 models the app originally shipped with.
    *   `printers.model` and `print_profiles.printer_model` are real foreign keys into this column (`on update cascade, on delete restrict`) — a rename here would cascade to every row referencing it (no UI for that yet), and a delete is flatly rejected by Postgres while anything still references the name. This is enforced by the database engine itself, independent of and in addition to any RLS policy.
    *   `printer_model_usage()` — a `security definer` SQL function returning `{name, in_use}` for every model, checking both `printers` (bypassing its owner-only RLS, so usage by *any* user's printers counts) and `print_profiles`. Used by the UI to decide whether to show a delete button *before* attempting one — the FK constraint above is what actually guarantees correctness if that check is ever stale or bypassed.

*   **`favorites`**
    *   `user_id` (UUID, FK).
    *   `print_profile_id` (UUID, FK, Nullable).
    *   `filament_id` (UUID, FK, Nullable).

*   **`user_profiles`** — one row per `auth.users` row; app-level account data and access role. Named `user_profiles` rather than Supabase's usual `profiles` because this app already uses "profiles" to mean print profiles everywhere else.
    *   `id` (UUID, PK, FK to `auth.users.id`).
    *   `email` (Text): mirrors `auth.users.email`, kept in sync automatically (see triggers below) so the client never needs to read the `auth` schema directly, which isn't exposed via the API anyway.
    *   `full_name`, `phone` (Text, nullable): plain contact fields, not tied to Supabase's phone-auth feature (this app doesn't use phone auth).
    *   `role` (Text): `standard` (default) | `elevated` | `admin`.
    *   `disabled` (Boolean, default `false`): see Access Levels below.
    *   Triggers: `handle_new_auth_user` (`after insert on auth.users`) creates the row on signup; `sync_user_profile_email` (`after update of email on auth.users`) keeps `email` current if it's ever changed (self-service, or the admin Edge Function in Section 6).
    *   `enforce_user_profile_update_permissions` (`before update`) — the fine-grained rules RLS alone can't express: nobody may change their own `role`/`disabled`; editing someone else requires `elevated` or `admin`; `elevated` may only touch users currently `standard` and can never change a `role` (elevation/demotion is admin-only).
    *   Helper functions `get_my_role()` and `current_user_disabled()` (both `security definer`, so they can read the caller's own row regardless of RLS) back both this table's own policies and the disabled-check added to every other table's write policies below.

### Configuration Objects (JSONB Structures)

#### Filament Settings
Mirrors the full "Filament" tab of Bambu Studio's filament editor (see `src/constants/schemas.js` `filamentSchema` for the authoritative field list/defaults).
*   **Basic:** Type (Default: PLA), Vendor (Default: Overture), Color (Default: #000000), Metal Stickiness (None/Low/Medium/High, Default: None), Diameter (Default: 1.75mm), Flow Ratio (Default: 0.98), Density (Default: 1.22 g/cm³), Shrinkage (Default: 100%), Velocity Adaptation (Default: 1), Price (Default: 24.52 $/kg), Softening Temp (Default: 45°C), Filament Prime Volume (Filament/Hotend change), Filament Ramming Length (Extruder/Hotend change), Travel Time After Ramming (Extruder/Hotend change, seconds), Precooling Target Temperature (Extruder/Hotend change), Idle Temperature (AMS).
*   **Temperatures:** Nozzle (Min/Max, First/Other layer), Bed per plate type (Cool Plate SuperTack, Cool Plate, Engineering Plate, Smooth PEI/High Temp Plate, Textured PEI Plate — each Initial/Other layer), Vitrification.
*   **Cooling:** Fan speeds (Min/Max/Aux), Layer times.
*   **Overrides:** Adaptive/Max Volumetric Speed, Ramming Volumetric Speed (Extruder/Hotend change), Retraction, Z-Hop, Pressure Advance, Wipe Distance.
*   **Scarf Seam:**
    *   `scarf_seam_type`: None, Outer, Inner, Both.
    *   `scarf_start_height`: Height to start the scarf seam, as % of layer height (Default: 10%).
    *   `scarf_slope_gap`: Gap in the slope of the scarf seam (Default: 0%).
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
*   **Write/Update/Delete:** Restricted to the `user_id` matching the authenticated user, and additionally requires `not current_user_disabled()` — a disabled account can still read everything (its own and community data) but every insert/update/delete policy across `print_profiles`, `filaments`, `printers`, `favorites`, and `printer_models` rejects the write.

### 4.3 Profile/Filament Editing
1.  **Open:** User clicks a card.
    *   If Owner: Opens in Edit mode.
    *   If Not Owner: Opens in Read-Only mode.
2.  **Edit:** `EditorModal` renders fields dynamically based on `schemas.js`.
3.  **Target Printer:** The profile editor's "Target" field is a dropdown sourced from the shared `printer_models` table (passed down as the `printerModels` prop — see Section 4.6), not free text. Changing it resets the **Speed** tab's fields to that model's built-in defaults (`PRINTER_MODEL_SPEED_DEFAULTS` in `schemas.js`, keyed by name) — e.g. X1 Carbon defaults to 10000 mm/s² acceleration vs. 5000 for A1 Mini; a community-added model with no entry in that map just keeps whatever speed values were already set. Other tabs (quality, strength, support, others) aren't model-dependent and are left untouched. Only editable while creating a new profile — locked once saved.
4.  **Validation:** Inputs enforce types (number, color) and constraints (min values). Filaments additionally require a linked print profile (`print_profile_id`) — the toolbar's Profile selector has no "None" option, and `handleSave` in `EditorModal` blocks the save with an alert if it's unset. `createNewFilament` in `App.vue` defaults it to the first available profile so the visible selection always matches the actual bound value; if the user has no profiles yet, it's left unset and they must create one first.
5.  **Save:**
    *   New Item: `INSERT` into DB.
    *   Existing Item: `UPDATE` row in DB.
6.  **Unsaved Changes:** Closing the modal with modified data triggers a confirmation prompt.

### 4.4 Forking (Cloning)
Two entry points do the same underlying `cloneProfile`/`cloneFilament`, both of which strip `id`/`created_at`/`updated_at`, set `user_id` to the current user, append " (Copy)" to the name, and insert as a new record:
1.  **Fork button** on a profile card in the grid (visible for signed-in users on profiles/filaments they don't own) — clones the pristine, already-saved row.
2.  **Clone button** in the `EditorModal` footer (profile and filament, both layouts) — visible whenever the viewer is signed in and the item being edited already has an `id` (not for a not-yet-saved new item). Clones whatever is currently in the form, including any unsaved edits, and emits a `clone` event with that data; `App.vue`'s `handleClone` dispatches to `cloneProfile` or `cloneFilament` based on `editorType`. After inserting, the modal switches to editing the new clone in place.

### 4.5 Printer Management
1.  **View:** The Printers tab lists only the signed-in user's own printers (enforced by RLS — `printers` has no public-read policy). Signed-out users see a sign-in prompt instead of a table.
2.  **Add:** "+ New Printer" opens `PrinterModal` with sensible defaults (A1 Mini, 0.4mm nozzle, 180×180mm bed, no default profile) -> Save inserts a new row.
3.  **Edit:** Clicking a printer row opens the same modal pre-filled with that printer's data, including a **Default Print Profile** dropdown listing every visible print profile (the user's own plus community profiles). Changing the selection and saving updates `default_print_profile_id` via `UPDATE ... WHERE id = :id`.
4.  The Printers table's "Default Profile" column resolves and displays the linked profile's name (or "—" if none is set) by looking it up in the already-loaded `profiles` list — no extra query.

### 4.6 Printer Model Management
1.  **View:** The "Printer Models" tab lists every row in `printer_models` (public — visible signed in or out), feeding the Target dropdown in profile editing and the Model dropdown in printer editing (both receive it as the `printerModels` prop, an array of names derived from this list in `App.vue`).
2.  **Add:** Signed-in users can type a name and click **Add**; case-insensitively checked against the existing list client-side before inserting, so obvious duplicates are caught early — the DB's `unique` constraint is the actual guarantee.
3.  **Delete:** Each row shows a 🗑 delete button if `printer_model_usage()` reports the model as unused, or a ⚠️ tooltip ("In use by one or more printers or print profiles") in its place if not — the row's usage state comes from a single batched RPC call on load rather than one request per model. The delete button itself is never rendered for an in-use model, and the `on delete restrict` FK constraints (Section 3) reject the delete regardless if attempted directly. If a model becomes in-use between page load and the click (race condition), the app catches the resulting FK-violation error (`23503`) and shows a friendly message instead of the raw Postgres error.

### 4.7 Access Levels & User Management
Three roles, stored in `user_profiles.role`: **standard** (default — everyone who signs up), **elevated**, and **admin**.

| Action | standard | elevated | admin |
|---|---|---|---|
| Use the app normally (own data + community read) | ✅ | ✅ | ✅ |
| See the "Users" nav item / page | ❌ | ✅ | ✅ |
| Edit a `standard` user's name/phone, enable/disable them, reset their password, change their email | — | ✅ | ✅ |
| Same, for an `elevated` or `admin` user | — | ❌ | ✅ |
| Change any user's role (elevate/demote) | — | ❌ | ✅ |

1.  **Nav gating:** `App.vue` loads the signed-in user's own `user_profiles` row into `myProfile` right after sign-in. The "Users" nav item and route are only rendered when `myProfile.role` is `elevated` or `admin` (`canManageUsers`) — purely a UI convenience; every actual permission is still enforced server-side per the table above.
2.  **List & search:** Loads every `user_profiles` row (RLS allows this for elevated/admin) and filters client-side by email/name as you type — there's no server-side search index given the expected scale.
3.  **Edit:** Clicking a row's **Edit** button (hidden entirely for rows the caller isn't allowed to touch, per the table above) opens `UserEditModal` with that user's name, phone, role, and disabled status. The role `<select>` is disabled unless the caller is admin. Saving sends one `UPDATE user_profiles ... WHERE id = :id`; `enforce_user_profile_update_permissions` is the actual authority on whether it succeeds.
4.  **Reset Password:** Sends the same `resetPasswordForEmail` email as the self-service "Forgot password?" flow (Section 4.1) — nobody, not even an admin, can just type a new password for someone else.
5.  **Change Email:** The one action that genuinely needs Supabase's Admin API (`auth.admin.updateUserById`), which requires the `service_role` secret key — something a browser client must never hold. This is handled by the `update-user-email` Supabase Edge Function (Section 6): the app calls it with the caller's own session token; the function verifies the caller is elevated/admin (and that elevated callers are only targeting a `standard` user) using the service-role client server-side, then performs the email change. `user_profiles.email` stays in sync automatically via the `sync_user_profile_email` trigger.
6.  **Disable:** Setting `disabled = true` doesn't revoke the ability to sign in (that would need the Admin API's ban feature, out of scope here) — it's enforced as a read-only mode: every write policy across the app checks `not current_user_disabled()`, so a disabled account can still see its own and community data but can't create, edit, or delete anything, favorite anything, or add/remove a printer model. The sidebar shows an "Account disabled" notice, and the various "+ New ..." buttons are hidden (`canWrite` in `App.vue`).
7.  Nobody — including admins — can change their own `role` or `disabled` status through this UI; `enforce_user_profile_update_permissions` blocks it unconditionally, so an admin can't accidentally lock themselves out or demote themselves by mistake.

### 4.8 Search
A persistent search box lives in the sidebar (not tied to any one tab), with a three-way scope toggle: **profiles**, **filaments**, or **both** (default). It matches only against `name` (not vendor, printer model, or any JSONB settings), case-insensitively, client-side against the already-loaded `profiles`/`filaments` arrays — no separate query.

Typing a non-empty query replaces whatever the sidebar nav currently shows with a **Search Results** view (`isSearching` in `App.vue`), sectioned by type per the active scope; clearing the box restores the previously-active tab. This is deliberately a full takeover of the main content area rather than a filter applied within each tab, since "both" needs a single place to show mixed results.

## 5. Component Structure

### `App.vue` (Main Controller)
*   **Responsibilities:**
    *   Layout (Sidebar + Main Content).
    *   Routing (View switching: Profiles/Filaments/Printers/Printer Models).
    *   Data Fetching (`loadData`), including `printerModels` and their `modelUsage` map (via the `printer_model_usage()` RPC).
    *   Global State (`user`, `profiles`, etc.).
    *   Modal Management.

### `components/EditorModal.vue`
*   **Responsibilities:**
    *   Renders form based on `props.type` ('profile' or 'filament').
    *   Uses `src/constants/schemas.js` to generate inputs, and the `printerModels` prop (from `App.vue`, backed by the `printer_models` table) for the profile Target dropdown.
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
    *   Create/edit form for a printer: name, model (from the `printerModels` prop), nozzle diameter, bed size, and a **Default Print Profile** selector.
    *   Emits `save` (upsert) and `close` (with an unsaved-changes confirm guard, same pattern as `EditorModal`).

### `components/UserEditModal.vue`
*   **Responsibilities:**
    *   Edit form for a `user_profiles` row: name, phone, role (disabled unless caller is admin), disabled toggle, an inline "Change Email" field, and a "Send Password Reset Email" button.
    *   Emits `save` (the `user_profiles` update), `change-email` (invokes the Edge Function), `send-password-reset` (reuses `resetPasswordForEmail`), and `close` (unsaved-changes confirm guard).

### `constants/schemas.js`
*   **Responsibilities:**
    *   Single source of truth for configuration fields.
    *   Defines UI labels, types, and tooltips.

## 6. Edge Functions

`supabase/functions/update-user-email/` — the one server-side function this app has, and it exists solely because changing *another user's* Auth email requires the Admin API (`service_role` key), which must never reach the browser.

*   **Auth:** the caller's own Supabase session JWT (forwarded automatically as the `Authorization` header) identifies who's calling; a second, `service_role`-backed client (server-side only, never exposed) does the actual privileged lookup/action once permission checks pass.
*   **Permission check:** looks up the caller's `user_profiles.role` — rejects unless `elevated` or `admin`; if `elevated`, additionally rejects unless the target user's current role is `standard`.
*   **Action:** `auth.admin.updateUserById(targetUserId, { email: newEmail })`. `user_profiles.email` then catches up automatically via the `sync_user_profile_email` trigger (Section 3) — the function doesn't touch that table itself.
*   **Deployed:** live at `https://ohzosdwdzshlciphtyuw.supabase.co/functions/v1/update-user-email` via `supabase functions deploy update-user-email` (requires `supabase login` or a `SUPABASE_ACCESS_TOKEN` — a personal access token, distinct from the project's own anon/secret API keys). `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the platform — no secrets to configure by hand. Re-deploy after any change to `supabase/functions/update-user-email/index.ts`.

## 7. Testing Strategy

Three layers, from fastest/most-isolated to slowest/most-realistic:

*   **Unit / component tests** (`src/__tests__/*.test.js`, Vitest + Vue Test Utils): each component mounted in isolation with fake props. Covers `schemas.js` shape validation, and rendering/emit behavior of `AuthModal`, `ResetPasswordModal`, `PrinterModal`, `UserEditModal`, and `EditorModal` (both profile and filament layouts).
*   **Integration tests** (`src/__tests__/App.integration.test.js`): mounts the full `App.vue` tree with a mocked `@/lib/supabase` module — a thenable "chain" mock standing in for the PostgREST query builder (smart enough to narrow an array fixture by a chained `.eq()` before `.single()`, so one `user_profiles` fixture can serve both "my own row" and "every row" queries), plus mocked `.rpc()` and `.functions.invoke()`. Exercises the actual handler logic in `App.vue` — profile/filament/printer/printer-model/user create, update & delete, forking, favorites, sign out, both halves of password reset, the full access-level matrix (nav gating, elevated vs. admin edit rights, role changes, email changes via the Edge Function, disabled-account write-blocking), and the search scope toggle — asserting on the exact table/payload sent to Supabase and the resulting UI state.
*   **End-to-end tests** (`e2e/*.spec.js`, Playwright): drives the real app in a real Chromium browser against `npm run dev`, with Supabase REST (`/rest/v1/**`), Auth (`/auth/v1/**`), and Edge Function (`/functions/v1/**`) requests intercepted and served canned responses (`e2e/fixtures/supabase-mock.js`) instead of hitting the live project. The REST mock respects `?col=eq.value` filters and the `.single()` Accept header, closely enough to real PostgREST behavior to test role-gated flows properly. This keeps E2E runs deterministic and side-effect-free while still validating the real DOM, routing, and network-request shapes. Run via `npm run test:e2e`.

    > The "recovery" half of password reset (clicking the emailed link and landing back on the app with a valid session) is not covered end-to-end — that requires a real email and a real Supabase-issued token. It's covered at the integration layer instead, by invoking the app's `onAuthStateChange` callback directly with a `PASSWORD_RECOVERY` event. The Edge Function itself (Section 6) is exercised through the mocked network layer only in the test suite — it is deployed live, but there's no automated test that calls the real deployment (that would require a genuine elevated/admin session).

**Reports:** every run prints a per-test pass/fail line to the terminal and also writes a machine-readable report:
*   `npm test` → per-test console output (verbose reporter) + `test-results/unit-report.json`.
*   `npm run test:e2e` → per-test console output (list reporter) + `test-results/e2e-report.json` + a browsable HTML report at `playwright-report/index.html` (open directly, or run `npx playwright show-report`).