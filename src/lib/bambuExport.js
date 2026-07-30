// Converts BambuDB print profiles and filaments into Bambu Studio's own
// preset JSON format, so they can be dropped straight into the app's user
// preset folder (File > Import > Import Configs, or copied into
// %AppData%\BambuStudio\user\<id>\print or \filament and restarting Bambu
// Studio).
//
// Bambu Studio presets are a leaf in an inheritance chain — a leaf file only
// needs to carry the fields that differ from its `inherits` parent. We take
// advantage of that: for print profiles we only emit a field when it differs
// from BambuDB's own schema default (letting anything untouched fall back to
// Bambu Studio's own built-in default via `inherits`), while filaments —
// where getting a temperature or flow value wrong has real consequences —
// are exported in full every time, using whatever is actually stored for
// that filament.
//
// The key names and value formats below (e.g. "elefant_foot_compensation",
// percent-suffixed strings, per-extruder arrays for speed/acceleration
// fields) were verified against Bambu Studio's own shipped profiles at
// https://github.com/bambulab/BambuStudio/tree/master/resources/profiles/BBL.
// Fields without a confirmed real-world key are intentionally left out —
// Bambu Studio just uses its own default for those, rather than risk writing
// a wrong or malformed value.

import { profileSchema } from '@/constants/schemas';

const PRINTER_COMPATIBLE_NAME = {
  'A1 Mini': 'Bambu Lab A1 mini 0.4 nozzle',
  'A1': 'Bambu Lab A1 0.4 nozzle',
  'P1P': 'Bambu Lab P1P 0.4 nozzle',
  'P1S': 'Bambu Lab P1S 0.4 nozzle',
  'X1': 'Bambu Lab X1 0.4 nozzle',
  'X1 Carbon': 'Bambu Lab X1 Carbon 0.4 nozzle',
  'X1E': 'Bambu Lab X1E 0.4 nozzle',
};

