-- =================================================================
-- 1. CLEANUP
-- =================================================================
drop table if exists favorites cascade;
drop table if exists filaments cascade;
drop table if exists print_profiles cascade;
drop table if exists printers cascade;
drop table if exists printer_models cascade;
drop table if exists user_profiles cascade;
drop function if exists update_updated_at_column cascade;
drop function if exists printer_model_usage cascade;
drop function if exists handle_new_auth_user cascade;
drop function if exists sync_user_profile_email cascade;
drop function if exists get_my_role cascade;
drop function if exists current_user_disabled cascade;
drop function if exists enforce_user_profile_update_permissions cascade;

-- =================================================================
-- 2. UTILITY FUNCTIONS
-- =================================================================

-- Automatically stamps updated_at on every row modification
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =================================================================
-- 3. CREATE TABLES
-- =================================================================

-- USER PROFILES (app-level account data + access role, one row per auth.users
-- row). Named "user_profiles" rather than Supabase's usual "profiles" because
-- this app already uses "profiles" to mean print profiles everywhere else.
create table user_profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  phone      text,
  role       text not null default 'standard' check (role in ('standard', 'elevated', 'admin')),
  disabled   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at_column();

create index idx_user_profiles_role on user_profiles (role);

-- Auto-create a user_profiles row whenever a new auth user signs up.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Keep user_profiles.email in sync with auth.users.email (self-service email
-- changes or the admin Edge Function both update auth.users directly).
create or replace function sync_user_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.user_profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function sync_user_profile_email();

-- Helpers used both in RLS policies here and on other tables, so a policy
-- never has to re-derive "who am I and am I disabled" from scratch.
create or replace function get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from user_profiles where id = auth.uid();
$$;

create or replace function current_user_disabled()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select disabled from user_profiles where id = auth.uid()), false);
$$;

grant execute on function get_my_role() to authenticated;
grant execute on function current_user_disabled() to authenticated, anon;

-- Fine-grained update rules that plain row-level RLS can't express on its own:
--   - nobody may change their own role or disabled status
--   - editing someone else requires elevated or admin
--   - elevated may only touch users who are currently "standard", and can
--     never change a role (elevation/demotion is admin-only)
create or replace function enforce_user_profile_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := get_my_role();
begin
  if auth.uid() = old.id then
    if new.role is distinct from old.role or new.disabled is distinct from old.disabled then
      raise exception 'You cannot change your own role or enabled status.';
    end if;
    return new;
  end if;

  if caller_role not in ('elevated', 'admin') then
    raise exception 'Insufficient permissions to edit other users.';
  end if;

  if caller_role = 'elevated' then
    if old.role <> 'standard' then
      raise exception 'Elevated users can only manage standard users.';
    end if;
    if new.role is distinct from old.role then
      raise exception 'Only admins can change a user''s role.';
    end if;
  end if;

  return new;
end;
$$;

create trigger user_profiles_enforce_update_permissions
  before update on user_profiles
  for each row execute function enforce_user_profile_update_permissions();


-- PRINTERS (User's physical hardware — private, not shared)
create table printers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  name            text not null,
  model           text not null,
  nozzle_diameter numeric not null default 0.4,
  bed_size_x      numeric not null,
  bed_size_y      numeric not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint printers_nozzle_positive check (nozzle_diameter > 0),
  constraint printers_bed_positive    check (bed_size_x > 0 and bed_size_y > 0)
);

create trigger printers_updated_at
  before update on printers
  for each row execute function update_updated_at_column();

create index idx_printers_user_id on printers (user_id);


-- PRINT PROFILES (Slicer settings — public read, owner write)
-- Must be created before filaments because filaments.print_profile_id references it.
-- printer_model targets a model class (not a printer instance) — FK added below,
-- once printer_models exists, referencing its unique `name` column rather than id
-- so this stays a plain, human-readable text column.
create table print_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  name          text not null,
  printer_model text not null default 'A1 Mini',

  quality jsonb not null default '{
    "layer_height": 0.2,
    "seam_position": "aligned",
    "wall_generator": "arachne",
    "ironing_type": "no_ironing",
    "precision_walls": true,
    "first_layer_height": 0.2,
    "outer_wall_line_width": 0.42
  }'::jsonb,

  strength jsonb not null default '{
    "wall_loops": 2,
    "top_shell_layers": 3,
    "bottom_shell_layers": 3,
    "sparse_infill_density": 15,
    "sparse_infill_pattern": "grid",
    "top_surface_pattern": "monotonic",
    "bottom_surface_pattern": "monotonic",
    "detect_overhang_wall": true
  }'::jsonb,

  speed jsonb not null default '{
    "outer_wall": 200,
    "inner_wall": 300,
    "sparse_infill": 270,
    "solid_infill": 250,
    "top_surface": 200,
    "first_layer": 50,
    "travel": 500,
    "acceleration": 5000
  }'::jsonb,

  support jsonb not null default '{
    "enable": false,
    "type": "tree",
    "style": "tree_slim",
    "threshold_angle": 30
  }'::jsonb,

  others jsonb not null default '{
    "brim_type": "auto",
    "brim_width": 5,
    "skirt_loops": 0,
    "elephant_foot_compensation": 0.0
  }'::jsonb,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger print_profiles_updated_at
  before update on print_profiles
  for each row execute function update_updated_at_column();

