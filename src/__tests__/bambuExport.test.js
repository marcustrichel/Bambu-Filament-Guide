import { describe, it, expect } from 'vitest'
import { buildPrintProfileExport, buildFilamentExport, sanitizeFilename } from '@/lib/bambuExport'
import { profileSchema, filamentSchema } from '@/constants/schemas'

function defaultsFor(schemaTabs, tabs) {
  const out = {}
  tabs.forEach(tab => {
    out[tab] = {}
    schemaTabs[tab].forEach(f => {
      if (f.key) out[tab][f.key] = f.default
      if (f.fields) f.fields.forEach(sub => { out[tab][sub.key] = sub.default })
    })
  })
  return out
}

const PROFILE_TABS = ['quality', 'strength', 'speed', 'support', 'others']
const FILAMENT_TABS = ['basic_settings', 'temp_settings', 'cooling_settings', 'override_settings', 'scarf_seam']

function makeDefaultProfile(overrides = {}) {
  const defaults = defaultsFor(profileSchema, PROFILE_TABS)
  return {
    name: 'Test Profile',
    printer_model: 'A1 Mini',
    ...defaults,
    ...overrides,
  }
}

function makeDefaultFilament(overrides = {}) {
  const defaults = defaultsFor(filamentSchema, FILAMENT_TABS)
  return {
    name: 'Test Filament',
    notes: '',
    start_gcode: '',
    end_gcode: '',
    ...defaults,
    ...overrides,
  }
}

describe('sanitizeFilename', () => {
  it('strips filesystem-unsafe characters', () => {
    expect(sanitizeFilename('My/Cool: Profile?.json')).toBe('My_Cool_ Profile_.json')
  })

  it('falls back to a default for empty names', () => {
    expect(sanitizeFilename('')).toBe('profile')
    expect(sanitizeFilename(undefined)).toBe('profile')
  })
})

describe('buildPrintProfileExport', () => {
  it('emits the required Bambu Studio preset envelope fields', () => {
    const out = buildPrintProfileExport(makeDefaultProfile())
    expect(out.type).toBe('process')
    expect(out.from).toBe('User')
    expect(out.inherits).toBe('fdm_process_common')
    expect(out.instantiation).toBe('true')
    expect(out.name).toBe('Test Profile')
  })

  it('sets compatible_printers from the printer model', () => {
    const out = buildPrintProfileExport(makeDefaultProfile({ printer_model: 'X1 Carbon' }))
    expect(out.compatible_printers).toEqual(['Bambu Lab X1 Carbon 0.4 nozzle'])
  })

  it('omits fields left at BambuDB defaults, relying on inherited Bambu Studio defaults', () => {
    const out = buildPrintProfileExport(makeDefaultProfile())
    // layer_height is untouched (still 0.2, the schema default) — should not appear
    expect(out.layer_height).toBeUndefined()
  })

  it('emits fields that differ from the default, using the real Bambu Studio key', () => {
    const profile = makeDefaultProfile()
    profile.quality = { ...profile.quality, layer_height: 0.28, elephant_foot_compensation: 0.2 }
    const out = buildPrintProfileExport(profile)
    expect(out.layer_height).toBe('0.28')
    expect(out.elefant_foot_compensation).toBe('0.2')
  })

  it('wraps speed-tab values in per-extruder arrays but leaves other tabs as plain strings', () => {
    const profile = makeDefaultProfile()
    profile.speed = { ...profile.speed, outer_wall: 180 }
    profile.strength = { ...profile.strength, wall_loops: 3 }
    const out = buildPrintProfileExport(profile)
    expect(out.outer_wall_speed).toEqual(['180'])
    expect(out.wall_loops).toBe('3')
  })

  it('converts booleans to Bambu Studio\'s "0"/"1" string convention', () => {
    const profile = makeDefaultProfile()
    profile.support = { ...profile.support, enable: true }
    const out = buildPrintProfileExport(profile)
    expect(out.enable_support).toBe('1')
  })

  it('appends a "%" suffix for percent-based fields', () => {
    const profile = makeDefaultProfile()
    profile.strength = { ...profile.strength, sparse_infill_density: 30 }
    const out = buildPrintProfileExport(profile)
    expect(out.sparse_infill_density).toBe('30%')
  })
})

describe('buildFilamentExport', () => {
  it('emits the required Bambu Studio preset envelope fields', () => {
    const out = buildFilamentExport(makeDefaultFilament())
    expect(out.type).toBe('filament')
    expect(out.from).toBe('User')
    expect(out.inherits).toBe('fdm_filament_common')
    expect(out.instantiation).toBe('true')
    expect(out.filament_settings_id).toEqual(['Test Filament'])
  })

  it('exports every mapped field, even when it matches the schema default (no diffing for filaments)', () => {
    const out = buildFilamentExport(makeDefaultFilament())
    expect(out.nozzle_temperature).toEqual(['220'])
    expect(out.filament_type).toEqual(['PLA'])
  })

  it('reflects the actually stored value, not the schema default', () => {
    const filament = makeDefaultFilament()
    filament.temp_settings = { ...filament.temp_settings, other_layers_nozzle: 260, first_layer_nozzle: 265 }
    filament.basic_settings = { ...filament.basic_settings, filament_type: 'ABS' }
    const out = buildFilamentExport(filament)
    expect(out.nozzle_temperature).toEqual(['260'])
    expect(out.nozzle_temperature_initial_layer).toEqual(['265'])
    expect(out.filament_type).toEqual(['ABS'])
  })

  it('turns on enable_pressure_advance whenever a pressure_advance value is exported', () => {
    const filament = makeDefaultFilament()
    filament.override_settings = { ...filament.override_settings, pressure_advance: 0.03 }
    const out = buildFilamentExport(filament)
    expect(out.pressure_advance).toEqual(['0.03'])
    expect(out.enable_pressure_advance).toEqual(['1'])
  })

  it('includes gcode and notes only when present', () => {
    const withGcode = buildFilamentExport(makeDefaultFilament({ start_gcode: 'G28', end_gcode: 'M104 S0', notes: 'hi' }))
    expect(withGcode.filament_start_gcode).toEqual(['G28'])
    expect(withGcode.filament_end_gcode).toEqual(['M104 S0'])
    expect(withGcode.filament_notes).toEqual(['hi'])

    const without = buildFilamentExport(makeDefaultFilament())
    expect(without.filament_start_gcode).toBeUndefined()
    expect(without.filament_end_gcode).toBeUndefined()
    expect(without.filament_notes).toBeUndefined()
  })
})
