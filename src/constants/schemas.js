export const profileSchema = {
    quality: [
        { key: 'layer_height', label: 'Layer Height', type: 'number', step: 0.04, suffix: 'mm', desc: "Thickness of each layer. Lower values increase detail but also print time. A common default is 0.2mm." },
        { key: 'seam_position', label: 'Seam Position', type: 'select', options: ['aligned', 'back', 'random', 'nearest'], desc: "Controls where each layer's start/end point is located. 'Aligned' creates a single seam, 'Back' hides it on the rear, 'Nearest' places it in a corner, and 'Random' distributes it across the surface." },
        { key: 'wall_generator', label: 'Wall Generator', type: 'select', options: ['classic', 'arachne'], desc: "'Arachne' (default) uses a variable extrusion width, ideal for thin walls and sharp corners. 'Classic' uses a fixed width." },
        { key: 'ironing_type', label: 'Ironing', type: 'select', options: ['no_ironing', 'top_surfaces', 'all_top'], desc: "Smooths top surfaces by making an extra pass with minimal filament flow. 'Top Surfaces' irons all flat top areas." },
        { key: 'precision_walls', label: 'Precision Walls', type: 'boolean', desc: "Intended to improve dimensional accuracy and reduce Z-banding by adjusting the wall generation algorithm." }
    ],
    strength: [
        { key: 'wall_loops', label: 'Wall Loops', type: 'number', step: 1, desc: "The number of perimeter walls. More walls increase strength but also print time and material usage. Default is 2." },
        { key: 'top_shell_layers', label: 'Top Shell Layers', type: 'number', step: 1, desc: "Number of solid layers on the top of the model. More layers improve surface finish and strength. Default: 3-5." },
        { key: 'bottom_shell_layers', label: 'Bottom Shell Layers', type: 'number', step: 1, desc: "Number of solid layers at the bottom of the model. More layers improve adhesion and strength. Default: 3-5." },
        { key: 'sparse_infill_density', label: 'Infill Density', type: 'number', suffix: '%', desc: "The density of the internal support structure. Higher values increase strength and weight. Common values are 15-25%. Default: 15%." },
        { key: 'sparse_infill_pattern', label: 'Infill Pattern', type: 'select', options: ['grid', 'gyroid', 'rectilinear', 'honeycomb'], desc: "Pattern of the internal infill. 'Grid' is fast, 'Gyroid' is strong in all directions, 'Honeycomb' is strong and light." }
    ],
    speed: [
        { key: 'outer_wall', label: 'Outer Wall', type: 'number', suffix: 'mm/s', desc: "Speed for printing the outermost wall. Slower speeds improve surface quality. Default: 200 mm/s." },
        { key: 'inner_wall', label: 'Inner Wall', type: 'number', suffix: 'mm/s', desc: "Speed for printing inner walls. Can be faster than the outer wall. Default: 300 mm/s." },
        { key: 'sparse_infill', label: 'Sparse Infill', type: 'number', suffix: 'mm/s', desc: "Speed for printing the low-density internal infill. Can be very fast. Default: 270 mm/s." },
        { key: 'solid_infill', label: 'Solid Infill', type: 'number', suffix: 'mm/s', desc: "Speed for printing solid internal layers. Default: 250 mm/s." },
        { key: 'top_surface', label: 'Top Surface', type: 'number', suffix: 'mm/s', desc: "Speed for the final top layers. Slower speeds create a better finish. Default: 200 mm/s." },
        { key: 'first_layer', label: 'First Layer', type: 'number', suffix: 'mm/s', desc: "Speed for the very first layer. A slow speed is critical for good bed adhesion. Default: 50 mm/s." },
        { key: 'travel', label: 'Travel Speed', type: 'number', suffix: 'mm/s', desc: "Speed of the print head when not extruding. Higher values reduce print time but can cause artifacts if too high. Default: 500 mm/s." },
        { key: 'acceleration', label: 'Acceleration', type: 'number', suffix: 'mm/s²', desc: "The rate at which the print head changes speed. Higher values enable faster prints but may reduce quality. Default: 5000 mm/s²." }
    ],
    support: [
        { key: 'enable', label: 'Enable Support', type: 'boolean', desc: "Generates structures to support overhangs and bridges during printing." },
        { key: 'type', label: 'Type', type: 'select', options: ['normal', 'tree'], desc: "'Normal' supports are grid-like structures. 'Tree' supports are organic, branch-like structures that use less material and are often easier to remove." },
        { key: 'style', label: 'Style', type: 'select', options: ['default', 'tree_slim', 'tree_strong', 'snug'], desc: "Affects the shape and strength of tree supports." },
        { key: 'threshold_angle', label: 'Threshold Angle', type: 'number', suffix: 'deg', desc: "The minimum overhang angle at which supports will be generated. A value of 0 supports everything, 90 supports nothing. Default: 30 degrees." }
    ],
    others: [
        { key: 'brim_type', label: 'Brim Type', type: 'select', options: ['auto', 'outer_only', 'inner_only', 'no_brim'], desc: "A brim adds a single-layer flat area around your model's base to improve bed adhesion. 'Auto' enables it only when needed." },
        { key: 'brim_width', label: 'Brim Width', type: 'number', suffix: 'mm', desc: "The width of the brim. A wider brim provides more adhesion. Default: 5mm." },
        { key: 'skirt_loops', label: 'Skirt Loops', type: 'number', desc: "A skirt is an outline printed around the model before the model itself, used to prime the nozzle. This sets the number of loops. Default: 1." }
    ]
};

