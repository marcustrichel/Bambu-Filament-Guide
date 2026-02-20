-- This script updates existing "Generic PLA" filament records with the latest default values.
-- It merges the new default values into the existing settings, so only the specified fields are changed.

UPDATE filaments
SET
  basic_settings = basic_settings || '{"flow_ratio": 0.98, "density": 1.24}'::jsonb,
  temp_settings = temp_settings || '{"vitrification_temp": 60, "cool_plate_initial": 35, "cool_plate_other": 35, "smooth_pei_initial": 55, "smooth_pei_other": 55, "textured_pei_initial": 55, "textured_pei_other": 55, "first_layer_nozzle": 220, "other_layers_nozzle": 220}'::jsonb,
  override_settings = override_settings || '{"max_volumetric_speed": 12, "retraction_length": 0.8, "z_hop": 0.4}'::jsonb
WHERE
  name LIKE 'Generic PLA%';
