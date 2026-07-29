-- Backfills the expanded Setting Overrides fields (Retraction section: Z hop
-- type, retraction/deretraction speed, extra length on restart, travel
-- distance threshold, retract-on-layer-change, wipe toggles, retract amount
-- before wipe, long retraction when cut; Speed section: override overhang
-- speed) into existing filament records. Uses jsonb `||` merge so only
-- missing keys are added and any values a user has already customized are
-- left untouched. Also updates the column default so newly created rows get
-- the same shape.

ALTER TABLE filaments
  ALTER COLUMN override_settings SET DEFAULT '{
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
  }'::jsonb;

UPDATE filaments
SET override_settings = '{
    "z_hop_type": "Normal Lift",
    "retraction_speed": 30,
    "deretraction_speed": 30,
    "retract_restart_extra": 0,
    "retract_before_travel": 2,
    "retract_on_layer_change": false,
    "wipe_while_retracting": false,
    "retract_before_wipe": 100,
    "long_retraction_when_cut": true,
    "retraction_distance_when_cut": 18,
    "override_overhang_speed": false
  }'::jsonb || override_settings;