export const filamentSchema = {
    basic_settings: [
        { type: 'heading', label: 'Basic Information' },
        { key: 'filament_type', label: 'Filament Type', type: 'text', desc: "Type of filament, e.g., PLA, PETG, ABS." },
        { key: 'vendor', label: 'Vendor', type: 'text', desc: "The manufacturer of the filament." },
        { key: 'color', label: 'Color', type: 'color', desc: "The color of the filament." },
        { key: 'diameter', label: 'Diameter', type: 'number', step: 0.01, suffix: 'mm', desc: "The diameter of the filament, typically 1.75mm." },
        { key: 'flow_ratio', label: 'Flow Ratio', type: 'number', step: 0.01, desc: "A multiplier for the amount of filament extruded. Used to calibrate for under or over-extrusion. Default is 0.98 for many Bambu filaments." },
        { key: 'density', label: 'Density', type: 'number', step: 0.01, suffix: 'g/cm³', desc: "The density of the filament material. Used for accurate weight estimation. e.g., PLA is ~1.24 g/cm³." },
        { key: 'shrinkage', label: 'Shrinkage', type: 'number', step: 0.1, suffix: '%', desc: "The percentage the filament shrinks as it cools. This value is used to compensate for shrinkage to improve dimensional accuracy." },
        { key: 'velocity_adaptation', label: 'Velocity Adaptation', type: 'number', step: 0.01, desc: "Allows for dynamic adjustment of print speed based on the complexity of the geometry, helping to maintain quality in detailed areas." },
        { key: 'price', label: 'Price/kg', type: 'number', suffix: '$', desc: "The price of the filament per kilogram." },
        { key: 'softening_temp', label: 'Softening Temp', type: 'number', suffix: '°C', desc: "The temperature at which the material begins to soften. Important for preventing heat creep." },
        { key: 'prime_vol_filament_change', label: 'Prime Vol (Filament Change)', type: 'number', suffix: 'mm³', desc: "The volume of filament to prime when changing filaments with the AMS." },
        { key: 'prime_vol_hotend_change', label: 'Prime Vol (Hotend Change)', type: 'number', suffix: 'mm³', desc: "The volume of filament to prime when the hotend is changed." },
        { key: 'ramming_len_extruder_change', label: 'Ramming Len (Extruder Change)', type: 'number', suffix: 'mm', desc: "The length of filament to quickly push forward (ram) during a filament change." },
        { key: 'ramming_len_hotend_change', label: 'Ramming Len (Hotend Change)', type: 'number', suffix: 'mm', desc: "The length of filament to ram when the hotend is changed." },
        { key: 'travel_time_ramming_extruder', label: 'Travel Time Ramming (Extruder)', type: 'number', suffix: 'ms', desc: "The duration of the ramming move during an extruder filament change." },
        { key: 'travel_time_ramming_hotend', label: 'Travel Time Ramming (Hotend)', type: 'number', suffix: 'ms', desc: "The duration of the ramming move during a hotend change." },
        { key: 'precool_temp_extruder', label: 'Pre-cool Temp (Extruder)', type: 'number', suffix: '°C', desc: "The target temperature to pre-cool to during an extruder filament change." },
        { key: 'precool_temp_hotend', label: 'Pre-cool Temp (Hotend)', type: 'number', suffix: '°C', desc: "The target temperature to pre-cool to during a hotend change." },
    ],
    temp_settings: [
        { type: 'heading', label: 'Print Temperature' },
        { key: 'nozzle_temp_min', label: 'Nozzle Temp Min', type: 'number', suffix: '°C', desc: "The minimum recommended nozzle temperature for this filament." },
        { key: 'nozzle_temp_max', label: 'Nozzle Temp Max', type: 'number', suffix: '°C', desc: "The maximum recommended nozzle temperature for this filament." },
        { key: 'cool_plate_super_initial', label: 'Cool Plate SuperTack (Initial)', type: 'number', suffix: '°C', desc: "Bed temperature for the initial layer on the Cool Plate with SuperTack adhesive." },
        { key: 'cool_plate_super_other', label: 'Cool Plate SuperTack (Other)', type: 'number', suffix: '°C', desc: "Bed temperature for other layers on the Cool Plate with SuperTack adhesive." },
        { key: 'cool_plate_initial', label: 'Cool Plate (Initial)', type: 'number', suffix: '°C', desc: "Bed temperature for the initial layer on the standard Cool Plate. Default for PLA: 35°C." },
        { key: 'cool_plate_other', label: 'Cool Plate (Other)', type: 'number', suffix: '°C', desc: "Bed temperature for other layers on the standard Cool Plate. Default for PLA: 35°C." },
        { key: 'eng_plate_initial', label: 'Engineering Plate (Initial)', type: 'number', suffix: '°C', desc: "Bed temperature for the initial layer on the Engineering Plate." },
        { key: 'eng_plate_other', label: 'Engineering Plate (Other)', type: 'number', suffix: '°C', desc: "Bed temperature for other layers on the Engineering Plate." },
        { key: 'smooth_pei_initial', label: 'Smooth PEI / High Temp (Initial)', type: 'number', suffix: '°C', desc: "Bed temperature for the initial layer on the Smooth PEI / High Temp Plate. Default for PLA: 55°C." },
        { key: 'smooth_pei_other', label: 'Smooth PEI / High Temp (Other)', type: 'number', suffix: '°C', desc: "Bed temperature for other layers on the Smooth PEI / High Temp Plate. Default for PLA: 55°C." },
        { key: 'textured_pei_initial', label: 'Textured PEI Plate (Initial)', type: 'number', suffix: '°C', desc: "Bed temperature for the initial layer on the Textured PEI Plate. Default for PLA: 55°C." },
        { key: 'textured_pei_other', label: 'Textured PEI Plate (Other)', type: 'number', suffix: '°C', desc: "Bed temperature for other layers on the Textured PEI Plate. Default for PLA: 55°C." },
        { key: 'first_layer_nozzle', label: 'Nozzle Temp (1st Layer)', type: 'number', suffix: '°C', desc: "The nozzle temperature for the first layer, often slightly hotter for better adhesion. Default for PLA: 220°C." },
        { key: 'other_layers_nozzle', label: 'Nozzle Temp (Other Layers)', type: 'number', suffix: '°C', desc: "The nozzle temperature for the subsequent layers. Default for PLA: 220°C." },
        { key: 'vitrification_temp', label: 'Vitrification Temp', type: 'number', suffix: '°C', desc: "The glass transition temperature (Tg) of the material. The chamber fan will be controlled based on this value to prevent clogging. For PLA, this is around 60°C." },
    ],
    cooling_settings: [
        { key: 'min_fan_speed', label: 'Min Fan Speed', type: 'number', suffix: '%', desc: "The minimum speed of the part cooling fan." },
        { key: 'max_fan_speed', label: 'Max Fan Speed', type: 'number', suffix: '%', desc: "The maximum speed of the part cooling fan." },
        { key: 'min_layer_time', label: 'Min Layer Time', type: 'number', suffix: 's', desc: "If a layer prints faster than this time, the print speed will be slowed down to ensure adequate cooling." },
        { key: 'fan_always_on', label: 'Fan Always On', type: 'boolean', desc: "Keeps the part cooling fan running at all times, even on the first layer." },
        { key: 'aux_fan_speed', label: 'Aux Fan Speed', type: 'number', suffix: '%', desc: "The speed of the auxiliary part cooling fan, if available." }
    ],
    override_settings: [
        { type: 'heading', label: 'Volumetric Speed Limitation' },
        { key: 'adaptive_volumetric_speed', label: 'Adaptive Volumetric Speed', type: 'boolean', desc: "Automatically adjusts the volumetric speed based on the pressure in the nozzle, helping to prevent extruder clicking and jams." },
        { key: 'max_volumetric_speed', label: 'Max Volumetric Speed', type: 'number', suffix: 'mm³/s', desc: 'The maximum rate at which the extruder can push filament. This is a critical limit for high-speed printing. For PLA, default is around 12-15 mm³/s.' },
        { key: 'ramming_vol_extruder_change', label: 'Ramming Vol (Extruder Change)', type: 'number', suffix: 'mm³/s', desc: "The volumetric speed used during the ramming phase of a filament change." },
        { key: 'ramming_vol_hotend_change', label: 'Ramming Vol (Hotend Change)', type: 'number', suffix: 'mm³/s', desc: "The volumetric speed used during ramming when the hotend is changed." },
        { key: 'retraction_length', label: 'Retraction', type: 'number', step: 0.1, suffix: 'mm', desc: "The amount of filament to pull back when the print head travels over an empty space, to prevent stringing. Default is around 0.8mm." },
        { key: 'z_hop', label: 'Z-Hop', type: 'number', step: 0.1, suffix: 'mm', desc: "Lifts the print head by this amount during travel moves to avoid hitting the printed part. Default is around 0.4mm." }
    ],
    scarf_seam: [
        { type: 'heading', label: 'Filament Scarf Seam Settings' },
        { key: 'scarf_seam_type', label: 'Scarf Seam Type', type: 'select', options: ['none', 'outer', 'inner', 'both'], desc: "A technique to reduce the visibility of the seam by overlapping the start and end of the perimeter." },
        { key: 'scarf_start_height', label: 'Scarf Start Height', type: 'number', suffix: 'mm', desc: "The height at which to start the scarf seam." },
        { key: 'scarf_slope_gap', label: 'Scarf Slope Gap', type: 'number', suffix: '%', desc: "The gap in the slope of the scarf seam." },
        { key: 'scarf_length', label: 'Scarf Length', type: 'number', suffix: 'mm', desc: "The length of the scarf seam overlap." }
    ]
};