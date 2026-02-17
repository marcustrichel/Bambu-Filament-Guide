export const profileSchema = {
    quality: [
        { key: 'layer_height', label: 'Layer Height', type: 'number', step: 0.04, suffix: 'mm' },
        { key: 'seam_position', label: 'Seam Position', type: 'select', options: ['aligned', 'back', 'random', 'nearest'] },
        { key: 'wall_generator', label: 'Wall Generator', type: 'select', options: ['classic', 'arachne'] },
        { key: 'ironing_type', label: 'Ironing', type: 'select', options: ['no_ironing', 'top_surfaces', 'all_top'] },
        { key: 'precision_walls', label: 'Precision Walls', type: 'boolean' }
    ],
    strength: [
        { key: 'wall_loops', label: 'Wall Loops', type: 'number', step: 1 },
        { key: 'top_shell_layers', label: 'Top Shell Layers', type: 'number', step: 1 },
        { key: 'bottom_shell_layers', label: 'Bottom Shell Layers', type: 'number', step: 1 },
        { key: 'sparse_infill_density', label: 'Infill Density', type: 'number', suffix: '%' },
        { key: 'sparse_infill_pattern', label: 'Infill Pattern', type: 'select', options: ['grid', 'gyroid', 'rectilinear', 'honeycomb'] },
    ],
    speed: [
        { key: 'outer_wall', label: 'Outer Wall', type: 'number', suffix: 'mm/s' },
        { key: 'inner_wall', label: 'Inner Wall', type: 'number', suffix: 'mm/s' },
        { key: 'sparse_infill', label: 'Sparse Infill', type: 'number', suffix: 'mm/s' },
        { key: 'solid_infill', label: 'Solid Infill', type: 'number', suffix: 'mm/s' },
        { key: 'top_surface', label: 'Top Surface', type: 'number', suffix: 'mm/s' },
        { key: 'first_layer', label: 'First Layer', type: 'number', suffix: 'mm/s' },
        { key: 'travel', label: 'Travel Speed', type: 'number', suffix: 'mm/s' },
        { key: 'acceleration', label: 'Acceleration', type: 'number', suffix: 'mm/s²' },
    ],
    support: [
        { key: 'enable', label: 'Enable Support', type: 'boolean' },
        { key: 'type', label: 'Type', type: 'select', options: ['normal', 'tree'] },
        { key: 'style', label: 'Style', type: 'select', options: ['default', 'tree_slim', 'tree_strong', 'snug'] },
        { key: 'threshold_angle', label: 'Threshold Angle', type: 'number', suffix: 'deg' }
    ],
    others: [
        { key: 'brim_type', label: 'Brim Type', type: 'select', options: ['auto', 'outer_only', 'inner_only', 'no_brim'] },
        { key: 'brim_width', label: 'Brim Width', type: 'number', suffix: 'mm' },
        { key: 'skirt_loops', label: 'Skirt Loops', type: 'number' }
    ]
};

export const filamentSchema = {
    basic_settings: [
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'material', label: 'Material', type: 'select', options: ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC'] },
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'density', label: 'Density', type: 'number', suffix: 'g/cm³' },
        { key: 'price', label: 'Price/kg', type: 'number', suffix: '$' }
    ],
    temp_settings: [
        { key: 'nozzle_min', label: 'Nozzle Min', type: 'number', suffix: '°C' },
        { key: 'nozzle_max', label: 'Nozzle Max', type: 'number', suffix: '°C' },
        { key: 'first_layer_nozzle', label: 'Nozzle (1st Layer)', type: 'number', suffix: '°C' },
        { key: 'other_layers_nozzle', label: 'Nozzle (Other)', type: 'number', suffix: '°C' },
        { key: 'first_layer_bed', label: 'Bed (1st Layer)', type: 'number', suffix: '°C' },
        { key: 'other_layers_bed', label: 'Bed (Other)', type: 'number', suffix: '°C' },
        { key: 'vitrification_temp', label: 'Vitrification Temp', type: 'number', suffix: '°C' },
    ],
    cooling_settings: [
        { key: 'min_fan_speed', label: 'Min Fan Speed', type: 'number', suffix: '%' },
        { key: 'max_fan_speed', label: 'Max Fan Speed', type: 'number', suffix: '%' },
        { key: 'min_layer_time', label: 'Min Layer Time', type: 'number', suffix: 's' },
        { key: 'fan_always_on', label: 'Fan Always On', type: 'boolean' },
        { key: 'aux_fan_speed', label: 'Aux Fan Speed', type: 'number', suffix: '%' }
    ],
    override_settings: [
        { key: 'max_volumetric_speed', label: 'Max Flow Rate', type: 'number', suffix: 'mm³/s', desc: 'Critical for high speed printing' },
        { key: 'retraction_length', label: 'Retraction', type: 'number', step: 0.1, suffix: 'mm' },
        { key: 'z_hop', label: 'Z-Hop', type: 'number', step: 0.1, suffix: 'mm' }
    ]
};