create index idx_print_profiles_user_id      on print_profiles (user_id);
create index idx_print_profiles_printer_model on print_profiles (printer_model);

-- Printers reference their default print profile. Added here (rather than inline
-- on the printers table above) because print_profiles must exist first for the FK.
alter table printers add column default_print_profile_id uuid references print_profiles (id) on delete set null;

create index idx_printers_default_print_profile_id on printers (default_print_profile_id);


-- PRINTER MODELS (Shared, community-editable list of target printer models —
-- public read, any signed-in user may insert/delete. printers.model and
-- print_profiles.printer_model are real foreign keys into this table's `name`
-- column below, so a model can't be deleted while anything still uses it, and
-- a rename (if ever added) would cascade to every row referencing it.)
create table printer_models (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- Both existing tables predate this one, so the FKs are added here rather than
-- inline on their original `create table` statements.
alter table printers
  add constraint printers_model_fkey foreign key (model)
  references printer_models (name) on update cascade on delete restrict;

alter table print_profiles
  add constraint print_profiles_printer_model_fkey foreign key (printer_model)
  references printer_models (name) on update cascade on delete restrict;

-- Reports whether each printer model is still referenced by any printer or print
-- profile, across ALL users (security definer bypasses the owner-only RLS on
-- printers), so the UI can warn *before* a delete would be rejected by the FK
-- constraints above — without exposing which printers or whose they are.
create or replace function printer_model_usage()
returns table(name text, in_use boolean)
language sql
security definer
set search_path = public
as $$
  select
    pm.name,
    exists (select 1 from printers p where p.model = pm.name)
    or exists (select 1 from print_profiles pp where pp.printer_model = pm.name) as in_use
  from printer_models pm;
$$;

grant execute on function printer_model_usage() to anon, authenticated;


-- FILAMENTS (Material/chemistry settings — public read, owner write)
create table filaments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  name             text not null,
  print_profile_id uuid references print_profiles (id) on delete set null,

  -- "vendor" is the correct key name used by the app (was incorrectly "brand" in prior schema)
  basic_settings jsonb not null default '{
    "vendor": "Generic",
    "filament_type": "PLA",
    "color": "#000000",
    "diameter": 1.75,
    "flow_ratio": 0.98,
    "density": 1.22,
    "shrinkage": 100,
    "velocity_adaptation": 1,
    "price": 20.00,
    "softening_temp": 45,
    "prime_vol_filament_change": 45,
    "prime_vol_hotend_change": 45,
    "ramming_len_extruder_change": 4.5,
    "ramming_len_hotend_change": 4.5,
    "travel_time_ramming_extruder": 250,
    "travel_time_ramming_hotend": 250,
    "precool_temp_extruder": 140,
    "precool_temp_hotend": 140,
    "idle_temp": 0
  }'::jsonb,

  -- Keys renamed from nozzle_min/nozzle_max to nozzle_temp_min/nozzle_temp_max.
  -- first_layer_bed/other_layers_bed removed; replaced by per-plate bed temp keys.
  temp_settings jsonb not null default '{
    "nozzle_temp_min": 190,
    "nozzle_temp_max": 230,
    "cool_plate_super_initial": 35,
    "cool_plate_super_other": 35,
    "cool_plate_initial": 35,
    "cool_plate_other": 35,
    "eng_plate_initial": 55,
    "eng_plate_other": 55,
    "smooth_pei_initial": 55,
    "smooth_pei_other": 55,
    "textured_pei_initial": 55,
    "textured_pei_other": 55,
    "first_layer_nozzle": 220,
    "other_layers_nozzle": 220,
    "vitrification_temp": 60
  }'::jsonb,

  -- Expanded to mirror the full Bambu Studio Cooling tab (Part + Auxiliary
  -- cooling fan). Replaces the old flat min_layer_time/no_cooling_for_first_layer
  -- fields with the initial-layer-fan and min/max-fan-speed-threshold groups
  -- they were a simplification of.
  cooling_settings jsonb not null default '{
    "close_fan_first_x_layers": 1,
    "initial_fan_speed": 0,
    "full_fan_speed_layer": 0,
    "min_fan_speed": 60,
    "min_fan_speed_layer_time": 80,
    "max_fan_speed": 80,
    "max_fan_speed_layer_time": 6,
    "fan_always_on": true,
    "slow_down_for_cooling": true,
    "dont_slow_down_outer_walls": false,
    "slow_print_speed": 20,
    "force_cooling_for_overhangs": true,
    "overhang_cooling_threshold": 50,
    "overhang_participating_threshold": 100,
    "overhang_fan_speed": 100,
    "pre_start_fan_time": 2,
    "ironing_fan_speed": -1,
    "aux_close_fan_first_x_layers": 1,
    "aux_initial_fan_speed": 0,
    "aux_full_fan_speed_layer": 0,
    "aux_fan_speed": 70
  }'::jsonb,

  -- Added adaptive_volumetric_speed and ramming_vol fields; corrected max_volumetric_speed default to 12.
  -- Expanded to mirror the full Bambu Studio Setting Overrides tab (Retraction
  -- and Speed sections), as flat always-set fields rather than the nullable
  -- per-field "N/A" overrides Bambu Studio shows, since this app has no
  -- lower-priority global config for a disabled field to actually inherit from.
  override_settings jsonb not null default '{
    "adaptive_volumetric_speed": true,
    "max_volumetric_speed": 12,
    "ramming_vol_extruder_change": 12,
    "ramming_vol_hotend_change": 12,
    "retraction_length": 0.8,
    "z_hop": 0.4,
    "z_hop_type": "Normal Lift",
    "retraction_speed": 30,
    "deretraction_speed": 30,
    "retract_restart_extra": 0,
    "retract_before_travel": 2,
    "retract_on_layer_change": false,
    "wipe_while_retracting": false,
    "wipe_distance": 1.0,
    "retract_before_wipe": 100,
    "long_retraction_when_cut": true,
    "retraction_distance_when_cut": 18,
    "override_overhang_speed": false,
    "pressure_advance": 0.02
  }'::jsonb,

  scarf_seam jsonb not null default '{
    "scarf_seam_type": "none",
    "scarf_start_height": 0,
    "scarf_slope_gap": 10,
    "scarf_length": 5
  }'::jsonb,

  notes       text not null default '',

  -- Advanced tab: raw G-code snippets injected on filament change, not
  -- structured settings, so plain text columns like `notes` rather than
  -- another JSONB settings group.
  start_gcode text not null default '',
  end_gcode   text not null default '',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger filaments_updated_at
  before update on filaments
  for each row execute function update_updated_at_column();

