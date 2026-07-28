-- Backfills the expanded Cooling tab fields (Initial Layer Fan, Linear Ramp Up,
-- Min/Max Fan Speed Threshold, Auxiliary Part Cooling Fan, etc.) into existing
-- filament records. Uses jsonb `||` merge so only missing/changed keys are
-- added and any values a user has already customized are left untouched.
-- Also updates the column default so newly created rows get the same shape.

ALTER TABLE filaments
  ALTER COLUMN cooling_settings SET DEFAULT '{
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
  }'::jsonb;

UPDATE filaments
SET cooling_settings = '{
    "close_fan_first_x_layers": 1,
    "initial_fan_speed": 0,
    "full_fan_speed_layer": 0,
    "min_fan_speed_layer_time": 80,
    "max_fan_speed_layer_time": 6,
    "dont_slow_down_outer_walls": false,
    "overhang_cooling_threshold": 50,
    "overhang_participating_threshold": 100,
    "overhang_fan_speed": 100,
    "pre_start_fan_time": 2,
    "ironing_fan_speed": -1,
    "aux_close_fan_first_x_layers": 1,
    "aux_initial_fan_speed": 0,
    "aux_full_fan_speed_layer": 0
  }'::jsonb || cooling_settings;
