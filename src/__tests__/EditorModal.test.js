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
  support: { enable: false, type: 'tree', style: 'tree_slim', threshold_angle: 30 },
  others: { brim_type: 'auto', brim_width: 5, skirt_loops: 0, elephant_foot_compensation: 0.0 },
}

const filamentItem = {
  id: 'filament-1',
  name: 'Test PLA',
  user_id: 'user-1',
  print_profile_id: 'profile-1',
  basic_settings: { filament_type: 'PLA', vendor: 'Overture', color: '#ff0000', diameter: 1.75, flow_ratio: 0.98, density: 1.22, shrinkage: 100, velocity_adaptation: 1, price: 24.52, softening_temp: 45, prime_vol_filament_change: 45, prime_vol_hotend_change: 45, ramming_len_extruder_change: 4.5, ramming_len_hotend_change: 4.5, travel_time_ramming_extruder: 250, travel_time_ramming_hotend: 250, precool_temp_extruder: 140, precool_temp_hotend: 140 },
  temp_settings: { nozzle_temp_min: 190, nozzle_temp_max: 230, cool_plate_super_initial: 35, cool_plate_super_other: 35, cool_plate_initial: 35, cool_plate_other: 35, eng_plate_initial: 55, eng_plate_other: 55, smooth_pei_initial: 55, smooth_pei_other: 55, textured_pei_initial: 55, textured_pei_other: 55, first_layer_nozzle: 220, other_layers_nozzle: 220, vitrification_temp: 60 },
  cooling_settings: { min_fan_speed: 100, max_fan_speed: 100, min_layer_time: 8, fan_always_on: true, aux_fan_speed: 70, no_cooling_for_first_layer: true, slow_down_for_cooling: true, slow_print_speed: 50, force_cooling_for_overhangs: false },
  override_settings: { adaptive_volumetric_speed: true, max_volumetric_speed: 12, ramming_vol_extruder_change: 12, ramming_vol_hotend_change: 12, retraction_length: 0.8, z_hop: 0.4, pressure_advance: 0.02, wipe_distance: 1.0 },
  scarf_seam: { scarf_seam_type: 'none', scarf_start_height: 0, scarf_slope_gap: 10, scarf_length: 5 },
  notes: '',
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
      return label?.includes('Acceleration')
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
    expect(wrapper.text()).toContain('Outer Wall')
  })

  it('switching to Strength tab shows strength-specific fields', async () => {
    const wrapper = mountProfile()
    const strengthTab = wrapper.findAll('button').find(b => b.text().trim() === 'Strength')
    await strengthTab.trigger('click')
    expect(wrapper.text()).toContain('Wall Loops')
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

  it('Cooling tab shows fan and cooling fields', async () => {
    const wrapper = mountFilament()
    const coolingTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Cooling')
    await coolingTab.trigger('click')
    expect(wrapper.text()).toContain('Min Fan Speed')
    expect(wrapper.text()).toContain('Slow Down for Cooling')
  })

  it('Setting Overrides tab shows retraction and pressure advance fields', async () => {
    const wrapper = mountFilament()
    const overrideTab = wrapper.findAll('.tab').find(t => t.text().includes('Setting Overrides'))
    await overrideTab.trigger('click')
    expect(wrapper.text()).toContain('Retraction')
    expect(wrapper.text()).toContain('Pressure Advance')
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

  it('Advanced tab still shows placeholder text', async () => {
    const wrapper = mountFilament()
    const advancedTab = wrapper.findAll('.tab').find(t => t.text().trim() === 'Advanced')
    await advancedTab.trigger('click')
    expect(wrapper.text()).toContain('not yet implemented')
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
