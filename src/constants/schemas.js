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
        { type: 'heading', label: 'Layer height' },
        { key: 'layer_height', label: 'Layer height', type: 'number', step: 0.04, suffix: 'mm', default: 0.2, desc: "Thickness of each layer. Lower values increase detail but also print time. A common default is 0.2mm." },
        { key: 'first_layer_height', label: 'Initial layer height', type: 'number', step: 0.05, suffix: 'mm', default: 0.2, desc: "Height of the first layer. A slightly thicker first layer (0.2–0.3mm) improves bed adhesion regardless of the main layer height setting. Default: 0.2mm." },
        { key: 'mixed_color_sublayer', label: 'Mixed color sublayer', type: 'boolean', default: false, desc: "Splits color-change layers into thinner sublayers so multi-color transitions blend more gradually." },

        { type: 'heading', label: 'Line width' },
        { key: 'line_width_default', label: 'Default', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "The default extrusion line width, used wherever a more specific line width below isn't set." },
        { key: 'line_width_initial_layer', label: 'Initial layer', type: 'number', step: 0.01, suffix: 'mm', default: 0.5, desc: "Extrusion line width for the first layer. Often wider than other layers to improve bed adhesion." },
        { key: 'outer_wall_line_width', label: 'Outer wall', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Width of the extruded outer wall line. Slightly wider than the nozzle (e.g., 0.42mm for a 0.4mm nozzle) creates tighter, stronger walls. Default: 0.42mm." },
        { key: 'line_width_inner_wall', label: 'Inner wall', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Extrusion line width for inner (non-visible) walls." },
        { key: 'line_width_top_surface', label: 'Top surface', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Extrusion line width for top solid surface layers." },
        { key: 'line_width_sparse_infill', label: 'Sparse infill', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Extrusion line width for the low-density internal infill." },
        { key: 'line_width_internal_solid_infill', label: 'Internal solid infill', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Extrusion line width for solid infill layers (top/bottom shells)." },
        { key: 'line_width_support', label: 'Support', type: 'number', step: 0.01, suffix: 'mm', default: 0.42, desc: "Extrusion line width for support structures." },

        { type: 'heading', label: 'Seam' },
        { key: 'seam_position', label: 'Seam position', type: 'select', options: ['aligned', 'back', 'random', 'nearest'], default: 'aligned', desc: "Controls where each layer's start/end point is located. 'Aligned' creates a single seam, 'Back' hides it on the rear, 'Nearest' places it in a corner, and 'Random' distributes it across the surface." },
        { key: 'seam_away_from_overhangs', label: 'Seam placement away from overhangs (experimental)', type: 'boolean', default: false, desc: "Keeps the seam away from overhangs and bridges, where it would otherwise be most visible or weakest." },
        { key: 'smart_scarf_seam_application', label: 'Smart scarf seam application', type: 'boolean', default: true, desc: "Automatically applies a scarf seam only where it's actually useful (e.g. skips very short perimeters), instead of everywhere." },
        { key: 'scarf_application_angle_threshold', label: 'Scarf application angle threshold', type: 'number', suffix: 'deg', default: 155, desc: "Perimeter corners sharper than this angle are excluded from scarf seam application." },
        { key: 'scarf_around_entire_wall', label: 'Scarf around entire wall', type: 'boolean', default: false, desc: "Extends the scarf seam transition around the entire perimeter rather than just at the seam point." },
        { key: 'scarf_steps', label: 'Scarf steps', type: 'number', default: 10, desc: "Number of discrete height steps used to build the scarf seam's sloped transition." },
        { key: 'scarf_joint_for_inner_walls', label: 'Scarf joint for inner walls', type: 'boolean', default: true, desc: "Applies the scarf seam technique to inner walls in addition to the outer wall." },
        { key: 'override_filament_scarf_seam_setting', label: 'Override filament scarf seam setting', type: 'boolean', default: false, desc: "Uses this profile's scarf seam settings instead of the linked filament's." },
        { key: 'role_based_wipe_speed', label: 'Role-based wipe speed', type: 'boolean', default: true, desc: "Scales the wipe move speed to match the print speed of the feature it follows, instead of using a single fixed wipe speed." },

        { type: 'heading', label: 'Precision' },
        { key: 'slice_gap_closing_radius', label: 'Slice gap closing radius', type: 'number', step: 0.001, suffix: 'mm', default: 0.049, desc: "Gaps between perimeters narrower than this radius are closed rather than left as tiny unprintable slivers." },
        { key: 'resolution', label: 'Resolution', type: 'number', step: 0.001, suffix: 'mm', default: 0.012, desc: "The minimum feature/deviation size used when simplifying model geometry. Lower values preserve more curve detail at the cost of slicing time and file size." },
        { key: 'arc_fitting', label: 'Arc fitting', type: 'boolean', default: true, desc: "Converts sequences of tiny line segments on curves into native G-code arc moves, producing smoother curves and smaller G-code files." },
        { key: 'xy_hole_compensation', label: 'X-Y hole compensation', type: 'number', step: 0.01, suffix: 'mm', default: 0, desc: "Expands (positive) or shrinks (negative) holes in the XY plane to compensate for consistent over/under-extrusion of interior features." },
        { key: 'xy_contour_compensation', label: 'X-Y contour compensation', type: 'number', step: 0.01, suffix: 'mm', default: 0, desc: "Expands (positive) or shrinks (negative) the model's outer contour in the XY plane to compensate for consistent over/under-extrusion." },
        { key: 'auto_circle_compensation', label: 'Auto circle contour-hole compensation', type: 'boolean', default: false, desc: "Automatically applies contour/hole compensation only to circular features, where sizing accuracy is most visible." },
        { key: 'precision_walls', label: 'Precision Walls', type: 'boolean', default: true, desc: "Intended to improve dimensional accuracy and reduce Z-banding by adjusting the wall generation algorithm." },
        { key: 'elephant_foot_compensation', label: 'Elephant foot compensation', type: 'number', step: 0.01, suffix: 'mm', default: 0.0, desc: "Reduces the first layer perimeter width to counteract the squishing effect on the bed, improving dimensional accuracy at the base. Default: 0mm (disabled)." },
        { key: 'precise_z_height', label: 'Precise Z height', type: 'boolean', default: false, desc: "Adjusts each layer's actual Z height slightly so the total print height matches the model exactly, instead of always using whole multiples of the layer height." },

        { type: 'heading', label: 'Ironing' },
        { key: 'ironing_type', label: 'Ironing Type', type: 'select', options: ['no_ironing', 'top_surfaces', 'all_top'], default: 'no_ironing', desc: "Smooths top surfaces by making an extra pass with minimal filament flow. 'Top Surfaces' irons all flat top areas." },

        { type: 'heading', label: 'Wall generator' },
        { key: 'wall_generator', label: 'Wall generator', type: 'select', options: ['classic', 'arachne'], default: 'arachne', desc: "'Arachne' (default) uses a variable extrusion width, ideal for thin walls and sharp corners. 'Classic' uses a fixed width." },

        { type: 'heading', label: 'Advanced' },
        { key: 'wall_order', label: 'Order of walls', type: 'select', options: ['inner/outer', 'outer/inner', 'inner/outer/inner'], default: 'inner/outer', desc: "The order in which multiple perimeter walls are printed." },
        { key: 'print_infill_first', label: 'Print infill first', type: 'boolean', default: false, desc: "Prints infill before the walls of each layer, instead of after." },
        { key: 'bridge_flow', label: 'Bridge flow', type: 'number', step: 0.01, default: 1, desc: "Flow rate multiplier applied specifically to bridging extrusions, to reduce sagging." },
        { key: 'thick_bridges', label: 'Thick bridges', type: 'boolean', default: false, desc: "Prints bridges at a full layer height instead of a thinner, flow-adjusted height." },
        { key: 'only_one_wall_top_surfaces', label: 'Only one wall on top surfaces', type: 'select', options: ['None', 'Top surfaces', 'All top surfaces'], default: 'Top surfaces', desc: "Prints only a single wall loop under top surfaces (instead of the full wall count) to leave more room for solid infill." },
        { key: 'only_one_wall_first_layer', label: 'Only one wall on first layer', type: 'boolean', default: false, desc: "Prints only a single wall loop on the first layer." },
        { key: 'smooth_speed_discontinuity_area', label: 'Smooth speed discontinuity area', type: 'boolean', default: true, desc: "Smooths abrupt speed changes between adjacent print moves to reduce visible artifacts." },
        { key: 'smooth_coefficient', label: 'Smooth coefficient', type: 'number', default: 80, desc: "Controls how aggressively speed discontinuities are smoothed. Higher values smooth more." },
        { key: 'avoid_crossing_wall', label: 'Avoid crossing wall', type: 'boolean', default: false, desc: "Routes travel moves around walls instead of through them, reducing visible travel artifacts at the cost of longer travel paths." },
        { key: 'smooth_wall_speed_z', label: 'Smoothing wall speed along Z (experimental)', type: 'boolean', default: false, desc: "Gradually ramps wall speed changes across the Z axis instead of changing abruptly layer-to-layer." },
    ],
    strength: [
        { type: 'heading', label: 'Walls' },
        { key: 'wall_loops', label: 'Wall loops', type: 'number', step: 1, default: 2, desc: "The number of perimeter walls. More walls increase strength but also print time and material usage. Default is 2." },
        { key: 'embed_wall_in_infill', label: 'Embedding the wall into the infill', type: 'boolean', default: false, desc: "Lets sparse infill overlap slightly into the innermost wall loop, improving the bond between walls and infill." },
        { key: 'detect_thin_wall', label: 'Detect thin wall', type: 'boolean', default: false, desc: "Detects walls too narrow to fit the normal wall count and prints them with a single, width-adjusted line instead of leaving gaps." },
        { key: 'detect_overhang_wall', label: 'Detect overhang wall', type: 'boolean', default: true, desc: "Identifies overhanging walls and reduces print speed and/or increases fan to improve their quality. Recommended to keep enabled." },

        { type: 'heading', label: 'Top/bottom shells' },
        { key: 'top_surface_pattern', label: 'Top surface pattern', type: 'select', options: ['monotonic', 'monotonic_line', 'concentric', 'rectilinear', 'aligned_rectilinear', 'grid', 'zig_zag'], default: 'monotonic', desc: "'Monotonic' produces the smoothest visible top surface by printing lines in a consistent direction with no crossings. Default: monotonic." },
        { key: 'top_surface_density', label: 'Top surface density', type: 'number', suffix: '%', default: 100, desc: "Fill density of the top solid surface layers." },
        { key: 'top_shell_layers', label: 'Top shell layers', type: 'number', step: 1, default: 3, desc: "Number of solid layers on the top of the model. More layers improve surface finish and strength. Default: 3-5." },
        { key: 'top_shell_thickness', label: 'Top shell thickness', type: 'number', step: 0.1, suffix: 'mm', default: 0.6, desc: "Minimum total thickness of the top solid shell — the effective layer count is whichever of this or Top shell layers requires more layers." },
        { key: 'top_paint_penetration_layers', label: 'Top paint penetration layers', type: 'number', default: 2, desc: "How many layers below a top-painted surface are also treated as solid, so painted seams/supports don't show through thin infill." },
        { key: 'bottom_surface_pattern', label: 'Bottom surface pattern', type: 'select', options: ['monotonic', 'monotonic_line', 'concentric', 'rectilinear', 'aligned_rectilinear', 'grid', 'zig_zag'], default: 'monotonic', desc: "Fill pattern for the bottom layer surface. 'Monotonic' is recommended for the smoothest result. Default: monotonic." },
        { key: 'bottom_surface_density', label: 'Bottom surface density', type: 'number', suffix: '%', default: 100, desc: "Fill density of the bottom solid surface layers." },
        { key: 'bottom_shell_layers', label: 'Bottom shell layers', type: 'number', step: 1, default: 3, desc: "Number of solid layers at the bottom of the model. More layers improve adhesion and strength. Default: 3-5." },
        { key: 'bottom_shell_thickness', label: 'Bottom shell thickness', type: 'number', step: 0.1, suffix: 'mm', default: 0, desc: "Minimum total thickness of the bottom solid shell — the effective layer count is whichever of this or Bottom shell layers requires more layers." },
        { key: 'bottom_paint_penetration_layers', label: 'Bottom paint penetration layers', type: 'number', default: 2, desc: "How many layers above a bottom-painted surface are also treated as solid." },
        { key: 'internal_solid_infill_pattern', label: 'Internal solid infill pattern', type: 'select', options: ['Rectilinear', 'Monotonic', 'Grid'], default: 'Rectilinear', desc: "Fill pattern used for internal solid infill regions (e.g. under bridges, around sparse infill transitions)." },

        { type: 'heading', label: 'Sparse infill' },
        { key: 'sparse_infill_density', label: 'Sparse infill density', type: 'number', suffix: '%', default: 15, desc: "The density of the internal support structure. Higher values increase strength and weight. Common values are 15-25%. Default: 15%." },
        { key: 'fill_multiline', label: 'Fill multiline', type: 'number', default: 1, desc: "Number of parallel lines used per infill pass, for infill patterns that support it." },
        { key: 'sparse_infill_pattern', label: 'Sparse infill pattern', type: 'select', options: ['grid', 'gyroid', 'rectilinear', 'honeycomb'], default: 'grid', desc: "Pattern of the internal infill. 'Grid' is fast, 'Gyroid' is strong in all directions, 'Honeycomb' is strong and light." },
        { key: 'sparse_infill_anchor_length', label: 'Length of sparse infill anchor', type: 'text', suffix: 'mm or %', default: '400%', desc: "How far infill lines extend into the perimeter to anchor themselves, as an absolute length or a percentage of the infill line spacing." },
        { key: 'sparse_infill_anchor_max', label: 'Maximum length of sparse infill anchor', type: 'text', suffix: 'mm or %', default: '20mm', desc: "Caps the anchor length above, so very sparse infill doesn't anchor an excessive distance into the perimeter." },

        { type: 'heading', label: 'Advanced' },
        { key: 'infill_wall_overlap', label: 'Infill/Wall overlap', type: 'number', suffix: '%', default: 15, desc: "How far sparse infill overlaps into the innermost wall, to ensure a solid bond between them." },
        { key: 'infill_direction', label: 'Infill direction', type: 'number', suffix: 'deg', default: 45, desc: "The angle of the sparse infill pattern on the first layer it's used. Alternates on subsequent layers for some patterns." },
        { key: 'bridge_direction', label: 'Bridge direction', type: 'number', suffix: 'deg', default: 0, desc: "The angle bridging extrusions are printed at, relative to the X axis. 0 lets the slicer choose automatically based on the span being bridged." },
        { key: 'min_sparse_infill_threshold', label: 'Minimum sparse infill threshold', type: 'number', suffix: 'mm²', default: 15, desc: "Infill regions smaller than this area are filled solid instead of with sparse infill." },
        { key: 'infill_combination', label: 'Infill combination', type: 'boolean', default: false, desc: "Combines multiple thin infill layers into a single thicker extrusion pass to save time on high sparse-infill-density prints." },
        { key: 'detect_narrow_internal_solid_infill', label: 'Detect narrow internal solid infill', type: 'boolean', default: true, desc: "Detects narrow solid infill regions and prints them with a single, width-adjusted line instead of leaving gaps." },
        { key: 'ensure_vertical_shell_thickness', label: 'Ensure vertical shell thickness', type: 'select', options: ['Disabled', 'Ensure only critical surfaces', 'Enabled'], default: 'Enabled', desc: "Adds extra solid infill wherever sparse infill would otherwise leave the top/bottom shell thinner than intended, e.g. on steep slopes." },
        { key: 'detect_floating_vertical_shells', label: 'Detect floating vertical shells', type: 'boolean', default: true, desc: "Detects vertical shell regions with no infill support beneath them and reinforces them to prevent sagging or collapse." },
    ],
    speed: [
        { type: 'heading', label: 'Initial layer speed' },
        { key: 'first_layer', label: 'Initial layer', type: 'number', suffix: 'mm/s', default: 50, desc: "Speed for the very first layer. A slow speed is critical for good bed adhesion. Default: 50 mm/s." },
        { key: 'initial_layer_infill', label: 'Initial layer infill', type: 'number', suffix: 'mm/s', default: 60, desc: "Infill print speed on the first layer only." },

        { type: 'heading', label: 'Other layers speed' },
        { key: 'outer_wall', label: 'Outer wall', type: 'number', suffix: 'mm/s', default: 200, desc: "Speed for printing the outermost wall. Slower speeds improve surface quality. Default: 200 mm/s." },
        { key: 'inner_wall', label: 'Inner wall', type: 'number', suffix: 'mm/s', default: 300, desc: "Speed for printing inner walls. Can be faster than the outer wall. Default: 300 mm/s." },
        { key: 'small_perimeters', label: 'Small perimeters', type: 'text', suffix: 'mm/s or %', default: '50%', desc: "Speed for perimeters short enough to trigger the threshold below, as an absolute speed or a percentage of the outer wall speed. Slowing these down improves quality on fine details." },
        { key: 'small_perimeter_threshold', label: 'Small perimeter threshold', type: 'number', suffix: 'mm', default: 0, desc: "Perimeters with a length below this are treated as 'small' and use the Small perimeters speed above. 0 disables the override." },
        { key: 'sparse_infill', label: 'Sparse infill', type: 'number', suffix: 'mm/s', default: 270, desc: "Speed for printing the low-density internal infill. Can be very fast. Default: 270 mm/s." },
        { key: 'solid_infill', label: 'Internal solid infill', type: 'number', suffix: 'mm/s', default: 250, desc: "Speed for printing solid internal layers. Default: 250 mm/s." },
        { key: 'vertical_shell_speed', label: 'Vertical shell speed', type: 'text', suffix: 'mm/s or %', default: '80%', desc: "Print speed for solid infill added to maintain vertical shell thickness on slopes, as an absolute speed or a percentage of internal solid infill speed." },
        { key: 'top_surface', label: 'Top surface', type: 'number', suffix: 'mm/s', default: 200, desc: "Speed for the final top layers. Slower speeds create a better finish. Default: 200 mm/s." },
        { key: 'slow_down_for_overhangs', label: 'Slow down for overhangs', type: 'boolean', default: true, desc: "Scales print speed down on overhanging perimeters based on how unsupported they are, using the per-percentage overhang speeds below." },
        { key: 'overhang_speed_10', label: 'Overhang speed (10% overhang)', type: 'number', suffix: 'mm/s', default: 0, desc: "Print speed for perimeters that are about 10% unsupported. 0 uses the normal wall speed." },
        { key: 'overhang_speed_25', label: 'Overhang speed (25% overhang)', type: 'number', suffix: 'mm/s', default: 50, desc: "Print speed for perimeters that are about 25% unsupported." },
        { key: 'overhang_speed_50', label: 'Overhang speed (50% overhang)', type: 'number', suffix: 'mm/s', default: 30, desc: "Print speed for perimeters that are about 50% unsupported." },
        { key: 'overhang_speed_75', label: 'Overhang speed (75% overhang)', type: 'number', suffix: 'mm/s', default: 10, desc: "Print speed for perimeters that are about 75% unsupported." },
        { key: 'overhang_speed_100', label: 'Overhang speed (100% overhang)', type: 'number', suffix: 'mm/s', default: 10, desc: "Print speed for perimeters that are fully unsupported, bridging onto thin air." },
        { key: 'slow_down_by_height', label: 'Slow down by height', type: 'boolean', default: false, desc: "Further reduces print speed based on the model's total height, for tall prints prone to wobble." },
        { key: 'bridge_speed', label: 'Bridge', type: 'number', suffix: 'mm/s', default: 50, desc: "Print speed for bridging extrusions." },
        { key: 'gap_infill_speed', label: 'Gap infill', type: 'number', suffix: 'mm/s', default: 50, desc: "Print speed for the thin infill used to fill narrow gaps between walls." },
        { key: 'support_speed', label: 'Support', type: 'number', suffix: 'mm/s', default: 150, desc: "Print speed for support structures." },
        { key: 'support_interface_speed', label: 'Support interface', type: 'number', suffix: 'mm/s', default: 80, desc: "Print speed for the denser interface layers between support and the model." },

        { type: 'heading', label: 'Travel speed' },
        { key: 'travel', label: 'Travel', type: 'number', suffix: 'mm/s', default: 500, desc: "Speed of the print head when not extruding. Higher values reduce print time but can cause artifacts if too high. Default: 500 mm/s." },

        { type: 'heading', label: 'Acceleration' },
        { key: 'acceleration', label: 'Normal printing', type: 'number', suffix: 'mm/s²', default: 5000, desc: "The rate at which the print head changes speed during normal printing moves. Higher values enable faster prints but may reduce quality. Default: 5000 mm/s²." },
        { key: 'travel_acceleration', label: 'Travel', type: 'number', suffix: 'mm/s²', default: 10000, desc: "Acceleration for non-extruding travel moves." },
        { key: 'initial_layer_travel_acceleration', label: 'Initial layer travel', type: 'number', suffix: 'mm/s²', default: 6000, desc: "Travel move acceleration on the first layer only." },
        { key: 'initial_layer_acceleration', label: 'Initial layer', type: 'number', suffix: 'mm/s²', default: 500, desc: "Print acceleration on the first layer only. Kept low to protect bed adhesion." },
        { key: 'outer_wall_acceleration', label: 'Outer wall', type: 'number', suffix: 'mm/s²', default: 5000, desc: "Acceleration used specifically for the outer wall." },
        { key: 'inner_wall_acceleration', label: 'Inner wall', type: 'number', suffix: 'mm/s²', default: 0, desc: "Acceleration used specifically for inner walls. 0 uses the normal printing acceleration." },
        { key: 'top_surface_acceleration', label: 'Top surface', type: 'number', suffix: 'mm/s²', default: 2000, desc: "Acceleration used specifically for top surface layers." },
        { key: 'sparse_infill_acceleration', label: 'Sparse infill', type: 'text', suffix: 'mm/s² or %', default: '100%', desc: "Acceleration used specifically for sparse infill, as an absolute value or a percentage of the normal printing acceleration." },
    ],
    support: [
        { type: 'heading', label: 'Support' },
        { key: 'enable', label: 'Enable support', type: 'boolean', default: false, desc: "Generates structures to support overhangs and bridges during printing." },
        { key: 'type', label: 'Type', type: 'select', options: ['normal(auto)', 'tree(auto)'], default: 'tree(auto)', desc: "'Normal' supports are grid-like structures. 'Tree' supports are organic, branch-like structures that use less material and are often easier to remove. '(auto)' lets the slicer decide where supports are actually needed." },
        { key: 'style', label: 'Style', type: 'select', options: ['default', 'tree_slim', 'tree_strong', 'snug'], default: 'tree_slim', desc: "Affects the shape and strength of tree supports." },
        { key: 'threshold_angle', label: 'Threshold angle', type: 'number', suffix: 'deg', default: 30, desc: "The minimum overhang angle at which supports will be generated. A value of 0 supports everything, 90 supports nothing. Default: 30 degrees." },
        { key: 'on_build_plate_only', label: 'On build plate only', type: 'boolean', default: false, desc: "Only generates supports that rest on the build plate, skipping supports that would otherwise touch the model itself." },
        { key: 'remove_small_overhangs', label: 'Remove small overhangs', type: 'boolean', default: true, desc: "Skips generating support for very small overhangs, which usually print fine unsupported and would otherwise add clutter and cleanup time." },

        { type: 'heading', label: 'Raft' },
        { key: 'raft_layers', label: 'Raft layers', type: 'number', suffix: 'layers', default: 0, desc: "Number of raft layers printed under the model before the first real layer. 0 disables the raft." },

        { type: 'heading', label: 'Filament for Supports' },
        { key: 'support_filament', label: 'Support/raft base', type: 'text', default: 'Default', desc: "Which filament/extruder prints the support base. 'Default' uses the same filament as the model." },
        { key: 'support_interface_filament', label: 'Support/raft interface', type: 'text', default: 'Default', desc: "Which filament/extruder prints the support interface layers. 'Default' uses the same filament as the model." },

        { type: 'heading', label: 'Advanced' },
        { key: 'support_initial_layer_density', label: 'Initial layer density', type: 'number', suffix: '%', default: 90, desc: "Fill density of the support's first layer, denser than the rest of the support to improve adhesion to the bed." },
        { key: 'support_initial_layer_expansion', label: 'Initial layer expansion', type: 'number', suffix: 'mm', default: -1, desc: "Expands the support footprint on the first layer for better adhesion. -1 uses the slicer's automatic value." },
        { key: 'support_wall_loops', label: 'Support wall loops', type: 'number', default: -1, desc: "Number of perimeter loops around support structures. -1 lets the slicer decide automatically." },
        { key: 'support_top_z_distance', label: 'Top Z distance', type: 'number', step: 0.01, suffix: 'mm', default: 0.1, desc: "Vertical gap left between the top of the support and the model above it, so supports can be removed cleanly." },
        { key: 'support_bottom_z_distance', label: 'Bottom Z distance', type: 'number', step: 0.01, suffix: 'mm', default: 0.1, desc: "Vertical gap left between the model and the support below it." },
        { key: 'support_base_pattern', label: 'Base pattern', type: 'select', options: ['Default', 'Rectilinear', 'Rectilinear Grid', 'Honeycomb'], default: 'Default', desc: "Fill pattern used for the bulk of the support structure." },
        { key: 'support_base_pattern_spacing', label: 'Base pattern spacing', type: 'number', step: 0.1, suffix: 'mm', default: 2.5, desc: "Spacing between lines of the support base pattern. Wider spacing prints faster and is easier to remove but is less rigid." },
        { key: 'support_pattern_angle', label: 'Pattern angle', type: 'number', suffix: 'deg', default: 0, desc: "Rotation angle applied to the support fill pattern." },
        { key: 'support_top_interface_layers', label: 'Top interface layers', type: 'number', suffix: 'layers', default: 2, desc: "Number of dense interface layers printed between the support and the surface above it, for a cleaner surface finish." },
        { key: 'support_bottom_interface_layers', label: 'Bottom interface layers', type: 'number', suffix: 'layers', default: 2, desc: "Number of dense interface layers printed between the support and the surface below it." },
        { key: 'support_interface_pattern', label: 'Interface pattern', type: 'select', options: ['Default', 'Rectilinear', 'Concentric'], default: 'Default', desc: "Fill pattern used for the denser support interface layers." },
        { key: 'support_top_interface_spacing', label: 'Top interface spacing', type: 'number', step: 0.1, suffix: 'mm', default: 0.5, desc: "Spacing between lines of the top interface pattern. Tighter spacing gives a smoother supported surface but is harder to remove." },
        { key: 'support_normal_expansion', label: 'Normal Support expansion', type: 'number', step: 0.1, suffix: 'mm', default: 0, desc: "Expands the support outline outward in the XY plane." },
        { key: 'support_object_xy_distance', label: 'Support/object xy distance', type: 'number', step: 0.01, suffix: 'mm', default: 0.35, desc: "Horizontal gap kept between support structures and the model, so supports can be snapped off cleanly." },
        { key: 'support_z_overrides_xy', label: 'Z overrides X/Y', type: 'boolean', default: false, desc: "When support and the model would overlap in both Z and XY, prioritizes the Z distance setting over the XY distance setting." },
        { key: 'support_object_first_layer_gap', label: "Support/object first layer gap", type: 'number', step: 0.1, suffix: 'mm', default: 0.2, desc: "Horizontal gap kept between support and the model specifically on the first layer, where extra clearance helps adhesion." },
        { key: 'support_dont_support_bridges', label: "Don't support bridges", type: 'boolean', default: false, desc: "Skips generating support underneath bridges, relying on the bridging algorithm instead." },
        { key: 'support_independent_layer_height', label: 'Independent support layer height', type: 'boolean', default: true, desc: "Lets support structures use their own layer height instead of matching the model's, which can significantly speed up printing tall supports." },
    ],
    others: [
        { type: 'heading', label: 'Bed adhesion' },
        { key: 'skirt_loops', label: 'Skirt loops', type: 'number', default: 0, desc: "A skirt is an outline printed around the model before the model itself, used to prime the nozzle. This sets the number of loops. Default: 1." },
        { key: 'skirt_height', label: 'Skirt height', type: 'number', suffix: 'layers', default: 1, desc: "Number of layers the skirt is printed for." },
        { key: 'brim_type', label: 'Brim type', type: 'select', options: ['auto', 'outer_only', 'inner_only', 'no_brim'], default: 'auto', desc: "A brim adds a single-layer flat area around your model's base to improve bed adhesion. 'Auto' enables it only when needed." },
        { key: 'brim_width', label: 'Brim width', type: 'number', suffix: 'mm', default: 5, desc: "The width of the brim. A wider brim provides more adhesion. Default: 5mm." },
        { key: 'brim_object_gap', label: 'Brim-object gap', type: 'number', step: 0.01, suffix: 'mm', default: 0.1, desc: "Small gap left between the brim and the model, making the brim easier to remove cleanly." },

        { type: 'heading', label: 'Prime tower' },
        { key: 'prime_tower_enable', label: 'Enable', type: 'boolean', default: true, desc: "Prints a prime tower — a small structure used to purge and stabilize flow during filament/color changes with the AMS." },
        { key: 'prime_tower_skip_points', label: 'Skip points', type: 'boolean', default: true, desc: "Skips wiping at the prime tower when the upcoming filament change doesn't need it, saving time and filament." },
        { key: 'prime_tower_internal_ribs', label: 'Internal ribs', type: 'boolean', default: false, desc: "Adds internal ribs inside the prime tower to improve its structural rigidity." },
        { key: 'prime_tower_width', label: 'Width', type: 'number', suffix: 'mm', default: 35, desc: "The width of the (square) prime tower base." },
        { key: 'prime_tower_max_speed', label: 'Max speed', type: 'number', suffix: 'mm/s', default: 90, desc: "The maximum print speed used while printing the prime tower." },
        { key: 'prime_tower_brim_width', label: 'Brim width', type: 'number', suffix: 'mm', default: 3, desc: "Width of the brim printed around the prime tower's base for extra adhesion." },
        { key: 'prime_tower_infill_gap', label: 'Infill gap', type: 'number', suffix: '%', default: 150, desc: "Spacing between the prime tower's internal infill lines, as a percentage of the line width." },
        { key: 'prime_tower_rib_wall', label: 'Rib wall', type: 'boolean', default: true, desc: "Prints a thin wall around each internal rib of the prime tower." },
        { key: 'prime_tower_extra_rib_length', label: 'Extra rib length', type: 'number', suffix: 'mm', default: 0, desc: "Extends the prime tower's internal ribs beyond the tower's own footprint for extra rigidity." },
        { key: 'prime_tower_rib_width', label: 'Rib width', type: 'number', suffix: 'mm', default: 8, desc: "Width of each internal rib inside the prime tower." },
        { key: 'prime_tower_fillet_wall', label: 'Fillet wall', type: 'boolean', default: true, desc: "Rounds the corners of the prime tower's wall, reducing stress concentration and improving print reliability." },

        { type: 'heading', label: "Purge options" },
        { key: 'purge_into_infill', label: "Purge into objects' infill", type: 'boolean', default: false, desc: "Purges filament-change waste into the sparse infill of the model itself instead of (or in addition to) the prime tower, saving material." },
        { key: 'purge_into_support', label: "Purge into objects' support", type: 'boolean', default: true, desc: "Purges filament-change waste into support structures instead of (or in addition to) the prime tower." },

        { type: 'heading', label: 'Special mode' },
        { key: 'slicing_mode', label: 'Slicing Mode', type: 'select', options: ['Regular', 'Loose'], default: 'Regular', desc: "'Regular' slicing expects a well-formed, manifold model. 'Loose' is more forgiving of imperfect geometry, at the cost of slicing speed and reliability." },
        { key: 'print_sequence', label: 'Print sequence', type: 'select', options: ['By layer', 'By object'], default: 'By layer', desc: "'By layer' prints all objects together, one layer at a time. 'By object' completes one object fully before starting the next — useful for tall, widely-spaced objects." },
        { key: 'spiral_vase', label: 'Spiral vase', type: 'boolean', default: false, desc: "Prints the model as a single continuous spiral wall with no top layers or infill, for vase-like objects." },
        { key: 'timelapse', label: 'Timelapse', type: 'select', options: ['Traditional', 'Smooth', 'Disable'], default: 'Traditional', desc: "Captures a timelapse video by moving the toolhead out of frame between layers ('Traditional') or at each print move ('Smooth')." },
        { key: 'fuzzy_skin', label: 'Fuzzy Skin', type: 'select', options: ['None', 'Outer wall', 'All walls'], default: 'None', desc: "Adds random texture to walls, hiding layer lines at the cost of dimensional accuracy — a stylistic/matte finish effect." },
        { key: 'fuzzy_skin_generator_mode', label: 'Fuzzy skin generator mode', type: 'select', options: ['Displacement', 'Voronoi'], default: 'Displacement', desc: "The algorithm used to generate the fuzzy skin texture." },
        { key: 'fuzzy_skin_noise_type', label: 'Fuzzy skin noise type', type: 'select', options: ['Classic', 'Perlin', 'Billow', 'Ridged Multifractal', 'Voronoi'], default: 'Classic', desc: "The noise pattern used to randomize the fuzzy skin texture." },
        { key: 'fuzzy_skin_point_distance', label: 'Fuzzy skin point distance', type: 'number', step: 0.01, suffix: 'mm', default: 0.3, desc: "Average distance between the randomly-displaced points that make up the fuzzy skin texture." },
        { key: 'fuzzy_skin_thickness', label: 'Fuzzy skin thickness', type: 'number', step: 0.01, suffix: 'mm', default: 0.2, desc: "Maximum distance points are randomly displaced to create the fuzzy skin texture." },
        { key: 'fuzzy_skin_first_layer', label: 'Apply fuzzy skin to first layer', type: 'boolean', default: false, desc: "Also applies the fuzzy skin texture to the first layer, instead of starting from the second." },

        { type: 'heading', label: 'Advanced' },
        { key: 'use_beam_interlocking', label: 'Use beam interlocking', type: 'boolean', default: false, desc: "Generates interlocking beam structures at multi-material interfaces to mechanically bond filaments that don't adhere well chemically." },
        { key: 'interlocking_depth', label: 'Interlocking depth of a segmented region', type: 'number', suffix: 'mm', default: 0, desc: "Depth of the interlocking beam structure generated at multi-material interfaces." },

        { type: 'heading', label: 'G-code output' },
        { key: 'reduce_infill_retraction', label: 'Reduce infill retraction', type: 'select', options: ['Auto', 'Enabled', 'Disabled'], default: 'Auto', desc: "Skips retraction on travel moves within infill regions, where stringing is less visible, to save time." },

        { type: 'heading', label: 'Post-processing scripts' },
        { key: 'post_processing_scripts', label: 'Post-processing scripts', type: 'textarea', default: '', desc: "Paths to external scripts run on the finished G-code file before it's sent to the printer, one per line." },

        { type: 'heading', label: 'Notes' },
        { key: 'notes', label: 'Notes', type: 'textarea', default: '', desc: "Freeform notes about this print profile." },
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