// [ourTab, ourKey, bambuKey, kind]
// kind: 'str' | 'bool' | 'percent' | 'raw' (already-formatted text field) |
//       an { ourValue: bambuValue } lookup | a (value) => bambuValue|undefined function
const PROCESS_MAP = [
  // Quality
  ['quality', 'layer_height', 'layer_height', 'str'],
  ['quality', 'first_layer_height', 'initial_layer_print_height', 'str'],
  ['quality', 'line_width_default', 'line_width', 'str'],
  ['quality', 'line_width_initial_layer', 'initial_layer_line_width', 'str'],
  ['quality', 'outer_wall_line_width', 'outer_wall_line_width', 'str'],
  ['quality', 'line_width_inner_wall', 'inner_wall_line_width', 'str'],
  ['quality', 'line_width_top_surface', 'top_surface_line_width', 'str'],
  ['quality', 'line_width_sparse_infill', 'sparse_infill_line_width', 'str'],
  ['quality', 'line_width_internal_solid_infill', 'internal_solid_infill_line_width', 'str'],
  ['quality', 'line_width_support', 'support_line_width', 'str'],
  ['quality', 'seam_position', 'seam_position', 'str'],
  ['quality', 'seam_away_from_overhangs', 'seam_placement_away_from_overhangs', 'bool'],
  ['quality', 'scarf_application_angle_threshold', 'scarf_angle_threshold', 'str'],
  ['quality', 'override_filament_scarf_seam_setting', 'override_filament_scarf_seam_setting', 'bool'],
  ['quality', 'resolution', 'resolution', 'str'],
  ['quality', 'arc_fitting', 'enable_arc_fitting', 'bool'],
  ['quality', 'xy_hole_compensation', 'xy_hole_compensation', 'str'],
  ['quality', 'xy_contour_compensation', 'xy_contour_compensation', 'str'],
  ['quality', 'auto_circle_compensation', 'enable_circle_compensation', 'bool'],
  ['quality', 'elephant_foot_compensation', 'elefant_foot_compensation', 'str'],
  ['quality', 'ironing_type', 'ironing_type', { no_ironing: 'no ironing', top_surfaces: 'top surface', all_top: 'all top' }],
  ['quality', 'wall_generator', 'wall_generator', 'str'],
  ['quality', 'bridge_flow', 'bridge_flow', 'str'],
  ['quality', 'only_one_wall_top_surfaces', 'only_one_wall_top', (v) => (v === 'None' ? '0' : '1')],
  ['quality', 'smooth_coefficient', 'smooth_coefficient', 'str'],
  ['quality', 'avoid_crossing_wall', 'reduce_crossing_wall', 'bool'],

  // Strength
  ['strength', 'wall_loops', 'wall_loops', 'str'],
  ['strength', 'detect_thin_wall', 'detect_thin_wall', 'bool'],
  ['strength', 'detect_overhang_wall', 'detect_overhang_wall', 'bool'],
  ['strength', 'top_surface_pattern', 'top_surface_pattern', { monotonic: 'monotonic', monotonic_line: 'monotonicline', concentric: 'concentric', rectilinear: 'rectilinear', aligned_rectilinear: 'alignedrectilinear', grid: 'grid', zig_zag: 'zigzag' }],
  ['strength', 'top_surface_density', 'top_surface_density', 'str'],
  ['strength', 'top_shell_layers', 'top_shell_layers', 'str'],
  ['strength', 'top_shell_thickness', 'top_shell_thickness', 'str'],
  ['strength', 'top_paint_penetration_layers', 'top_color_penetration_layers', 'str'],
  ['strength', 'bottom_surface_pattern', 'bottom_surface_pattern', { monotonic: 'monotonic', monotonic_line: 'monotonicline', concentric: 'concentric', rectilinear: 'rectilinear', aligned_rectilinear: 'alignedrectilinear', grid: 'grid', zig_zag: 'zigzag' }],
  ['strength', 'bottom_surface_density', 'bottom_surface_density', 'str'],
  ['strength', 'bottom_shell_layers', 'bottom_shell_layers', 'str'],
  ['strength', 'bottom_shell_thickness', 'bottom_shell_thickness', 'str'],
  ['strength', 'bottom_paint_penetration_layers', 'bottom_color_penetration_layers', 'str'],
  ['strength', 'sparse_infill_density', 'sparse_infill_density', 'percent'],
  ['strength', 'fill_multiline', 'fill_multiline', 'str'],
  ['strength', 'sparse_infill_pattern', 'sparse_infill_pattern', 'str'],
  ['strength', 'infill_wall_overlap', 'infill_wall_overlap', 'percent'],
  ['strength', 'infill_direction', 'infill_direction', 'str'],
  ['strength', 'min_sparse_infill_threshold', 'minimum_sparse_infill_area', 'str'],
  ['strength', 'infill_combination', 'infill_combination', 'bool'],

  // Speed (every field here is a per-extruder array in Bambu Studio's format)
  ['speed', 'first_layer', 'initial_layer_speed', 'str'],
  ['speed', 'initial_layer_infill', 'initial_layer_infill_speed', 'str'],
  ['speed', 'outer_wall', 'outer_wall_speed', 'str'],
  ['speed', 'inner_wall', 'inner_wall_speed', 'str'],
  ['speed', 'small_perimeters', 'small_perimeter_speed', 'raw'],
  ['speed', 'small_perimeter_threshold', 'small_perimeter_threshold', 'str'],
  ['speed', 'sparse_infill', 'sparse_infill_speed', 'str'],
  ['speed', 'solid_infill', 'internal_solid_infill_speed', 'str'],
  ['speed', 'vertical_shell_speed', 'vertical_shell_speed', 'raw'],
  ['speed', 'top_surface', 'top_surface_speed', 'str'],
  ['speed', 'slow_down_for_overhangs', 'enable_overhang_speed', 'bool'],
  ['speed', 'overhang_speed_10', 'overhang_1_4_speed', 'str'],
  ['speed', 'overhang_speed_25', 'overhang_2_4_speed', 'str'],
  ['speed', 'overhang_speed_50', 'overhang_3_4_speed', 'str'],
  ['speed', 'overhang_speed_75', 'overhang_4_4_speed', 'str'],
  ['speed', 'overhang_speed_100', 'overhang_totally_speed', 'str'],
  ['speed', 'slow_down_by_height', 'enable_height_slowdown', 'bool'],
  ['speed', 'bridge_speed', 'bridge_speed', 'str'],
  ['speed', 'gap_infill_speed', 'gap_infill_speed', 'str'],
  ['speed', 'support_speed', 'support_speed', 'str'],
  ['speed', 'support_interface_speed', 'support_interface_speed', 'str'],
  ['speed', 'travel', 'travel_speed', 'str'],
  ['speed', 'acceleration', 'default_acceleration', 'str'],
  ['speed', 'travel_acceleration', 'travel_acceleration', 'str'],
  ['speed', 'initial_layer_travel_acceleration', 'initial_layer_travel_acceleration', 'str'],
  ['speed', 'initial_layer_acceleration', 'initial_layer_acceleration', 'str'],
  ['speed', 'outer_wall_acceleration', 'outer_wall_acceleration', 'str'],
  ['speed', 'inner_wall_acceleration', 'inner_wall_acceleration', 'str'],
  ['speed', 'top_surface_acceleration', 'top_surface_acceleration', 'str'],
  ['speed', 'sparse_infill_acceleration', 'sparse_infill_acceleration', 'raw'],

  // Support
  ['support', 'enable', 'enable_support', 'bool'],
  ['support', 'type', 'support_type', 'str'],
  ['support', 'style', 'support_style', 'str'],
  ['support', 'threshold_angle', 'support_threshold_angle', 'str'],
  ['support', 'on_build_plate_only', 'support_on_build_plate_only', 'bool'],
  ['support', 'raft_layers', 'raft_layers', 'str'],
  ['support', 'support_filament', 'support_filament', (v) => (v === 'Default' ? '0' : undefined)],
  ['support', 'support_interface_filament', 'support_interface_filament', (v) => (v === 'Default' ? '0' : undefined)],
  ['support', 'support_top_z_distance', 'support_top_z_distance', 'str'],
  ['support', 'support_bottom_z_distance', 'support_bottom_z_distance', 'str'],
  ['support', 'support_base_pattern', 'support_base_pattern', { Default: 'default', Rectilinear: 'rectilinear', Honeycomb: 'honeycomb' }],
  ['support', 'support_base_pattern_spacing', 'support_base_pattern_spacing', 'str'],
  ['support', 'support_top_interface_layers', 'support_interface_top_layers', 'str'],
  ['support', 'support_bottom_interface_layers', 'support_interface_bottom_layers', 'str'],
  ['support', 'support_interface_pattern', 'support_interface_pattern', { Default: 'auto', Rectilinear: 'rectilinear', Concentric: 'concentric' }],
  ['support', 'support_top_interface_spacing', 'support_interface_spacing', 'str'],
  ['support', 'support_normal_expansion', 'support_expansion', 'str'],
  ['support', 'support_object_xy_distance', 'support_object_xy_distance', 'str'],
  ['support', 'support_dont_support_bridges', 'bridge_no_support', 'bool'],

  // Others
  ['others', 'skirt_loops', 'skirt_loops', 'str'],
  ['others', 'skirt_height', 'skirt_height', 'str'],
  ['others', 'prime_tower_enable', 'enable_prime_tower', 'bool'],
  ['others', 'prime_tower_internal_ribs', 'prime_tower_enable_framework', 'bool'],
  ['others', 'prime_tower_width', 'prime_tower_width', 'str'],
  ['others', 'prime_tower_max_speed', 'prime_tower_max_speed', 'str'],
  ['others', 'prime_tower_brim_width', 'prime_tower_brim_width', 'str'],
  ['others', 'spiral_vase', 'spiral_mode', 'bool'],
  ['others', 'print_sequence', 'print_sequence', { 'By layer': 'by layer', 'By object': 'by object' }],
  ['others', 'fuzzy_skin', 'fuzzy_skin', { None: 'none' }],
  ['others', 'fuzzy_skin_generator_mode', 'fuzzy_skin_mode', { Displacement: 'displacement', Voronoi: 'voronoi' }],
  ['others', 'fuzzy_skin_noise_type', 'fuzzy_skin_noise_type', { Classic: 'classic', Perlin: 'perlin', Billow: 'billow' }],
  ['others', 'fuzzy_skin_point_distance', 'fuzzy_skin_point_distance', 'str'],
  ['others', 'fuzzy_skin_thickness', 'fuzzy_skin_thickness', 'str'],
  ['others', 'fuzzy_skin_first_layer', 'fuzzy_skin_first_layer', 'bool'],
  ['others', 'reduce_infill_retraction', 'reduce_infill_retraction_mode', { Auto: 'Auto', Enabled: 'Enabled', Disabled: 'Disabled' }],
];

