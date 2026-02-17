-- =================================================================
-- 1. CLEANUP
-- =================================================================
drop table if exists favorites cascade;
drop table if exists print_profiles cascade;
drop table if exists filaments cascade;
drop table if exists printers cascade;
create extension if not exists "uuid-ossp";

-- =================================================================
-- 2. CREATE TABLES WITH STRICT DEFAULTS
-- =================================================================

-- PRINTERS (Hardware)
create table printers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  model text not null, -- 'A1 Mini', 'X1 Carbon'
  nozzle_diameter numeric default 0.4,
  bed_size_x numeric not null,
  bed_size_y numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- FILAMENTS (Chemistry)
-- Default values represent a safe "Generic PLA"
create table filaments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  
  -- 1. Basic
  basic_settings jsonb not null default '{
    "brand": "Generic", 
    "material": "PLA", 
    "color": "#000000", 
    "density": 1.24, 
    "diameter": 1.75, 
    "price": 20.00
  }'::jsonb,

  -- 2. Temperature
  temp_settings jsonb not null default '{
    "nozzle_min": 190, 
    "nozzle_max": 230, 
    "first_layer_nozzle": 220, 
    "other_layers_nozzle": 220, 
    "first_layer_bed": 65, 
    "other_layers_bed": 65,
    "vitrification_temp": 55
  }'::jsonb,

  -- 3. Cooling (NEW)
  cooling_settings jsonb not null default '{
    "min_fan_speed": 100, 
    "max_fan_speed": 100, 
    "min_layer_time": 8,
    "fan_always_on": true,
    "aux_fan_speed": 0
  }'::jsonb,

  -- 4. Overrides
  override_settings jsonb not null default '{
    "retraction_length": 0.8, 
    "z_hop": 0.4, 
    "max_volumetric_speed": 15
  }'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PRINT PROFILES (Physics)
-- Default values represent "0.20mm Standard"
create table print_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  printer_model text not null default 'A1 Mini', -- Targets specific printer
  
  -- 1. Quality
  quality jsonb not null default '{
    "layer_height": 0.2, 
    "seam_position": "aligned", 
    "wall_generator": "arachne",
    "ironing_type": "no_ironing",
    "precision_walls": true
  }'::jsonb,

  -- 2. Strength
  strength jsonb not null default '{
    "wall_loops": 2, 
    "top_shell_layers": 3,
    "bottom_shell_layers": 3,
    "sparse_infill_density": 15, 
    "sparse_infill_pattern": "grid"
  }'::jsonb,

  -- 3. Speed (Expanded with Acceleration)
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

  -- 4. Support
  support jsonb not null default '{
    "enable": false, 
    "type": "tree", 
    "style": "tree_slim",
    "threshold_angle": 30
  }'::jsonb,
  
  -- 5. Others (Brims/Skirts)
  others jsonb not null default '{
    "brim_type": "auto",
    "brim_width": 5,
    "skirt_loops": 0
  }'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- FAVORITES
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  print_profile_id uuid references print_profiles on delete cascade,
  filament_id uuid references filaments on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_profile_fav unique (user_id, print_profile_id),
  constraint unique_filament_fav unique (user_id, filament_id)
);

-- =================================================================
-- 3. SECURITY (RLS)
-- =================================================================
alter table printers enable row level security;
alter table filaments enable row level security;
alter table print_profiles enable row level security;
alter table favorites enable row level security;

-- Policies (Public Read / Owner Write)
create policy "Public Read Profiles" on print_profiles for select using (true);
create policy "Auth Create Profiles" on print_profiles for insert with check (auth.role() = 'authenticated');
create policy "Owner Edit Profiles" on print_profiles for update using (auth.uid() = user_id);
create policy "Owner Delete Profiles" on print_profiles for delete using (auth.uid() = user_id);

create policy "Public Read Filaments" on filaments for select using (true);
create policy "Auth Create Filaments" on filaments for insert with check (auth.role() = 'authenticated');
create policy "Owner Edit Filaments" on filaments for update using (auth.uid() = user_id);
create policy "Owner Delete Filaments" on filaments for delete using (auth.uid() = user_id);

create policy "Manage Own Favorites" on favorites for all using (auth.uid() = user_id);
create policy "Manage Own Printers" on printers for all using (auth.uid() = user_id);


-- =================================================================
-- 4. INSERT DATA (For User: 2fde1eae-bbd6-42c3-a02b-3851021923f3)
-- =================================================================

-- A. Hardware
INSERT INTO printers (user_id, name, model, nozzle_diameter, bed_size_x, bed_size_y) VALUES 
('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'My A1 Mini', 'A1 Mini', 0.4, 180, 180),
('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'My X1 Carbon', 'X1 Carbon', 0.4, 256, 256);

-- B. Filaments (Generic PLA Defaults)
INSERT INTO filaments (user_id, name) VALUES 
('2fde1eae-bbd6-42c3-a02b-3851021923f3', 'Generic PLA'); 
-- Note: All columns default to the Generic PLA settings defined in Table Create

-- C. Print Profiles
-- 1. A1 Mini Standard
INSERT INTO print_profiles (user_id, name, printer_model) VALUES
('2fde1eae-bbd6-42c3-a02b-3851021923f3', '0.20mm Standard @A1Mini', 'A1 Mini');

-- 2. X1 Carbon Standard (Has higher acceleration)
INSERT INTO print_profiles (user_id, name, printer_model, speed) VALUES
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
    "acceleration": 10000 -- Higher accel for X1C
  }'::jsonb
);
