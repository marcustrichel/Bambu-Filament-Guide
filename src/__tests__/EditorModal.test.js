import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditorModal from '@/components/EditorModal.vue'

// --- Fixtures ---

const profileItem = {
  id: 'profile-1',
  name: 'Test Profile',
  printer_model: 'A1 Mini',
  user_id: 'user-1',
  quality: { layer_height: 0.2, first_layer_height: 0.2, outer_wall_line_width: 0.42, seam_position: 'aligned', wall_generator: 'arachne', ironing_type: 'no_ironing', precision_walls: true },
  strength: { wall_loops: 2, top_shell_layers: 3, bottom_shell_layers: 3, sparse_infill_density: 15, sparse_infill_pattern: 'grid', top_surface_pattern: 'monotonic', bottom_surface_pattern: 'monotonic', detect_overhang_wall: true },
  speed: { outer_wall: 200, inner_wall: 300, sparse_infill: 270, solid_infill: 250, top_surface: 200, first_layer: 50, travel: 500, acceleration: 5000 },
  support: { enable: false, type: 'tree(auto)', style: 'tree_slim', threshold_angle: 30 },
  others: { brim_type: 'auto', brim_width: 5, skirt_loops: 0, elephant_foot_compensation: 0.0 },
}

const filamentItem = {
  id: 'filament-1',
  name: 'Test PLA',
  user_id: 'user-1',
  print_profile_id: 'profile-1',
  basic_settings: { filament_type: 'PLA', vendor: 'Overture', color: '#ff0000', metal_stickiness: 'None', diameter: 1.75, flow_ratio: 0.98, density: 1.22, shrinkage: 100, velocity_adaptation: 1, price: 24.52, softening_temp: 45, prime_vol_filament_change: 45, prime_vol_hotend_change: 45, ramming_len_extruder_change: 4.5, ramming_len_hotend_change: 4.5, travel_time_ramming_extruder: 0, travel_time_ramming_hotend: 0, precool_temp_extruder: 0, precool_temp_hotend: 0, idle_temp: 0 },
  temp_settings: { nozzle_temp_min: 190, nozzle_temp_max: 230, cool_plate_super_initial: 35, cool_plate_super_other: 35, cool_plate_initial: 35, cool_plate_other: 35, eng_plate_initial: 55, eng_plate_other: 55, smooth_pei_initial: 55, smooth_pei_other: 55, textured_pei_initial: 55, textured_pei_other: 55, first_layer_nozzle: 220, other_layers_nozzle: 220, vitrification_temp: 60 },
  cooling_settings: {
    close_fan_first_x_layers: 1, initial_fan_speed: 0, full_fan_speed_layer: 0,
    min_fan_speed: 60, min_fan_speed_layer_time: 80, max_fan_speed: 80, max_fan_speed_layer_time: 6,
    fan_always_on: true, slow_down_for_cooling: true, dont_slow_down_outer_walls: false,
    slow_print_speed: 20, force_cooling_for_overhangs: true,
    overhang_cooling_threshold: 50, overhang_participating_threshold: 100, overhang_fan_speed: 100,
    pre_start_fan_time: 2, ironing_fan_speed: -1,
    aux_close_fan_first_x_layers: 1, aux_initial_fan_speed: 0, aux_full_fan_speed_layer: 0, aux_fan_speed: 70,
  },
  override_settings: {
    adaptive_volumetric_speed: true, max_volumetric_speed: 12, ramming_vol_extruder_change: 12, ramming_vol_hotend_change: 12,
    retraction_length: 0.8, z_hop: 0.4, z_hop_type: 'Normal Lift', retraction_speed: 30, deretraction_speed: 30,
    retract_restart_extra: 0, retract_before_travel: 2, retract_on_layer_change: false, wipe_while_retracting: false,
    wipe_distance: 1.0, retract_before_wipe: 100, long_retraction_when_cut: true, retraction_distance_when_cut: 18,
    override_overhang_speed: false, pressure_advance: 0.02,
  },
  scarf_seam: { scarf_seam_type: 'none', scarf_start_height: 10, scarf_slope_gap: 0, scarf_length: 5 },
  notes: '',
  start_gcode: '',
  end_gcode: '',
}