create index idx_filaments_user_id          on filaments (user_id);
create index idx_filaments_print_profile_id on filaments (print_profile_id);


-- FAVORITES (Private join table — exactly one of print_profile_id or filament_id must be set)
create table favorites (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  print_profile_id uuid references print_profiles (id) on delete cascade,
  filament_id      uuid references filaments (id) on delete cascade,
  created_at       timestamptz not null default now(),
  -- Enforces that each row represents exactly one type of favorite
  constraint favorites_one_type check (
    (print_profile_id is not null)::int + (filament_id is not null)::int = 1
  ),
  constraint favorites_unique_profile unique (user_id, print_profile_id),
  constraint favorites_unique_filament unique (user_id, filament_id)
);

create index idx_favorites_user_id          on favorites (user_id);
create index idx_favorites_print_profile_id on favorites (print_profile_id);
create index idx_favorites_filament_id      on favorites (filament_id);


-- =================================================================
-- 4. SECURITY (Row Level Security)
-- =================================================================
alter table printers       enable row level security;
alter table print_profiles enable row level security;
alter table filaments      enable row level security;
alter table favorites      enable row level security;
alter table printer_models enable row level security;
alter table user_profiles  enable row level security;

-- PRINTERS: visible and writable by owner only. Reads stay available to a
-- disabled account (see USER PROFILES below); only writes are blocked.
create policy "printers_select_own" on printers for select using (auth.uid() = user_id);
create policy "printers_insert_own" on printers for insert with check (auth.uid() = user_id and not current_user_disabled());
create policy "printers_update_own" on printers for update using (auth.uid() = user_id and not current_user_disabled());
create policy "printers_delete_own" on printers for delete using (auth.uid() = user_id and not current_user_disabled());

