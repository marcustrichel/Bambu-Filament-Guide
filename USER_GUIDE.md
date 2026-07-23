# BambuDB User Guide

BambuDB is a place to store, share, and reuse print profiles, filament settings, and printer configurations for Bambu Lab printers (A1 Mini, A1, P1P, P1S, X1, X1 Carbon, X1E).

## Getting Around

The sidebar has three sections:

- **📄 Print Profiles** — slicer settings (layer height, speed, supports, etc.), targeted at a printer model.
- **🧶 Filaments** — material settings (temperatures, cooling, flow) for a specific filament.
- **🖨️ Printers** — your own physical printers, each with an optional default print profile.

You can browse Print Profiles and Filaments without an account — everyone's profiles are visible to everyone (read-only unless you own them). Printers are private: you only ever see your own.

## Creating an Account

1. Click **Sign In / Up** in the bottom-left of the sidebar.
2. Enter an email and password, then click **Need an account? Sign Up**.
3. If email confirmation is enabled on the project, check your inbox and confirm before signing in.

## Signing In

1. Click **Sign In / Up**.
2. Enter your email and password and click **Sign In**.

## Resetting Your Password

Forgot your password? You don't need to remember it to get back in:

1. Click **Sign In / Up**, then click **Forgot password?**.
2. Enter your email and click **Send Reset Link**.
3. Check your email for a message from Supabase with a reset link. Click it — it brings you back to BambuDB.
4. A **Set a New Password** dialog opens automatically. Enter and confirm your new password (at least 6 characters) and click **Update Password**.

You can click **Back to Sign In** at any point before sending the email if you remembered your password after all.

## Print Profiles

### Browsing

Every profile shows its name, owner ("My Profile" or "Community"), target printer model, layer height, and acceleration at a glance. Click a card to see the full settings.

- **Your own profiles** open in an editable form.
- **Other people's profiles** open read-only, marked "Read Only."

### Creating a Profile

1. While signed in, click **+ New Profile** above the profile grid.
2. Give it a name and pick a **Target** printer model from the dropdown next to it. Changing this updates the **Speed** tab to that model's recommended defaults (e.g. faster acceleration for X1 Carbon than A1 Mini) — the other tabs are unaffected.
3. Adjust settings across the five tabs: **Quality**, **Strength**, **Speed**, **Support**, **Others**. Hover over a field for a description of what it does.
4. Click **Save Changes**.

### Editing

Open one of your own profiles and change any field, then **Save Changes**. Changing the **Target** model resets the Speed tab to that model's defaults, so re-check your speed settings after switching targets. If you close the editor with unsaved changes, you'll be asked to confirm before they're discarded.

### Forking (Copying) a Community Profile

Found someone else's profile you want to tweak? Click **Fork** on the card (visible when signed in, on profiles you don't own). This creates your own editable copy named "*(original name)* (Copy)" — the original is untouched.

### Favoriting

Click the ★ on any profile card to star it. Favorites are private to your account.

## Filaments

### Browsing

Each filament card shows its name, vendor, first-layer nozzle temperature, and max fan speed, plus a color swatch.

### Creating a Filament

1. Switch to the **Filaments** tab and click **+ New Filament**.
2. The filament editor is organized into tabs: **Filament** (basic info + temperatures), **Cooling**, **Setting Overrides**, **Notes**, and more.
3. Optionally link the filament to one of your print profiles using the **Profile** dropdown in the toolbar — this is just a reference, not required.
4. Click the 💾 save icon in the toolbar to save.

### Editing

Open a filament you own the same way as profiles — click its card, adjust values, save. Community filaments open read-only.

## Printers

Printers are your personal equipment list — only you can see and manage them.

### Adding a Printer

1. Switch to the **Printers** tab and click **+ New Printer** (you must be signed in — otherwise you'll see a sign-in prompt instead of the table).
2. Fill in:
   - **Name** — whatever you want to call it, e.g. "Garage A1 Mini".
   - **Model** — pick from the supported Bambu models.
   - **Nozzle**, **Bed X**, **Bed Y** — your printer's hardware specs.
   - **Default Print Profile** — optional; pick any profile (yours or a community one) to use as the starting point whenever you print on this machine.
3. Click **Save Changes**.

### Changing a Printer's Default Profile

1. Click the printer's row in the Printers table to reopen the editor.
2. Change the **Default Print Profile** dropdown to a different profile (or "None" to clear it).
3. Click **Save Changes**. The Printers table's "Default Profile" column updates immediately.

## Signing Out

Click **Sign Out** at the bottom of the sidebar. Your favorites and private printers stay saved in your account for next time — you just won't be able to see or edit them (or your own profiles/filaments) until you sign back in.
