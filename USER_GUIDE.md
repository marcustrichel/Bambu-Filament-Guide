# BambuDB User Guide

BambuDB is a place to store, share, and reuse print profiles, filament settings, and printer configurations for Bambu Lab printers (A1 Mini, A1, P1P, P1S, X1, X1 Carbon, X1E).

## Getting Around

The sidebar has four sections:

- **📄 Print Profiles** — slicer settings (layer height, speed, supports, etc.), targeted at a printer model.
- **🧶 Filaments** — material settings (temperatures, cooling, flow) for a specific filament.
- **🖨️ Printers** — your own physical printers, each with an optional default print profile.
- **🔧 Printer Models** — the shared list of target printer models used by the two sections above.

You can browse Print Profiles, Filaments, and Printer Models without an account — these are all visible to everyone (read-only unless you own them, or in the case of Printer Models, unless you're signed in to add/remove). Printers are private: you only ever see your own.

## Searching

At the top of the sidebar is a search box with three scope buttons: **profiles**, **filaments**, and **both** (the default). Type a few letters of a name and the main area switches to a **Search Results** view showing whichever type(s) you've scoped it to — clear the box to go back to whatever tab you were on. It only matches against names, not vendor, printer model, or any of the detailed settings.

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

Open one of your own profiles and change any field, then **Save Changes**. The **Target** printer can only be set while creating a new profile — once saved, it's locked (so an existing profile's tuned settings can't get reset out from under it by accident). If you close the editor with unsaved changes, you'll be asked to confirm before they're discarded.

### Cloning a Profile

There are two ways to copy a profile — both create your own editable copy named "*(original name)* (Copy)" and leave the original untouched:

- Click **Fork** on a card in the grid (visible when signed in, on profiles you don't own).
- Click **Clone** in the bottom-left of the editor while viewing any saved profile (yours or someone else's) — handy if you've already opened it and want a variant. Clone isn't available until the profile has been saved at least once.

### Favoriting

Click the ★ on any profile card to star it. Favorites are private to your account.

## Filaments

### Browsing

Each filament card shows its name, vendor, first-layer nozzle temperature, and max fan speed, plus a color swatch.

### Creating a Filament

1. Switch to the **Filaments** tab and click **+ New Filament**.
2. The filament editor is organized into tabs: **Filament** (basic info + temperatures), **Cooling**, **Setting Overrides**, **Notes**, and more.
3. Pick one of your print profiles from the **Profile** dropdown in the toolbar — this is required, so if you haven't created a print profile yet, do that first. It defaults to your first profile so you don't have to touch it if that's the one you want.
4. Click **Save Changes**.

### Editing

Open a filament you own the same way as profiles — click its card, adjust values, save. Community filaments open read-only.

### Cloning a Filament

Click **Clone** in the bottom-left of the filament editor to make your own editable copy of any saved filament (yours or someone else's), named "*(original name)* (Copy)". Available once the filament has been saved at least once.

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

## Printer Models

This is the shared list of printer models offered in the **Target** dropdown (Print Profiles) and **Model** dropdown (Printers). Everyone sees the same list.

### Adding a Model

While signed in, type a name (e.g. "H2D") into the box at the top of the Printer Models page and click **Add**. It's immediately available to everyone.

### Removing a Model

Each model shows either:
- A 🗑 button, if it's not currently used by any printer or print profile — click it and confirm to remove it.
- A ⚠️ icon, if it's still in use — hover over it to see why. You can't remove a model that's still referenced; switch anything using it to a different model first (removing a model does **not** change profiles/printers that already reference it by name — it just takes it out of the picker for new ones).

## Account Access Levels

Every account has one of three roles, visible in the sidebar under your email (nothing shown means **standard**, the default for everyone who signs up):

- **Standard** — normal use of the app: your own profiles/filaments/printers, favorites, and the shared Printer Models list.
- **Elevated** — everything standard, plus a **👥 Users** section for managing **standard** accounts: edit their name/phone, enable or disable them, send a password reset, or change their email. Elevated accounts can't touch other elevated or admin accounts, and can't change anyone's role.
- **Admin** — everything elevated, but for *any* account (including other admins), plus the ability to change a user's role.

Roles are assigned by an admin from the Users page — there's no self-service way to become elevated or admin, and nobody (not even an admin) can change their own role or disable themselves.

### Managing Users (Elevated / Admin)

1. Click **👥 Users** in the sidebar (only visible if your account is elevated or admin).
2. Search by email or name using the box at the top.
3. Click **Edit** on a row you're permitted to manage (rows you can't touch simply won't have an Edit button).
4. In the dialog, you can:
   - Update **Name** and **Phone**.
   - Toggle **Account Disabled** — a disabled account can still sign in and view its data, but can't create, edit, delete, or favorite anything anywhere in the app.
   - Change the **Role** (admins only — the dropdown is locked for elevated users).
   - Click **Change Email** to set a new login email for that user.
   - Click **Send Password Reset Email** to send them the same reset link they'd get from "Forgot password?".
5. Click **Save Changes**.

If your own account is disabled, you'll see an "Account disabled" notice in the sidebar and every "+ New ..." button disappears — you're in read-only mode until an elevated or admin user re-enables you.

## Signing Out

Click **Sign Out** at the bottom of the sidebar. Your favorites and private printers stay saved in your account for next time — you just won't be able to see or edit them (or your own profiles/filaments) until you sign back in.