const FILAMENT_MAP = [
  // Basic Information
  ['basic_settings', 'filament_type', 'filament_type', 'str'],
  ['basic_settings', 'vendor', 'filament_vendor', 'str'],
  ['basic_settings', 'color', 'default_filament_colour', 'str'],
  ['basic_settings', 'metal_stickiness', 'filament_metal_stickiness', 'str'],
  ['basic_settings', 'diameter', 'filament_diameter', 'str'],
  ['basic_settings', 'flow_ratio', 'filament_flow_ratio', 'str'],
  ['basic_settings', 'density', 'filament_density', 'str'],
  ['basic_settings', 'shrinkage', 'filament_shrink', 'percent'],
  ['basic_settings', 'velocity_adaptation', 'filament_velocity_adaptation_factor', 'str'],
  ['basic_settings', 'price', 'filament_cost', 'str'],
  ['basic_settings', 'prime_vol_filament_change', 'filament_prime_volume', 'str'],
  ['basic_settings', 'prime_vol_hotend_change', 'filament_prime_volume_nc', 'str'],
  ['basic_settings', 'ramming_len_extruder_change', 'filament_change_length', 'str'],
  ['basic_settings', 'ramming_len_hotend_change', 'filament_retract_length_nc', 'str'],
  ['basic_settings', 'travel_time_ramming_extruder', 'filament_ramming_travel_time', 'str'],
  ['basic_settings', 'travel_time_ramming_hotend', 'filament_ramming_travel_time_nc', 'str'],
  ['basic_settings', 'precool_temp_extruder', 'filament_pre_cooling_temperature', 'str'],
  ['basic_settings', 'precool_temp_hotend', 'filament_pre_cooling_temperature_nc', 'str'],
  ['basic_settings', 'nozzle_temp_min', 'nozzle_temperature_range_low', 'str'],
  ['basic_settings', 'nozzle_temp_max', 'nozzle_temperature_range_high', 'str'],

  // Print Temperature
  ['temp_settings', 'cool_plate_super_initial', 'supertack_plate_temp_initial_layer', 'str'],
  ['temp_settings', 'cool_plate_super_other', 'supertack_plate_temp', 'str'],
  ['temp_settings', 'cool_plate_initial', 'cool_plate_temp_initial_layer', 'str'],
  ['temp_settings', 'cool_plate_other', 'cool_plate_temp', 'str'],
  ['temp_settings', 'eng_plate_initial', 'eng_plate_temp_initial_layer', 'str'],
  ['temp_settings', 'eng_plate_other', 'eng_plate_temp', 'str'],
  ['temp_settings', 'smooth_pei_initial', 'hot_plate_temp_initial_layer', 'str'],
  ['temp_settings', 'smooth_pei_other', 'hot_plate_temp', 'str'],
  ['temp_settings', 'textured_pei_initial', 'textured_plate_temp_initial_layer', 'str'],
  ['temp_settings', 'textured_pei_other', 'textured_plate_temp', 'str'],
  ['temp_settings', 'first_layer_nozzle', 'nozzle_temperature_initial_layer', 'str'],
  ['temp_settings', 'other_layers_nozzle', 'nozzle_temperature', 'str'],
  ['temp_settings', 'vitrification_temp', 'temperature_vitrification', 'str'],

  // Cooling
  ['cooling_settings', 'close_fan_first_x_layers', 'close_fan_the_first_x_layers', 'str'],
  ['cooling_settings', 'full_fan_speed_layer', 'full_fan_speed_layer', 'str'],
  ['cooling_settings', 'min_fan_speed', 'fan_min_speed', 'str'],
  ['cooling_settings', 'min_fan_speed_layer_time', 'fan_cooling_layer_time', 'str'],
  ['cooling_settings', 'max_fan_speed', 'fan_max_speed', 'str'],
  ['cooling_settings', 'slow_down_for_cooling', 'slow_down_for_layer_cooling', 'bool'],
  ['cooling_settings', 'dont_slow_down_outer_walls', 'no_slow_down_for_cooling_on_outwalls', 'bool'],
  ['cooling_settings', 'slow_print_speed', 'slow_down_min_speed', 'str'],
  ['cooling_settings', 'overhang_cooling_threshold', 'overhang_fan_threshold', 'percent'],
  ['cooling_settings', 'overhang_fan_speed', 'overhang_fan_speed', 'str'],
  ['cooling_settings', 'aux_close_fan_first_x_layers', 'close_additional_fan_first_x_layers', 'str'],
  ['cooling_settings', 'aux_full_fan_speed_layer', 'additional_fan_full_speed_layer', 'str'],
  ['cooling_settings', 'aux_fan_speed', 'additional_cooling_fan_speed', 'str'],

  // Setting Overrides
  ['override_settings', 'adaptive_volumetric_speed', 'filament_adaptive_volumetric_speed', 'bool'],
  ['override_settings', 'max_volumetric_speed', 'filament_max_volumetric_speed', 'str'],
  ['override_settings', 'ramming_vol_extruder_change', 'filament_ramming_volumetric_speed', 'str'],
  ['override_settings', 'ramming_vol_hotend_change', 'filament_ramming_volumetric_speed_nc', 'str'],
  ['override_settings', 'retraction_length', 'filament_retraction_length', 'str'],
  ['override_settings', 'z_hop', 'filament_z_hop', 'str'],
  ['override_settings', 'z_hop_type', 'filament_z_hop_types', 'str'],
  ['override_settings', 'retraction_speed', 'filament_retraction_speed', 'str'],
  ['override_settings', 'deretraction_speed', 'filament_deretraction_speed', 'str'],
  ['override_settings', 'retract_restart_extra', 'filament_retract_restart_extra', 'str'],
  ['override_settings', 'retract_before_travel', 'filament_retraction_minimum_travel', 'str'],
  ['override_settings', 'retract_on_layer_change', 'filament_retract_when_changing_layer', 'bool'],
  ['override_settings', 'wipe_while_retracting', 'filament_wipe', 'bool'],
  ['override_settings', 'wipe_distance', 'filament_wipe_distance', 'str'],
  ['override_settings', 'retract_before_wipe', 'filament_retract_before_wipe', 'percent'],
  ['override_settings', 'long_retraction_when_cut', 'filament_long_retractions_when_cut', 'bool'],
  ['override_settings', 'retraction_distance_when_cut', 'filament_retraction_distances_when_cut', 'str'],
  ['override_settings', 'override_overhang_speed', 'override_process_overhang_speed', 'bool'],
  ['override_settings', 'pressure_advance', 'pressure_advance', 'str'],

  // Filament Scarf Seam Settings
  ['scarf_seam', 'scarf_seam_type', 'filament_scarf_seam_type', 'str'],
  ['scarf_seam', 'scarf_start_height', 'filament_scarf_height', 'percent'],
  ['scarf_seam', 'scarf_slope_gap', 'filament_scarf_gap', 'percent'],
  ['scarf_seam', 'scarf_length', 'filament_scarf_length', 'str'],
];

