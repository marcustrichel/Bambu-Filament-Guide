// Speed-tab defaults per printer model. Other tabs (quality, strength, support,
// others) aren't printer-dependent, so only speed varies by target model.
export const PRINTER_MODEL_SPEED_DEFAULTS = {
    'A1 Mini':   { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 5000 },
    'A1':        { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 8000 },
    'P1P':       { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 8000 },
    'P1S':       { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 8000 },
    'X1':        { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 10000 },
    'X1 Carbon': { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 10000 },
    'X1E':       { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 10000 },
};

export const profileSchema = {
    quality: [
        { key: 'layer_height', label: 'Layer Height', type: 'number', step: 0.04, suffix: 'mm', default: 0.2, desc: "Thickness of each layer. Lower values increase detail but also print time. A common default is 0.2mm." },
        { key: 'seam_position', label: 'Seam Position', type: 'select', options: ['aligned', 'back', 'random', 'nearest'], default: 'aligned', desc: "Controls where each layer's start/end point is located. 'Aligned' creates a single seam, 'Back' hides it on the rear, 'Nearest' places it in a corner, and 'Random' distributes it across the surface." },
        { key: 'wall_generator', label: 'Wall Generator', type: 'select', options: ['classic', 'arachne'], default: 'arachne', desc: "'Arachne' (default) uses a variable extrusion width, ideal for thin walls and sharp corners. 'Classic' uses a fixed width." },
        { key: 'ironing_type', label: 'Ironing', type: 'select', options: ['no_ironing', 'top_surfaces', 'all_top'], default: 'no_ironing', desc: "Smooths top surfaces by making an extra pass with minimal filament flow. 'Top Surfaces' irons all flat top areas." },
        { key: 'precision_walls', label: 'Precision Walls', type: 'boolean', default: true, desc: "Intended to improve dimensional accuracy and reduce Z-banding by adjusting the wall generation algorithm." },
        { key: 'first_layer_height', label: 'First Layer Height', type: 'number', step: 0.05, suffix: 'mm', default: 0.2, desc: "Height of the first layer. A slightly thicker first layer (0.2–0.3mm) improves bed adhesion regardless of the main layer height setting. Default: 0.2mm." },
        { key: 'outer_wall_line_width', label: 'Outer Wall Line Width', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Width of the extruded outer wall line. Slightly wider than the nozzle (e.g., 0.42mm for a 0.4mm nozzle) creates tighter, stronger walls. Default: 0.42mm." }
    ],
    strength: [
        { key: 'wall_loops', label: 'Wall Loops', type: 'number', step: 1, default: 2, desc: "The number of perimeter walls. More walls increase strength but also print time and material usage. Default is 2." },
        { key: 'top_shell_layers', label: 'Top Shell Layers', type: 'number', step: 1, default: 3, desc: "Number of solid layers on the top of the model. More layers improve surface finish and strength. Default: 3-5." },
        { key: 'bottom_shell_layers', label: 'Bottom Shell Layers', type: 'number', step: 1, default: 3, desc: "Number of solid layers at the bottom of the model. More layers improve adhesion and strength. Default: 3-5." },
        { key: 'sparse_infill_density', label: 'Infill Density', type: 'number', suffix: '%', default: 15, desc: "The density of the internal support structure. Higher values increase strength and weight. Common values are 15-25%. Default: 15%." },
        { key: 'sparse_infill_pattern', label: 'Infill Pattern', type: 'select', options: ['grid', 'gyroid', 'rectilinear', 'honeycomb'], default: 'grid', desc: "Pattern of the internal infill. 'Grid' is fast, 'Gyroid' is strong in all directions, 'Honeycomb' is strong and light." },
        { key: 'top_surface_pattern', label: 'Top Surface Pattern', type: 'select', options: ['monotonic', 'monotonic_line', 'concentric', 'rectilinear', 'aligned_rectilinear', 'grid', 'zig_zag'], default: 'monotonic', desc: "'Monotonic' produces the smoothest visible top surface by printing lines in a consistent direction with no crossings. Default: monotonic." },
        { key: 'bottom_surface_pattern', label: 'Bottom Surface Pattern', type: 'select', options: ['monotonic', 'monotonic_line', 'concentric', 'rectilinear', 'aligned_rectilinear', 'grid', 'zig_zag'], default: 'monotonic', desc: "Fill pattern for the bottom layer surface. 'Monotonic' is recommended for the smoothest result. Default: monotonic." },
        { key: 'detect_overhang_wall', label: 'Detect Overhang Walls', type: 'boolean', default: true, desc: "Identifies overhanging walls and reduces print speed and/or increases fan to improve their quality. Recommended to keep enabled." }
    ],
    speed: [
        { key: 'outer_wall', label: 'Outer Wall', type: 'number', suffix: 'mm/s', default: 200, desc: "Speed for printing the outermost wall. Slower speeds improve surface quality. Default: 200 mm/s." },
        { key: 'inner_wall', label: 'Inner Wall', type: 'number', suffix: 'mm/s', default: 300, desc: "Speed for printing inner walls. Can be faster than the outer wall. Default: 300 mm/s." },
        { key: 'sparse_infill', label: 'Sparse Infill', type: 'number', suffix: 'mm/s', default: 270, desc: "Speed for printing the low-density internal infill. Can be very fast. Default: 270 mm/s." },
        { key: 'solid_infill', label: 'Solid Infill', type: 'number', suffix: 'mm/s', default: 250, desc: "Speed for printing solid internal layers. Default: 250 mm/s." },
        { key: 'top_surface', label: 'Top Surface', type: 'number', suffix: 'mm/s', default: 200, desc: "Speed for the final top layers. Slower speeds create a better finish. Default: 200 mm/s." },
        { key: 'first_layer', label: 'First Layer', type: 'number', suffix: 'mm/s', default: 50, desc: "Speed for the very first layer. A slow speed is critical for good bed adhesion. Default: 50 mm/s." },
        { key: 'travel', label: 'Travel Speed', type: 'number', suffix: 'mm/s', default: 500, desc: "Speed of the print head when not extruding. Higher values reduce print time but can cause artifacts if too high. Default: 500 mm/s." },
        { key: 'acceleration', label: 'Acceleration', type: 'number', suffix: 'mm/s²', default: 5000, desc: "The rate at which the print head changes speed. Higher values enable faster prints but may reduce quality. Default: 5000 mm/s²." }
    ],
    support: [
        { key: 'enable', label: 'Enable Support', type: 'boolean', default: false, desc: "Generates structures to support overhangs and bridges during printing." },
        { key: 'type', label: 'Type', type: 'select', options: ['normal', 'tree'], default: 'tree', desc: "'Normal' supports are grid-like structures. 'Tree' supports are organic, branch-like structures that use less material and are often easier to remove." },
        { key: 'style', label: 'Style', type: 'select', options: ['default', 'tree_slim', 'tree_strong', 'snug'], default: 'tree_slim', desc: "Affects the shape and strength of tree supports." },
        { key: 'threshold_angle', label: 'Threshold Angle', type: 'number', suffix: 'deg', default: 30, desc: "The minimum overhang angle at which supports will be generated. A value of 0 supports everything, 90 supports nothing. Default: 30 degrees." }
    ],
    others: [
        { key: 'brim_type', label: 'Brim Type', type: 'select', options: ['auto', 'outer_only', 'inner_only', 'no_brim'], default: 'auto', desc: "A brim adds a single-layer flat area around your model's base to improve bed adhesion. 'Auto' enables it only when needed." },
        { key: 'brim_width', label: 'Brim Width', type: 'number', suffix: 'mm', default: 5, desc: "The width of the brim. A wider brim provides more adhesion. Default: 5mm." },
        { key: 'skirt_loops', label: 'Skirt Loops', type: 'number', default: 0, desc: "A skirt is an outline printed around the model before the model itself, used to prime the nozzle. This sets the number of loops. Default: 1." },
        { key: 'elephant_foot_compensation', label: 'Elephant Foot Compensation', type: 'number', step: 0.01, suffix: 'mm', default: 0.0, desc: "Reduces the first layer perimeter width to counteract the squishing effect on the bed, improving dimensional accuracy at the base. Default: 0mm (disabled)." }
    ]
};

export const filamentSchema = {
    basic_settings: [
        { type: 'heading', label: 'Basic Information' },
        { key: 'filament_type', label: 'Filament Type', type: 'select', options: ['PLA', 'PETG', 'ABS', 'ASA', 'PA', 'PC', 'TPU', 'PET', 'PVA', 'HIPS', 'PPS', 'PPA', 'PEI', 'PEEK', 'PEKK'], width: 'w-full', default: 'PLA', desc: "Type of filament, e.g., PLA, PETG, ABS.", createOnly: true },
        { key: 'vendor', label: 'Vendor', type: 'text', width: 'w-full', default: 'Overture', desc: "The manufacturer of the filament." },
        { key: 'color', label: 'Default color', type: 'color', width: 'w-full', default: '#000000', desc: "The color of the filament." },
        { key: 'metal_stickiness', label: 'Metal stickiness', type: 'select', options: ['None', 'Low', 'Medium', 'High'], width: 'w-full', default: 'None', desc: "How much the material tends to adhere to metal nozzle/hotend surfaces, relevant for metal-fill, carbon-fill, or conductive filaments." },
        { key: 'diameter', label: 'Diameter', type: 'number', step: 0.01, min: 0.01, suffix: 'mm', width: 'w-32', default: 1.75, desc: "The diameter of the filament, typically 1.75mm. Must be positive." },
        { key: 'flow_ratio', label: 'Flow Ratio', type: 'number', step: 0.01, width: 'w-32', default: 0.98, desc: "A multiplier for the amount of filament extruded. Used to calibrate for under or over-extrusion. Default is 0.98 for many Bambu filaments." },
        { key: 'density', label: 'Density', type: 'number', step: 0.01, suffix: 'g/cm³', width: 'w-32', default: 1.22, desc: "The density of the filament material. Used for accurate weight estimation. e.g., PLA is ~1.22 g/cm³." },
        { key: 'shrinkage', label: 'Shrinkage', type: 'number', step: 0.1, suffix: '%', width: 'w-32', default: 100, desc: "The percentage the filament shrinks as it cools. This value is used to compensate for shrinkage to improve dimensional accuracy." },
        { key: 'velocity_adaptation', label: 'Velocity Adaptation Factor', type: 'number', step: 0.01, width: 'w-32', default: 1, desc: "Allows for dynamic adjustment of print speed based on the complexity of the geometry, helping to maintain quality in detailed areas." },
        { key: 'price', label: 'Price', type: 'number', suffix: '$', width: 'w-32', default: 24.52, desc: "The price of the filament per kilogram." },
        { key: 'softening_temp', label: 'Softening temperature', type: 'number', suffix: '°C', width: 'w-32', default: 45, desc: "The temperature at which the material begins to soften. Important for preventing heat creep." },
        {
            type: 'group',
            label: 'Filament prime volume',
            fields: [
                { key: 'prime_vol_filament_change', label: 'Filament Change', type: 'number', suffix: 'mm³', width: 'w-32', default: 45, desc: "The volume of filament to prime when changing filaments with the AMS." },
                { key: 'prime_vol_hotend_change', label: 'Hotend Change', type: 'number', suffix: 'mm³', width: 'w-32', default: 45, desc: "The volume of filament to prime when the hotend is changed." },
            ]
        },
        {
            type: 'group',
            label: 'Filament ramming length',
            fields: [
                { key: 'ramming_len_extruder_change', label: 'Extruder Change', type: 'number', suffix: 'mm', width: 'w-32', default: 4.5, desc: "The length of filament to quickly push forward (ram) during a filament change." },
                { key: 'ramming_len_hotend_change', label: 'Hotend Change', type: 'number', suffix: 'mm', width: 'w-32', default: 4.5, desc: "The length of filament to ram when the hotend is changed." },
            ]
        },
        {
            type: 'group',
            label: 'Travel time after ramming',
            fields: [
                { key: 'travel_time_ramming_extruder', label: 'Extruder change', type: 'number', step: 0.1, suffix: 's', width: 'w-32', default: 0, desc: "The duration of the ramming move during an extruder filament change." },
                { key: 'travel_time_ramming_hotend', label: 'Hotend change', type: 'number', step: 0.1, suffix: 's', width: 'w-32', default: 0, desc: "The duration of the ramming move during a hotend change." },
            ]
        },
        {
            type: 'group',
            label: 'Precooling target temperature',
            fields: [
                { key: 'precool_temp_extruder', label: 'Extruder change', type: 'number', suffix: '°C', width: 'w-32', default: 0, desc: "The target temperature to pre-cool to during an extruder filament change. 0 disables precooling." },
                { key: 'precool_temp_hotend', label: 'Hotend change', type: 'number', suffix: '°C', width: 'w-32', default: 0, desc: "The target temperature to pre-cool to during a hotend change. 0 disables precooling." },
            ]
        },
        { key: 'idle_temp', label: 'Idle Temperature (AMS)', type: 'number', suffix: '°C', default: 0, desc: "Temperature the nozzle drops to when waiting in the AMS between prints or color changes. A lower value reduces oozing. 0 uses the printer default. Typical PLA: 0°C (off)." },
        {
            type: 'group',
            label: 'Recommended nozzle temperature',
            scope: 'temp_settings',
            fields: [
                { key: 'nozzle_temp_min', label: 'Min', type: 'number', suffix: '°C', width: 'w-32', default: 190, desc: "The minimum recommended nozzle temperature for this filament." },
                { key: 'nozzle_temp_max', label: 'Max', type: 'number', suffix: '°C', width: 'w-32', default: 230, desc: "The maximum recommended nozzle temperature for this filament." },
            ]
        }
    ],
    temp_settings: [
        { type: 'heading', label: 'Print Temperature' },
        {
            type: 'group',
            label: 'Cool Plate SuperTack',
            fields: [
                { key: 'cool_plate_super_initial', label: 'Initial Layer', type: 'number', suffix: '°C', width: 'w-32', default: 35, desc: "Bed temperature for the initial layer on the Cool Plate with SuperTack adhesive." },
                { key: 'cool_plate_super_other', label: 'Other Layers', type: 'number', suffix: '°C', width: 'w-32', default: 35, desc: "Bed temperature for other layers on the Cool Plate with SuperTack adhesive." },
            ]
        },
        {
            type: 'group',
            label: 'Cool Plate',
            fields: [
                { key: 'cool_plate_initial', label: 'Initial Layer', type: 'number', suffix: '°C', width: 'w-32', default: 35, desc: "Bed temperature for the initial layer on the standard Cool Plate. Default for PLA: 35°C." },
                { key: 'cool_plate_other', label: 'Other Layers', type: 'number', suffix: '°C', width: 'w-32', default: 35, desc: "Bed temperature for other layers on the standard Cool Plate. Default for PLA: 35°C." },
            ]
        },
        {
            type: 'group',
            label: 'Engineering Plate',
            fields: [
                { key: 'eng_plate_initial', label: 'Initial Layer', type: 'number', suffix: '°C', width: 'w-32', default: 55, desc: "Bed temperature for the initial layer on the Engineering Plate." },
                { key: 'eng_plate_other', label: 'Other Layers', type: 'number', suffix: '°C', width: 'w-32', default: 55, desc: "Bed temperature for other layers on the Engineering Plate." },
            ]
        },
        {
            type: 'group',
            label: 'Smooth PEI / High Temp',
            fields: [
                { key: 'smooth_pei_initial', label: 'Initial Layer', type: 'number', suffix: '°C', width: 'w-32', default: 55, desc: "Bed temperature for the initial layer on the Smooth PEI / High Temp Plate. Default for PLA: 55°C." },
                { key: 'smooth_pei_other', label: 'Other Layers', type: 'number', suffix: '°C', width: 'w-32', default: 55, desc: "Bed temperature for other layers on the Smooth PEI / High Temp Plate. Default for PLA: 55°C." },
            ]
        },
        {
            type: 'group',
            label: 'Textured PEI Plate',
            fields: [
                { key: 'textured_pei_initial', label: 'Initial Layer', type: 'number', suffix: '°C', width: 'w-32', default: 55, desc: "Bed temperature for the initial layer on the Textured PEI Plate. Default for PLA: 55°C." },
                { key: 'textured_pei_other', label: 'Other Layers', type: 'number', suffix: '°C', width: 'w-32', default: 55, desc: "Bed temperature for other layers on the Textured PEI Plate. Default for PLA: 55°C." },
            ]
        },
        {
            type: 'group',
            label: 'Nozzle Temp (Layers)',
            fields: [
                { key: 'first_layer_nozzle', label: '1st Layer', type: 'number', suffix: '°C', width: 'w-32', default: 220, desc: "The nozzle temperature for the first layer, often slightly hotter for better adhesion. Default for PLA: 220°C." },
                { key: 'other_layers_nozzle', label: 'Other Layers', type: 'number', suffix: '°C', width: 'w-32', default: 220, desc: "The nozzle temperature for the subsequent layers. Default for PLA: 220°C." },
            ]
        },
        { key: 'vitrification_temp', label: 'Vitrification Temp', type: 'number', suffix: '°C', width: 'w-32', default: 60, desc: "The glass transition temperature (Tg) of the material. The chamber fan will be controlled based on this value to prevent clogging. For PLA, this is around 60°C." },
    ],
    cooling_settings: [
        { type: 'heading', label: 'Part Cooling Fan' },
        {
            type: 'group',
            label: 'Initial layer fan',
            fields: [
                { key: 'close_fan_first_x_layers', label: 'For the first', type: 'number', step: 1, suffix: 'layers', width: 'w-20', default: 1, desc: "The part cooling fan is held at the fixed speed below for this many layers before ramping up." },
                { key: 'initial_fan_speed', label: 'Fan speed', type: 'number', step: 1, suffix: '%', width: 'w-20', default: 0, desc: "The fixed part cooling fan speed used during the initial layers. 0% is recommended for most materials to improve bed adhesion." },
            ]
        },
        {
            type: 'group',
            label: 'Linear ramp up',
            fields: [
                { key: 'full_fan_speed_layer', label: '', type: 'number', step: 1, suffix: 'layers', width: 'w-20', default: 0, desc: "The layer at which the part cooling fan reaches its full (threshold-based) speed, ramping up linearly from the initial layer fan speed. 0 disables the ramp." },
            ]
        },
        {
            type: 'group',
            label: 'Min fan speed threshold',
            fields: [
                { key: 'min_fan_speed', label: 'Fan speed', type: 'number', step: 1, suffix: '%', width: 'w-20', default: 60, desc: "The part cooling fan speed used when a layer takes longer than the layer time below to print." },
                { key: 'min_fan_speed_layer_time', label: 'Layer time', type: 'number', step: 1, suffix: 's', width: 'w-20', default: 80, desc: "Layer print time above which the fan runs at the min fan speed." },
            ]
        },
        {
            type: 'group',
            label: 'Max fan speed threshold',
            fields: [
                { key: 'max_fan_speed', label: 'Fan speed', type: 'number', step: 1, suffix: '%', width: 'w-20', default: 80, desc: "The part cooling fan speed used when a layer takes less than the layer time below to print, ramping linearly with the min fan speed threshold." },
                { key: 'max_fan_speed_layer_time', label: 'Layer time', type: 'number', step: 1, suffix: 's', width: 'w-20', default: 6, desc: "Layer print time below which the fan runs at the max fan speed." },
            ]
        },
        { key: 'fan_always_on', label: 'Keep fan always on', type: 'boolean', width: 'w-full', default: true, desc: "Keeps the part cooling fan running at the min fan speed at all times, even when otherwise off." },
        { key: 'slow_down_for_cooling', label: 'Slow down for better layer cooling', type: 'boolean', width: 'w-full', default: true, desc: "If a layer finishes faster than the max fan speed threshold's layer time, print speed is automatically reduced to allow adequate cooling. Essential for small parts." },
        { key: 'dont_slow_down_outer_walls', label: "Don't slow down outer walls", type: 'boolean', width: 'w-full', default: false, desc: "Keeps outer walls at full speed even when the printer is slowing down for cooling, trading some surface quality for a faster print." },
        { key: 'slow_print_speed', label: 'Min print speed', type: 'number', suffix: 'mm/s', step: 1, width: 'w-32', default: 20, desc: "The minimum speed the printer will drop to when slowing for cooling. Will not go below this value." },
        { key: 'force_cooling_for_overhangs', label: 'Force cooling for overhangs and bridges', type: 'boolean', width: 'w-full', default: true, desc: "Temporarily increases the fan to the overhang fan speed when printing overhangs and bridges, improving quality for materials prone to sagging." },
        { key: 'overhang_cooling_threshold', label: 'Cooling overhang threshold', type: 'number', suffix: '%', width: 'w-32', default: 50, desc: "The minimum overhang percentage (of line width unsupported) that triggers forced overhang cooling." },
        { key: 'overhang_participating_threshold', label: 'Overhang threshold for participating cooling', type: 'number', suffix: '%', width: 'w-32', default: 100, desc: "The overhang percentage above which perimeters are treated as fully unsupported for cooling purposes." },
        { key: 'overhang_fan_speed', label: 'Fan speed for overhangs', type: 'number', suffix: '%', width: 'w-32', default: 100, desc: "The part cooling fan speed used on overhangs and bridges when force cooling is triggered." },
        { key: 'pre_start_fan_time', label: 'Pre start fan time', type: 'number', suffix: 's', step: 0.1, width: 'w-32', default: 2, desc: "How long before reaching an overhang the fan is spun up, so it's already at speed once printing begins." },
        { key: 'ironing_fan_speed', label: 'Ironing fan speed', type: 'number', suffix: '%', width: 'w-32', default: -1, desc: "The part cooling fan speed used while ironing. -1 leaves the fan speed unchanged from the preceding move." },

        { type: 'heading', label: 'Auxiliary Part Cooling Fan' },
        {
            type: 'group',
            label: 'Initial layer fan',
            fields: [
                { key: 'aux_close_fan_first_x_layers', label: 'For the first', type: 'number', step: 1, suffix: 'layers', width: 'w-20', default: 1, desc: "The auxiliary fan is held at the fixed speed below for this many layers before ramping up." },
                { key: 'aux_initial_fan_speed', label: 'Fan speed', type: 'number', step: 1, suffix: '%', width: 'w-20', default: 0, desc: "The fixed auxiliary fan speed used during the initial layers." },
            ]
        },
        {
            type: 'group',
            label: 'Linear ramp up',
            fields: [
                { key: 'aux_full_fan_speed_layer', label: 'At layer', type: 'number', step: 1, suffix: 'layers', width: 'w-20', default: 0, desc: "The layer at which the auxiliary fan reaches its full ramp-up speed." },
                { key: 'aux_fan_speed', label: 'ramp up to', type: 'number', step: 1, suffix: '%', width: 'w-20', default: 70, desc: "The speed the auxiliary part cooling fan ramps up to, if available." },
            ]
        },
    ],
    override_settings: [
        { type: 'heading', label: 'Volumetric Speed Limitation' },
        { key: 'adaptive_volumetric_speed', label: 'Adaptive Volumetric Speed', type: 'boolean', width: 'w-full', default: true, desc: "Automatically adjusts the volumetric speed based on the pressure in the nozzle, helping to prevent extruder clicking and jams." },
        { key: 'max_volumetric_speed', label: 'Max Volumetric Speed', type: 'number', suffix: 'mm³/s', width: 'w-32', default: 12, desc: 'The maximum rate at which the extruder can push filament. This is a critical limit for high-speed printing. For PLA, default is around 12-15 mm³/s.' },
        { key: 'ramming_vol_extruder_change', label: 'Ramming Vol (Extruder Change)', type: 'number', suffix: 'mm³/s', width: 'w-32', default: 12, desc: "The volumetric speed used during the ramming phase of a filament change." },
        { key: 'ramming_vol_hotend_change', label: 'Ramming Vol (Hotend Change)', type: 'number', suffix: 'mm³/s', width: 'w-32', default: 12, desc: "The volumetric speed used during ramming when the hotend is changed." },

        { type: 'heading', label: 'Retraction' },
        { key: 'retraction_length', label: 'Length', type: 'number', step: 0.1, suffix: 'mm', width: 'w-32', default: 0.8, desc: "The amount of filament to pull back when the print head travels over an empty space, to prevent stringing. Default is around 0.8mm." },
        { key: 'z_hop', label: 'Z hop when retract', type: 'number', step: 0.1, suffix: 'mm', width: 'w-32', default: 0.4, desc: "Lifts the print head by this amount during travel moves to avoid hitting the printed part. Default is around 0.4mm." },
        { key: 'z_hop_type', label: 'Z Hop Type', type: 'select', options: ['Normal Lift', 'Slope Lift', 'Spiral Lift'], width: 'w-32', default: 'Normal Lift', desc: "How the nozzle moves during a Z hop. 'Slope Lift' and 'Spiral Lift' ramp the Z motion in with the travel move instead of hopping straight up, reducing visible travel artifacts." },
        { key: 'retraction_speed', label: 'Retraction Speed', type: 'number', step: 1, suffix: 'mm/s', width: 'w-32', default: 30, desc: "Speed at which filament is pulled back during a retraction." },
        { key: 'deretraction_speed', label: 'Deretraction Speed', type: 'number', step: 1, suffix: 'mm/s', width: 'w-32', default: 30, desc: "Speed at which filament is pushed back out after a retraction, before resuming extrusion." },
        { key: 'retract_restart_extra', label: 'Extra length on restart', type: 'number', step: 0.1, suffix: 'mm', width: 'w-32', default: 0, desc: "Extra filament length pushed out after a retraction, on top of the retraction length, to compensate for pressure loss. Rarely needed with direct drive extruders." },
        { key: 'retract_before_travel', label: 'Travel distance threshold', type: 'number', step: 0.1, suffix: 'mm', width: 'w-32', default: 2, desc: "The minimum travel distance that triggers a retraction. Shorter travel moves print without retracting." },
        { key: 'retract_on_layer_change', label: 'Retract when change layer', type: 'boolean', width: 'w-full', default: false, desc: "Forces a retraction every time the printer moves up to a new layer, regardless of travel distance." },
        { key: 'wipe_while_retracting', label: 'Wipe while retracting', type: 'boolean', width: 'w-full', default: false, desc: "Moves the nozzle along the last printed wall while retracting, to reduce oozing and stringing." },
        { key: 'wipe_distance', label: 'Wipe Distance', type: 'number', step: 0.1, suffix: 'mm', width: 'w-32', default: 1.0, desc: "Distance the nozzle wipes along the last printed wall during retraction. Reduces stringing and oozing at travel start/end points. Default: 1.0mm." },
        { key: 'retract_before_wipe', label: 'Retract amount before wipe', type: 'number', step: 1, suffix: '%', width: 'w-32', default: 100, desc: "The percentage of the retraction to complete before the wipe move starts." },
        { key: 'long_retraction_when_cut', label: 'Long retraction when cut (experimental)', type: 'boolean', width: 'w-full', default: true, desc: "Performs a longer retraction before the filament is cut, so less filament is left in the hotend afterward. Experimental — may not suit every setup." },
        { key: 'retraction_distance_when_cut', label: 'Retraction distance when cut', type: 'number', step: 1, suffix: 'mm', width: 'w-32', default: 18, desc: "How far filament is retracted before it's cut, when Long retraction when cut is enabled." },

        { type: 'heading', label: 'Speed' },
        { key: 'override_overhang_speed', label: 'Override overhang speed', type: 'boolean', width: 'w-full', default: false, desc: "Lets this filament use its own overhang print speeds instead of the linked print profile's." },

        { type: 'heading', label: 'Flow Dynamics' },
        { key: 'pressure_advance', label: 'Pressure Advance (K)', type: 'number', step: 0.001, width: 'w-32', default: 0.02, desc: "Bambu's Flow Dynamics Calibration K-value. Compensates for pressure buildup in the nozzle, reducing blobs at corners and improving accuracy. Typical PLA: 0.01–0.04. Run the built-in calibration for best results." },
    ],
    scarf_seam: [
        { type: 'heading', label: 'Filament Scarf Seam Settings' },
        { key: 'scarf_seam_type', label: 'Scarf Seam Type', type: 'select', options: ['none', 'outer', 'inner', 'both'], width: 'w-full', default: 'none', desc: "A technique to reduce the visibility of the seam by overlapping the start and end of the perimeter." },
        { key: 'scarf_start_height', label: 'Scarf Start Height', type: 'number', suffix: '%', width: 'w-32', default: 10, desc: "The height at which to start the scarf seam, as a percentage of layer height (or mm if given as an absolute value)." },
        { key: 'scarf_slope_gap', label: 'Scarf Slope Gap', type: 'number', suffix: '%', width: 'w-32', default: 0, desc: "The gap in the slope of the scarf seam." },
        { key: 'scarf_length', label: 'Scarf Length', type: 'number', suffix: 'mm', width: 'w-32', default: 5, desc: "The length of the scarf seam overlap." }
    ]
};