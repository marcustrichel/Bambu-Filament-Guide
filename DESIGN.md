# Bambu Filament Guide - Design & Specification

## 1. Project Overview
A web application to manage, share, and customize 3D printing profiles and filament settings for Bambu Lab printers (A1 Mini, X1 Carbon, etc.). It allows users to view community profiles, create their own, and manage a personal library.

## 2. Architecture
*   **Frontend:** Vue.js 3 (Composition API) built with Vite.
*   **Styling:** Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL Database, Authentication).
*   **State Management:** Reactive Vue refs in `App.vue`.

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

*   **`printers`**
    *   `id` (UUID, PK).
    *   `name` (Text).
    *   `model` (Text).
    *   `bed_size_x`, `bed_size_y` (Number).
    *   `nozzle_diameter` (Number).

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
    *   Simple form for Login/Signup.
    *   Emits `authenticate` event.

### `constants/schemas.js`
*   **Responsibilities:**
    *   Single source of truth for configuration fields.
    *   Defines UI labels, types, and tooltips.