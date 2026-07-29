import { describe, it, expect } from 'vitest'
import { profileSchema, filamentSchema } from '@/constants/schemas'

const VALID_FIELD_TYPES = ['number', 'select', 'boolean', 'text', 'color', 'textarea']
const PROFILE_TABS = ['quality', 'strength', 'speed', 'support', 'others']
const FILAMENT_TABS = ['basic_settings', 'temp_settings', 'cooling_settings', 'override_settings', 'scarf_seam']

function validateRegularField(field) {
  expect(field.key, `field "${field.label}" missing key`).toBeDefined()
  expect(field.key).toBeTypeOf('string')
  expect(field.label, `field missing label`).toBeDefined()
  expect(VALID_FIELD_TYPES, `field "${field.key}" has invalid type "${field.type}"`).toContain(field.type)
  expect(field.default, `field "${field.key}" missing default`).toBeDefined()
  if (field.type === 'select') {
    expect(Array.isArray(field.options), `field "${field.key}" select missing options`).toBe(true)
    expect(field.options.length).toBeGreaterThan(0)
  }
}

// --- profileSchema ---

describe('profileSchema', () => {
  it('exports all 5 tab keys', () => {
    PROFILE_TABS.forEach(tab => {
      expect(profileSchema[tab], `missing tab: ${tab}`).toBeDefined()
      expect(Array.isArray(profileSchema[tab])).toBe(true)
      expect(profileSchema[tab].length).toBeGreaterThan(0)
    })
  })

  it('heading entries have a label but no key', () => {
    PROFILE_TABS.forEach(tab => {
      profileSchema[tab]
        .filter(f => f.type === 'heading')
        .forEach(h => {
          expect(h.label).toBeDefined()
          expect(h.key).toBeUndefined()
        })
    })
  })

  PROFILE_TABS.forEach(tab => {
    it(`"${tab}" — every non-heading field has key, label, valid type, and default`, () => {
      profileSchema[tab].filter(f => f.type !== 'heading').forEach(field => validateRegularField(field))
    })
  })

  it('select fields have non-empty options arrays', () => {
    PROFILE_TABS.forEach(tab => {
      profileSchema[tab]
        .filter(f => f.type === 'select')
        .forEach(f => {
          expect(Array.isArray(f.options)).toBe(true)
          expect(f.options.length).toBeGreaterThan(0)
        })
    })
  })

  it('boolean fields have boolean defaults', () => {
    PROFILE_TABS.forEach(tab => {
      profileSchema[tab]
        .filter(f => f.type === 'boolean')
        .forEach(f => {
          expect(typeof f.default).toBe('boolean')
        })
    })
  })

  it('number fields have numeric defaults', () => {
    PROFILE_TABS.forEach(tab => {
      profileSchema[tab]
        .filter(f => f.type === 'number')
        .forEach(f => {
          expect(typeof f.default).toBe('number')
        })
    })
  })
})

// --- filamentSchema ---

describe('filamentSchema', () => {
  it('exports all 5 JSONB column keys matching the DB schema', () => {
    FILAMENT_TABS.forEach(tab => {
      expect(filamentSchema[tab], `missing tab: ${tab}`).toBeDefined()
      expect(Array.isArray(filamentSchema[tab])).toBe(true)
    })
  })

  it('heading entries have a label but no key', () => {
    FILAMENT_TABS.forEach(tab => {
      filamentSchema[tab]
        .filter(f => f.type === 'heading')
        .forEach(h => {
          expect(h.label).toBeDefined()
          expect(h.key).toBeUndefined()
        })
    })
  })

  it('group entries have a label and a non-empty fields array', () => {
    FILAMENT_TABS.forEach(tab => {
      filamentSchema[tab]
        .filter(f => f.type === 'group')
        .forEach(group => {
          expect(group.label, 'group missing label').toBeDefined()
          expect(Array.isArray(group.fields), 'group missing fields array').toBe(true)
          expect(group.fields.length).toBeGreaterThan(0)
        })
    })
  })

  it('group sub-fields have key, label, valid type, and default', () => {
    FILAMENT_TABS.forEach(tab => {
      filamentSchema[tab]
        .filter(f => f.type === 'group')
        .forEach(group => {
          group.fields.forEach(subField => validateRegularField(subField))
        })
    })
  })

  it('regular (non-heading, non-group) fields have required structure', () => {
    FILAMENT_TABS.forEach(tab => {
      filamentSchema[tab]
        .filter(f => f.type !== 'heading' && f.type !== 'group')
        .forEach(field => validateRegularField(field))
    })
  })

  it('filamentSchema tab keys match the JSONB columns sent in handleSaveItem', () => {
    // These must stay in sync with the payload built in App.vue handleSaveItem()
    const appPayloadKeys = ['basic_settings', 'temp_settings', 'cooling_settings', 'override_settings', 'scarf_seam']
    appPayloadKeys.forEach(col => {
      expect(filamentSchema[col], `schema missing key for DB column "${col}"`).toBeDefined()
    })
  })
})