const PRINTER_MODELS = ['A1 Mini', 'A1', 'P1P', 'P1S', 'X1', 'X1 Carbon', 'X1E']

// --- Helpers ---

const mountProfile = (overrides = {}) =>
  mount(EditorModal, {
    props: { item: profileItem, type: 'profile', isOwner: true, loading: false, profiles: [], printerModels: PRINTER_MODELS, ...overrides },
  })

const mountFilament = (overrides = {}) =>
  mount(EditorModal, {
    props: { item: filamentItem, type: 'filament', isOwner: true, loading: false, profiles: [], printerModels: PRINTER_MODELS, ...overrides },
  })

// --- Profile editor ---

describe('EditorModal — profile type', () => {
  it('renders the name input', () => {
    const wrapper = mountProfile()
    expect(wrapper.find('input[placeholder="Enter Name..."]').exists()).toBe(true)
  })

  it('shows the target printer model as the selected option in a dropdown', () => {
    const wrapper = mountProfile()
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(select.element.value).toBe('A1 Mini')
  })

  it('disables the target printer dropdown when isOwner is false', () => {
    const wrapper = mountProfile({ isOwner: false })
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('disables the target printer dropdown when editing an existing profile, even as owner', () => {
    const wrapper = mountProfile() // profileItem already has an id
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('leaves the target printer dropdown enabled when creating a new profile', () => {
    const wrapper = mountProfile({ item: { ...profileItem, id: undefined } })
    expect(wrapper.find('select').attributes('disabled')).toBeUndefined()
  })

  it('changing the target printer resets speed settings to that model\'s defaults (new profile only)', async () => {
    const wrapper = mountProfile({ item: { ...profileItem, id: undefined } })
    const select = wrapper.find('select')
    await select.setValue('X1 Carbon')

    const speedTab = wrapper.findAll('button').find(b => b.text().trim() === 'Speed')
    await speedTab.trigger('click')
    const accelInput = wrapper.findAll('input[type="number"]').find((input) => {
      const label = input.element.closest('.group')?.querySelector('label')?.textContent
      return label?.includes('Normal printing')
    })
    expect(accelInput.element.value).toBe('10000')
  })

  it('shows all 5 profile tabs', () => {
    const wrapper = mountProfile()
    ;['Quality', 'Strength', 'Speed', 'Support', 'Others'].forEach(label => {
      expect(wrapper.text()).toContain(label)
    })
  })

  it('shows Save button when isOwner is true', () => {
    const wrapper = mountProfile()
    expect(wrapper.text()).toContain('Save Changes')
  })

  it('hides Save button when isOwner is false', () => {
    const wrapper = mountProfile({ isOwner: false })
    expect(wrapper.text()).not.toContain('Save Changes')
  })

  it('shows Read Only badge when isOwner is false', () => {
    const wrapper = mountProfile({ isOwner: false })
    expect(wrapper.text()).toContain('Read Only')
  })

  it('disables name input when isOwner is false', () => {
    const wrapper = mountProfile({ isOwner: false })
    const input = wrapper.find('input[placeholder="Enter Name..."]')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('emits "close" when Cancel is clicked (non-owner, no confirm needed)', async () => {
    const wrapper = mountProfile({ isOwner: false })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits "save" with the current item when Save Changes is clicked', async () => {
    const wrapper = mountProfile()
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toMatchObject({ name: 'Test Profile' })
  })

  it('deep-clones item — editing the name does not mutate the original prop', async () => {
    const originalName = profileItem.name
    const wrapper = mountProfile()
    await wrapper.find('input[placeholder="Enter Name..."]').setValue('Modified')
    expect(profileItem.name).toBe(originalName)
  })

  it('switching to Speed tab shows speed-specific fields', async () => {
    const wrapper = mountProfile()
    const speedTab = wrapper.findAll('button').find(b => b.text().trim() === 'Speed')
    await speedTab.trigger('click')
    expect(wrapper.text()).toContain('Outer wall')
    expect(wrapper.text()).toContain('Initial layer speed')
    expect(wrapper.text()).toContain('Overhang speed (50% overhang)')
    expect(wrapper.text()).toContain('Acceleration')
  })

  it('switching to Strength tab shows strength-specific fields', async () => {
    const wrapper = mountProfile()
    const strengthTab = wrapper.findAll('button').find(b => b.text().trim() === 'Strength')
    await strengthTab.trigger('click')
    expect(wrapper.text()).toContain('Wall loops')
    expect(wrapper.text()).toContain('Top/bottom shells')
    expect(wrapper.text()).toContain('Length of sparse infill anchor')
  })

  it('switching to Quality tab shows the new section headings', async () => {
    const wrapper = mountProfile()
    expect(wrapper.text()).toContain('Line width')
    expect(wrapper.text()).toContain('Precision')
    expect(wrapper.text()).toContain('Elephant foot compensation')
  })

  it('switching to Support tab shows the new section headings', async () => {
    const wrapper = mountProfile()
    const supportTab = wrapper.findAll('button').find(b => b.text().trim() === 'Support')
    await supportTab.trigger('click')
    expect(wrapper.text()).toContain('Filament for Supports')
    expect(wrapper.text()).toContain('Independent support layer height')
  })

  it('switching to Others tab shows the new section headings and Notes/Post-processing textareas', async () => {
    const wrapper = mountProfile()
    const othersTab = wrapper.findAll('button').find(b => b.text().trim() === 'Others')
    await othersTab.trigger('click')
    expect(wrapper.text()).toContain('Prime tower')
    expect(wrapper.text()).toContain('Special mode')
    expect(wrapper.text()).toContain('Post-processing scripts')
    expect(wrapper.findAll('textarea').length).toBe(2)
  })
})

describe('EditorModal — unsaved changes guard', () => {
  it('asks for confirmation before closing when the owner has unsaved changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mountProfile()
    await wrapper.find('input[placeholder="Enter Name..."]').setValue('Changed Name')
    const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy() // user declined the confirm
    confirmSpy.mockRestore()
  })

  it('closes without prompting when there are no unsaved changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    const wrapper = mountProfile()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeTruthy()
    confirmSpy.mockRestore()
  })
})

// --- Filament editor ---

describe('EditorModal — filament type', () => {
  it('renders the filament name input', () => {
    const wrapper = mountFilament()
    expect(wrapper.find('input[placeholder="Enter Name..."]').exists()).toBe(false) // custom UI uses its own input
    // The filament editor has an input in the toolbar dropdown-container
    expect(wrapper.find('.dropdown-container input').exists()).toBe(true)
  })

  it('renders the desktop-app window chrome', () => {
    const wrapper = mountFilament()
    expect(wrapper.find('.window').exists()).toBe(true)
    expect(wrapper.find('.title-bar').exists()).toBe(true)
    expect(wrapper.find('.toolbar').exists()).toBe(true)
  })

  it('shows all filament tabs', () => {
    const wrapper = mountFilament()
    ;['Filament', 'Cooling', 'Setting Overrides', 'Advanced', 'Notes', 'Multi Filament'].forEach(label => {
      expect(wrapper.text()).toContain(label)
    })
  })

  it('emits "save" when the footer Save Changes button is clicked', async () => {
    const wrapper = mountFilament()
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('emits "close" when the header close button is clicked', async () => {
    const wrapper = mountFilament()
    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('hides the Save Changes button when isOwner is false', () => {
    const wrapper = mountFilament({ isOwner: false })
    expect(wrapper.findAll('button').find(b => b.text().includes('Save Changes'))).toBeUndefined()
  })

  it('Filament tab (default) shows basic information section', () => {
    const wrapper = mountFilament()
    expect(wrapper.text()).toContain('Basic information')
  })

  it('Filament tab shows all Basic information fields from the Bambu Studio reference layout', () => {
    const wrapper = mountFilament()
    const text = wrapper.text()
    ;[
      'Metal stickiness', 'Velocity Adaptation Factor', 'Price', 'Softening temperature',
      'Filament prime volume', 'Filament ramming length', 'Travel time after ramming',
      'Precooling target temperature', 'Idle temperature',
    ].forEach(label => expect(text).toContain(label))
  })

  it('Filament tab shows all print temperature plate rows', () => {
    const wrapper = mountFilament()
    const text = wrapper.text()
    ;['Cool Plate SuperTack', 'Cool Plate', 'Engineering Plate', 'Smooth PEI Plate / High Temp Plate', 'Textured PEI Plate', 'Vitrification temperature'].forEach(label => {
      expect(text).toContain(label)
    })
  })

  it('Filament tab shows Ramming volumetric speed alongside Max volumetric speed', () => {
    const wrapper = mountFilament()
    expect(wrapper.text()).toContain('Ramming volumetric speed')
  })

  it('Filament tab shows Scarf start height and Scarf slope gap', () => {
    const wrapper = mountFilament()
    const text = wrapper.text()
    expect(text).toContain('Scarf start height')
    expect(text).toContain('Scarf slope gap')
  })

  it('lets the owner change Metal stickiness, and the change is included on save', async () => {
    const wrapper = mountFilament()
    const selects = wrapper.findAll('select.content-select')
    const metalSelect = selects.find(s => s.findAll('option').some(o => o.text() === 'Medium'))
    expect(metalSelect).not.toBeUndefined()
    await metalSelect.setValue('Medium')

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')[0][0].basic_settings.metal_stickiness).toBe('Medium')
  })

  it('disables Metal stickiness when isOwner is false', () => {
    const wrapper = mountFilament({ isOwner: false })
    const selects = wrapper.findAll('select.content-select')
    const metalSelect = selects.find(s => s.findAll('option').some(o => o.text() === 'Medium'))
    expect(metalSelect.attributes('disabled')).toBeDefined()
  })

  it('Cooling tab shows part and auxiliary fan sections with threshold fields', async () => {
    const wrapper = mountFilament()
    const coolingTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Cooling')
    await coolingTab.trigger('click')
    expect(wrapper.text()).toContain('Part Cooling Fan')
    expect(wrapper.text()).toContain('Auxiliary Part Cooling Fan')
    expect(wrapper.text()).toContain('Initial layer fan')
    expect(wrapper.text()).toContain('Linear ramp up')
    expect(wrapper.text()).toContain('Min fan speed threshold')
    expect(wrapper.text()).toContain('Max fan speed threshold')
    expect(wrapper.text()).toContain('Slow down for better layer cooling')
    expect(wrapper.text()).toContain("Don't slow down outer walls")
    expect(wrapper.text()).toContain('Cooling overhang threshold')
    expect(wrapper.text()).toContain('Ironing fan speed')
  })

  it('editing a Cooling tab field updates the underlying model and is saved', async () => {
    const wrapper = mountFilament()
    const coolingTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Cooling')
    await coolingTab.trigger('click')

    const overhangInput = wrapper.findAll('.row').find(r => r.text().includes('Cooling overhang threshold')).find('input[type="number"]')
    await overhangInput.setValue(75)

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')[0][0].cooling_settings.overhang_cooling_threshold).toBe(75)
  })

  it('Setting Overrides tab shows retraction, speed, and pressure advance fields', async () => {
    const wrapper = mountFilament()
    const overrideTab = wrapper.findAll('.tab').find(t => t.text().includes('Setting Overrides'))
    await overrideTab.trigger('click')
    expect(wrapper.text()).toContain('Retraction')
    expect(wrapper.text()).toContain('Z Hop Type')
    expect(wrapper.text()).toContain('Retraction Speed')
    expect(wrapper.text()).toContain('Deretraction Speed')
    expect(wrapper.text()).toContain('Extra length on restart')
    expect(wrapper.text()).toContain('Travel distance threshold')
    expect(wrapper.text()).toContain('Retract when change layer')
    expect(wrapper.text()).toContain('Wipe while retracting')
    expect(wrapper.text()).toContain('Retract amount before wipe')
    expect(wrapper.text()).toContain('Long retraction when cut (experimental)')
    expect(wrapper.text()).toContain('Retraction distance when cut')
    expect(wrapper.text()).toContain('Override overhang speed')
    expect(wrapper.text()).toContain('Pressure Advance')
  })

  it('editing the Z Hop Type select on Setting Overrides updates the model and is saved', async () => {
    const wrapper = mountFilament()
    const overrideTab = wrapper.findAll('.tab').find(t => t.text().includes('Setting Overrides'))
    await overrideTab.trigger('click')

    const zHopSelect = wrapper.findAll('.row').find(r => r.text().includes('Z Hop Type')).find('select')
    await zHopSelect.setValue('Spiral Lift')

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')[0][0].override_settings.z_hop_type).toBe('Spiral Lift')
  })

  it('Notes tab shows a textarea', async () => {
    const wrapper = mountFilament()
    const notesTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Notes')
    await notesTab.trigger('click')
    expect(wrapper.find('textarea.notes-area').exists()).toBe(true)
  })

  it('lets the owner link the filament to a print profile via the header selector', async () => {
    const profiles = [{ id: 'profile-1', name: 'My Profile' }, { id: 'profile-2', name: 'Other Profile' }]
    const wrapper = mountFilament({ profiles })
    const linkSelect = wrapper.find('select')
    expect(linkSelect.exists()).toBe(true)
    await linkSelect.setValue('profile-2')
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')[0][0]).toMatchObject({ print_profile_id: 'profile-2' })
  })

  it('Advanced tab shows Filament start/end G-code textareas', async () => {
    const wrapper = mountFilament()
    const advancedTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Advanced')
    await advancedTab.trigger('click')
    expect(wrapper.text()).toContain('Filament start G-code')
    expect(wrapper.text()).toContain('Filament end G-code')
    expect(wrapper.findAll('textarea').length).toBe(2)
  })

  it('editing G-code on the Advanced tab updates the model and is saved', async () => {
    const wrapper = mountFilament()
    const advancedTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Advanced')
    await advancedTab.trigger('click')

    const textareas = wrapper.findAll('textarea')
    await textareas[0].setValue('M104 S200')
    await textareas[1].setValue('M104 S0')

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save')[0][0].start_gcode).toBe('M104 S200')
    expect(wrapper.emitted('save')[0][0].end_gcode).toBe('M104 S0')
  })

  it('blocks saving when no print profile is linked, and warns the user', async () => {
    const alertSpy = vi.spyOn(window, 'alert')
    const wrapper = mountFilament({ item: { ...filamentItem, print_profile_id: null } })
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('select a print profile'))
    expect(wrapper.emitted('save')).toBeFalsy()
    alertSpy.mockRestore()
  })
})

describe('EditorModal — clone', () => {
  it('shows a Clone button for an existing profile when the viewer can clone', () => {
    const wrapper = mountProfile({ canClone: true })
    expect(wrapper.findAll('button').find(b => b.text().trim() === 'Clone')).not.toBeUndefined()
  })

  it('hides the Clone button when the viewer cannot clone (signed out)', () => {
    const wrapper = mountProfile({ canClone: false })
    expect(wrapper.findAll('button').find(b => b.text().trim() === 'Clone')).toBeUndefined()
  })

  it('hides the Clone button for a not-yet-saved (new) profile', () => {
    const wrapper = mountProfile({ canClone: true, item: { ...profileItem, id: undefined } })
    expect(wrapper.findAll('button').find(b => b.text().trim() === 'Clone')).toBeUndefined()
  })

  it('emits "clone" with the current profile data when Clone is clicked', async () => {
    const wrapper = mountProfile({ canClone: true })
    const cloneBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Clone')
    await cloneBtn.trigger('click')
    expect(wrapper.emitted('clone')).toBeTruthy()
    expect(wrapper.emitted('clone')[0][0]).toMatchObject({ id: 'profile-1', name: 'Test Profile' })
  })

  it('emits "clone" with the current filament data when Clone is clicked', async () => {
    const wrapper = mountFilament({ canClone: true })
    const cloneBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Clone')
    await cloneBtn.trigger('click')
    expect(wrapper.emitted('clone')).toBeTruthy()
    expect(wrapper.emitted('clone')[0][0]).toMatchObject({ id: 'filament-1', name: 'Test PLA' })
  })
})
