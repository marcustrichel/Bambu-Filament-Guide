-- =================================================================
-- 1. CLEANUP
-- =================================================================
drop table if exists favorites cascade;
drop table if exists filaments cascade;
drop table if exists print_profiles cascade;
drop table if exists printers cascade;
drop function if exists update_updated_at_column cascade;

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
-- printer_model is intentionally denormalized text (targets a model class, not a printer instance).
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

  cooling_settings jsonb not null default '{
    "min_fan_speed": 100,
    "max_fan_speed": 100,
    "min_layer_time": 8,
    "fan_always_on": true,
    "aux_fan_speed": 70,
    "no_cooling_for_first_layer": true,
    "slow_down_for_cooling": true,
    "slow_print_speed": 50,
    "force_cooling_for_overhangs": false
  }'::jsonb,

  -- Added adaptive_volumetric_speed and ramming_vol fields; corrected max_volumetric_speed default to 12
  override_settings jsonb not null default '{
    "adaptive_volumetric_speed": true,
    "max_volumetric_speed": 12,
    "ramming_vol_extruder_change": 12,
    "ramming_vol_hotend_change": 12,
    "retraction_length": 0.8,
    "z_hop": 0.4,
    "pressure_advance": 0.02,
    "wipe_distance": 1.0
  }'::jsonb,

  scarf_seam jsonb not null default '{
    "scarf_seam_type": "none",
    "scarf_start_height": 0,
    "scarf_slope_gap": 10,
    "scarf_length": 5
  }'::jsonb,

  notes       text not null default '',

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

-- PRINTERS: visible and writable by owner only
create policy "printers_select_own" on printers for select using (auth.uid() = user_id);
create policy "printers_insert_own" on printers for insert with check (auth.uid() = user_id);
create policy "printers_update_own" on printers for update using (auth.uid() = user_id);
create policy "printers_delete_own" on printers for delete using (auth.uid() = user_id);

-- PRINT PROFILES: public read; insert/update/delete restricted to owner
create policy "profiles_select_all"   on print_profiles for select using (true);
create policy "profiles_insert_own"   on print_profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own"   on print_profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own"   on print_profiles for delete using (auth.uid() = user_id);

-- FILAMENTS: public read; insert/update/delete restricted to owner
create policy "filaments_select_all"  on filaments for select using (true);
create policy "filaments_insert_own"  on filaments for insert with check (auth.uid() = user_id);
create policy "filaments_update_own"  on filaments for update using (auth.uid() = user_id);
create policy "filaments_delete_own"  on filaments for delete using (auth.uid() = user_id);

-- FAVORITES: fully private (all operations require ownership)
create policy "favorites_all_own" on favorites for all using (auth.uid() = user_id);


-- =================================================================
-- 5. SEED DATA (User: 2fde1eae-bbd6-42c3-a02b-3851021923f3)
-- =================================================================

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