-- PRINT PROFILES: public read; insert/update/delete restricted to owner
create policy "profiles_select_all"   on print_profiles for select using (true);
create policy "profiles_insert_own"   on print_profiles for insert with check (auth.uid() = user_id and not current_user_disabled());
create policy "profiles_update_own"   on print_profiles for update using (auth.uid() = user_id and not current_user_disabled());
create policy "profiles_delete_own"   on print_profiles for delete using (auth.uid() = user_id and not current_user_disabled());

-- FILAMENTS: public read; insert/update/delete restricted to owner
create policy "filaments_select_all"  on filaments for select using (true);
create policy "filaments_insert_own"  on filaments for insert with check (auth.uid() = user_id and not current_user_disabled());
create policy "filaments_update_own"  on filaments for update using (auth.uid() = user_id and not current_user_disabled());
create policy "filaments_delete_own"  on filaments for delete using (auth.uid() = user_id and not current_user_disabled());

-- FAVORITES: fully private, split per-command (rather than one "for all"
-- policy) so the disabled check applies to writes without affecting reads.
create policy "favorites_select_own" on favorites for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on favorites for insert with check (auth.uid() = user_id and not current_user_disabled());
create policy "favorites_update_own" on favorites for update using (auth.uid() = user_id and not current_user_disabled());
create policy "favorites_delete_own" on favorites for delete using (auth.uid() = user_id and not current_user_disabled());

-- PRINTER MODELS: public read; any signed-in, non-disabled user may add or
-- remove (removal is additionally blocked by the printers/print_profiles FK
-- constraints whenever the model is still in use)
create policy "printer_models_select_all"        on printer_models for select using (true);
create policy "printer_models_insert_authenticated" on printer_models for insert with check (auth.uid() is not null and not current_user_disabled());
create policy "printer_models_delete_authenticated" on printer_models for delete using (auth.uid() is not null and not current_user_disabled());

-- USER PROFILES: everyone can see their own row; elevated/admin can see every
-- row (needed for the Users list/search). No insert/delete policy — rows are
-- only ever created by the handle_new_auth_user trigger (security definer,
-- bypasses RLS) and are never deleted. Column/role-level update rules (who
-- can change what) are enforced by enforce_user_profile_update_permissions
-- above, not by RLS itself.
create policy "user_profiles_select" on user_profiles
  for select using (auth.uid() = id or get_my_role() in ('elevated', 'admin'));

create policy "user_profiles_update" on user_profiles
  for update using (auth.uid() = id or get_my_role() in ('elevated', 'admin'));


-- =================================================================
-- 5. SEED DATA (User: 2fde1eae-bbd6-42c3-a02b-3851021923f3)
-- =================================================================
-- Assumes this auth.users row already exists (created via normal sign-up
-- before running this script) — same assumption the printers/print_profiles
-- inserts below already make via their user_id FK.

insert into user_profiles (id, email, role) values
  ('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'demo@example.com', 'admin')
  on conflict (id) do nothing;

insert into printer_models (name) values
  ('A1 Mini'), ('A1'), ('P1P'), ('P1S'), ('X1'), ('X1 Carbon'), ('X1E');

insert into printers (user_id, name, model, nozzle_diameter, bed_size_x, bed_size_y) values
  ('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'My A1 Mini',   'A1 Mini',   0.4, 180, 180),
  ('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'My X1 Carbon', 'X1 Carbon', 0.4, 256, 256);

insert into print_profiles (user_id, name, printer_model) values
  ('2fde1eae-bbd6-42c3-a02b-3851021923f3', '0.20mm Standard @A1Mini', 'A1 Mini');

insert into print_profiles (user_id, name, printer_model, speed) values
  (
    '2fde1eae-bbd6-42c3-a02b-3851021923f3',
    '0.20mm Standard @X1C',
    'X1 Carbon',
    '{
      "outer_wall": 200,
      "inner_wall": 300,
      "sparse_infill": 270,
      "solid_infill": 250,
      "top_surface": 200,
      "first_layer": 50,
      "travel": 500,
      "acceleration": 10000
    }'::jsonb
  );

insert into filaments (user_id, name) values
  ('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'Generic PLA');