function applyKind(kind, value) {
  if (typeof kind === 'function') return kind(value);
  if (typeof kind === 'object') return Object.prototype.hasOwnProperty.call(kind, value) ? kind[value] : undefined;
  if (value === undefined || value === null || value === '') return undefined;
  if (kind === 'bool') return value ? '1' : '0';
  if (kind === 'percent') return `${value}%`;
  return String(value); // 'str' and 'raw'
}

function schemaDefaults(tab) {
  const out = {};
  for (const field of profileSchema[tab] || []) {
    if (field.key) out[field.key] = field.default;
  }
  return out;
}

export function sanitizeFilename(name) {
  return (name || 'profile').replace(/[\\/:*?"<>|]/g, '_').trim() || 'profile';
}

// Builds a Bambu Studio "process" (print) preset. Only fields that differ
// from BambuDB's own default are included — everything else inherits
// Bambu Studio's built-in default for that field via `inherits`.
export function buildPrintProfileExport(profile) {
  const out = {
    type: 'process',
    name: profile.name,
    from: 'User',
    inherits: 'fdm_process_common',
    instantiation: 'true',
    print_settings_id: profile.name,
  };
  const compatible = PRINTER_COMPATIBLE_NAME[profile.printer_model];
  if (compatible) out.compatible_printers = [compatible];

  const defaultsByTab = Object.fromEntries(
    ['quality', 'strength', 'speed', 'support', 'others'].map((tab) => [tab, schemaDefaults(tab)])
  );

  for (const [tab, key, bambuKey, kind] of PROCESS_MAP) {
    const value = profile[tab]?.[key];
    if (value === undefined) continue;
    if (value === defaultsByTab[tab][key]) continue;
    const mapped = applyKind(kind, value);
    if (mapped === undefined) continue;
    out[bambuKey] = tab === 'speed' ? [mapped] : mapped;
  }
  return out;
}

// Builds a Bambu Studio "filament" preset. Every mapped field is included
// (not just the ones that differ from a default), since a wrong or missing
// temperature/flow value has real consequences.
export function buildFilamentExport(filament) {
  const out = {
    type: 'filament',
    name: filament.name,
    from: 'User',
    inherits: 'fdm_filament_common',
    instantiation: 'true',
    filament_settings_id: [filament.name],
  };

  for (const [tab, key, bambuKey, kind] of FILAMENT_MAP) {
    const value = filament[tab]?.[key];
    if (value === undefined || value === null || value === '') continue;
    const mapped = applyKind(kind, value);
    if (mapped === undefined) continue;
    out[bambuKey] = [mapped];
    if (bambuKey === 'pressure_advance') out.enable_pressure_advance = ['1'];
  }

  if (filament.notes) out.filament_notes = [filament.notes];
  if (filament.start_gcode) out.filament_start_gcode = [filament.start_gcode];
  if (filament.end_gcode) out.filament_end_gcode = [filament.end_gcode];

  return out;
}

export function downloadBambuProfile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
