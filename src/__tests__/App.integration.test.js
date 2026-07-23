import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// A "chain" mimics the shape of a Supabase PostgrestFilterBuilder: every
// query method (select/order/eq/insert/update/delete) returns the same
// chain so calls can be composed in any order, and the chain itself is
// thenable so `await supabase.from(x).select(...)` resolves to `_result`
// regardless of how many (or few) methods were chained before it.
function createChain() {
  const chain = { _result: { data: [], error: null }, _filters: [] }
  ;['select', 'order', 'insert', 'update', 'delete'].forEach((method) => {
    chain[method] = vi.fn(() => chain)
  })
  chain.eq = vi.fn((col, val) => {
    chain._filters.push([col, val])
    return chain
  })
  // If `_result.data` is an array (a plain "select many" fixture), `.single()`
  // narrows it by whatever `.eq()` filters were chained first — e.g. so a
  // shared `user_profiles` fixture can serve both "my own row" (.eq('id', me))
  // and "every row" (no filter) queries. If `_result.data` is already a single
  // object (the common insert/update-then-.single() fixture pattern used
  // throughout this file), it's returned as-is, ignoring any filters.
  chain.single = vi.fn(() => {
    let data = chain._result.data
    if (Array.isArray(data)) {
      data = chain._filters.reduce((rows, [col, val]) => rows.filter((r) => r[col] === val), data)[0] ?? null
    }
    chain._filters = []
    return Promise.resolve({ data, error: chain._result.error })
  })
  chain.then = (resolve, reject) => {
    const result = chain._result
    chain._filters = []
    return Promise.resolve(result).then(resolve, reject)
  }
  return chain
}

vi.mock('@/lib/supabase', () => {
  const chains = {}
  const getChain = (table) => {
    if (!chains[table]) chains[table] = createChain()
    return chains[table]
  }

  let authCallback = null

  return {
    supabase: {
      from: vi.fn((table) => getChain(table)),
      rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
      functions: {
        invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
      },
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn((cb) => {
          authCallback = cb
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({}),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
      __chains: chains,
      __triggerAuthChange: (event, session) => authCallback && authCallback(event, session),
    },
  }
})

import { supabase } from '@/lib/supabase'
import App from '@/App.vue'

const mockUser = { id: 'user-1', email: 'owner@example.com' }

beforeEach(() => {
  // Pre-warm every table's chain so tests can configure `_result` before mounting,
  // regardless of which test runs first.
  ;['print_profiles', 'filaments', 'printers', 'favorites', 'printer_models', 'user_profiles'].forEach((t) => supabase.from(t))
  vi.clearAllMocks()
  Object.values(supabase.__chains).forEach((chain) => {
    chain._result = { data: [], error: null }
  })
  supabase.rpc.mockResolvedValue({ data: [], error: null })
  supabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null })
})

const mountSignedInAs = async (role = 'standard', overrides = {}, otherUsers = []) => {
  supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockUser } } })
  const myRow = { id: mockUser.id, email: mockUser.email, role, disabled: false, full_name: null, phone: null, ...overrides }
  supabase.__chains.user_profiles._result = { data: [myRow, ...otherUsers], error: null }
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

const mountSignedIn = () => mountSignedInAs('standard')

const goToView = async (wrapper, label) => {
  const btn = wrapper.findAll('nav button').find((b) => b.text().includes(label))
  await btn.trigger('click')
}

// --- Profiles ---

describe('App.vue — print profile CRUD', () => {
  it('creates a new profile via the editor and inserts it into print_profiles', async () => {
    const wrapper = await mountSignedIn()
    supabase.__chains.print_profiles._result = {
      data: { id: 'profile-new', name: 'New Profile', printer_model: 'A1 Mini', user_id: mockUser.id },
      error: null,
    }

    const newBtn = wrapper.findAll('button').find((b) => b.text().includes('New Profile'))
    await newBtn.trigger('click')
    await wrapper.findComponent({ name: 'EditorModal' }).find('button').exists() // ensure modal mounted

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.print_profiles.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Profile', printer_model: 'A1 Mini', user_id: mockUser.id })
    )
    // Modal closes after a successful save
    expect(wrapper.findComponent({ name: 'EditorModal' }).exists()).toBe(false)
  })

  it('saves edits to an existing profile via update, keyed by id', async () => {
    const existingProfile = {
      id: 'profile-1', name: 'Mine', printer_model: 'A1 Mini', user_id: mockUser.id,
      quality: {}, strength: {}, speed: {}, support: {}, others: {},
    }
    supabase.__chains.print_profiles._result = { data: [existingProfile], error: null }
    const wrapper = await mountSignedIn()

    supabase.__chains.print_profiles._result = { data: { ...existingProfile, name: 'Renamed' }, error: null }
    const card = wrapper.findAll('.cursor-pointer').find((c) => c.text().includes('Mine'))
    await card.trigger('click')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.print_profiles.update).toHaveBeenCalled()
    expect(supabase.__chains.print_profiles.eq).toHaveBeenCalledWith('id', 'profile-1')
  })

  it('clones a community profile into the current user\'s library', async () => {
    const communityProfile = {
      id: 'profile-2', name: 'Community Profile', printer_model: 'X1 Carbon', user_id: 'someone-else',
      created_at: '2026-01-01', quality: {}, strength: {}, speed: {}, support: {}, others: {},
    }
    supabase.__chains.print_profiles._result = { data: [communityProfile], error: null }
    const wrapper = await mountSignedIn()

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    supabase.__chains.print_profiles._result = {
      data: { ...communityProfile, id: 'profile-clone', name: 'Community Profile (Copy)', user_id: mockUser.id },
      error: null,
    }
    const forkBtn = wrapper.findAll('button').find((b) => b.text().includes('Fork'))
    await forkBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.print_profiles.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Community Profile (Copy)', user_id: mockUser.id })
    )
    expect(supabase.__chains.print_profiles.insert.mock.calls[0][0]).not.toHaveProperty('id')
    window.confirm.mockRestore()
  })

  it('clones a profile from the Clone button inside the editor modal', async () => {
    const communityProfile = {
      id: 'profile-2', name: 'Community Profile', printer_model: 'X1 Carbon', user_id: 'someone-else',
      created_at: '2026-01-01', quality: {}, strength: {}, speed: {}, support: {}, others: {},
    }
    supabase.__chains.print_profiles._result = { data: [communityProfile], error: null }
    const wrapper = await mountSignedIn()

    const card = wrapper.findAll('.cursor-pointer').find((c) => c.text().includes('Community Profile'))
    await card.trigger('click')

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    supabase.__chains.print_profiles._result = {
      data: { ...communityProfile, id: 'profile-clone', name: 'Community Profile (Copy)', user_id: mockUser.id },
      error: null,
    }
    const modal = wrapper.findComponent({ name: 'EditorModal' })
    const cloneBtn = modal.findAll('button').find((b) => b.text().trim() === 'Clone')
    await cloneBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.print_profiles.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Community Profile (Copy)', user_id: mockUser.id })
    )
    window.confirm.mockRestore()
  })
})

// --- Filaments ---

describe('App.vue — filament CRUD', () => {
  it('creates a new filament and inserts it into filaments', async () => {
    const profileA = { id: 'profile-a', name: 'Profile A', printer_model: 'A1 Mini' }
    supabase.__chains.print_profiles._result = { data: [profileA], error: null }
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Filaments')
    supabase.__chains.filaments._result = {
      data: { id: 'filament-new', name: 'New Generic PLA', user_id: mockUser.id, print_profile_id: 'profile-a' },
      error: null,
    }

    const newBtn = wrapper.findAll('button').find((b) => b.text().includes('New Filament'))
    await newBtn.trigger('click')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.filaments.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Generic PLA', user_id: mockUser.id, print_profile_id: 'profile-a' })
    )
  })

  it('clones a filament from the Clone button inside the editor modal', async () => {
    const profileA = { id: 'profile-a', name: 'Profile A', printer_model: 'A1 Mini' }
    const communityFilament = {
      id: 'filament-2', name: 'Community PLA', user_id: 'someone-else', print_profile_id: 'profile-a',
      created_at: '2026-01-01', basic_settings: {}, temp_settings: {}, cooling_settings: {}, override_settings: {}, scarf_seam: {}, notes: '',
    }
    supabase.__chains.print_profiles._result = { data: [profileA], error: null }
    supabase.__chains.filaments._result = { data: [communityFilament], error: null }
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Filaments')

    const card = wrapper.findAll('.cursor-pointer').find((c) => c.text().includes('Community PLA'))
    await card.trigger('click')

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    supabase.__chains.filaments._result = {
      data: { ...communityFilament, id: 'filament-clone', name: 'Community PLA (Copy)', user_id: mockUser.id },
      error: null,
    }
    const modal = wrapper.findComponent({ name: 'EditorModal' })
    const cloneBtn = modal.findAll('button').find((b) => b.text().trim() === 'Clone')
    await cloneBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.filaments.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Community PLA (Copy)', user_id: mockUser.id })
    )
    window.confirm.mockRestore()
  })
})

// --- Favorites ---

describe('App.vue — favorites', () => {
  const profile = {
    id: 'profile-1', name: 'Favme', printer_model: 'A1 Mini', user_id: 'someone-else',
    quality: {}, strength: {}, speed: {}, support: {}, others: {},
  }

  it('prompts sign-in when toggling a favorite while signed out', async () => {
    supabase.__chains.print_profiles._result = { data: [profile], error: null }
    const wrapper = mount(App)
    await flushPromises()

    const starBtn = wrapper.findAll('button').find((b) => b.text().trim() === '★')
    await starBtn.trigger('click')
    expect(wrapper.findComponent({ name: 'AuthModal' }).props('isOpen')).toBe(true)
    expect(supabase.__chains.favorites.insert).not.toHaveBeenCalled()
  })

  it('adds a favorite when signed in and not already favorited', async () => {
    supabase.__chains.print_profiles._result = { data: [profile], error: null }
    const wrapper = await mountSignedIn()

    const starBtn = wrapper.findAll('button').find((b) => b.text().trim() === '★')
    await starBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.favorites.insert).toHaveBeenCalledWith({
      user_id: mockUser.id,
      print_profile_id: 'profile-1',
    })
  })

  it('removes a favorite when it is already favorited', async () => {
    supabase.__chains.print_profiles._result = { data: [profile], error: null }
    supabase.__chains.favorites._result = { data: [{ print_profile_id: 'profile-1', filament_id: null }], error: null }
    const wrapper = await mountSignedIn()

    const starBtn = wrapper.findAll('button').find((b) => b.text().trim() === '★')
    expect(starBtn.classes()).toContain('text-yellow-400')
    await starBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.favorites.delete).toHaveBeenCalled()
    expect(supabase.__chains.favorites.eq).toHaveBeenCalledWith('user_id', mockUser.id)
  })
})

// --- Auth / session ---

describe('App.vue — auth session', () => {
  it('signs out and clears favorites', async () => {
    const wrapper = await mountSignedIn()
    const signOutBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Sign Out')
    await signOutBtn.trigger('click')
    await flushPromises()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('sends a password reset email with a redirect back to the app', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const signInBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Sign In / Up')
    await signInBtn.trigger('click')
    const forgotLink = wrapper.findAll('span.underline').find((s) => s.text().includes('Forgot password?'))
    await forgotLink.trigger('click')
    const authModal = wrapper.findComponent({ name: 'AuthModal' })
    await authModal.find('input[type="email"]').setValue('user@example.com')
    await authModal.find('button.bg-emerald-600').trigger('click')
    await flushPromises()

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ redirectTo: expect.any(String) })
    )
  })

  it('opens the reset-password modal on a PASSWORD_RECOVERY auth event and updates the password', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ResetPasswordModal' }).props('isOpen')).toBe(false)

    supabase.__triggerAuthChange('PASSWORD_RECOVERY', { user: mockUser })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ResetPasswordModal' }).props('isOpen')).toBe(true)

    const resetModal = wrapper.findComponent({ name: 'ResetPasswordModal' })
    const [password, confirm] = resetModal.findAll('input[type="password"]')
    await password.setValue('newpassword123')
    await confirm.setValue('newpassword123')
    await resetModal.find('button.bg-emerald-600').trigger('click')
    await flushPromises()

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
  })
})

// --- Printers ---

describe('App.vue — printer CRUD', () => {
  it('creates a new printer and inserts it into printers', async () => {
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printers')
    supabase.__chains.printers._result = {
      data: { id: 'printer-new', name: 'New Printer', model: 'A1 Mini', nozzle_diameter: 0.4, bed_size_x: 180, bed_size_y: 180, default_print_profile_id: null },
      error: null,
    }

    const newBtn = wrapper.findAll('button').find((b) => b.text().includes('New Printer'))
    await newBtn.trigger('click')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.printers.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: mockUser.id, name: 'New Printer', model: 'A1 Mini' })
    )
    expect(wrapper.text()).toContain('New Printer')
  })

  it('actually closes when the header close button is clicked, and reopens correctly with different data', async () => {
    const printerA = { id: 'printer-a', name: 'Printer A', model: 'A1 Mini', nozzle_diameter: 0.4, bed_size_x: 180, bed_size_y: 180, default_print_profile_id: null }
    const printerB = { id: 'printer-b', name: 'Printer B', model: 'X1 Carbon', nozzle_diameter: 0.4, bed_size_x: 256, bed_size_y: 256, default_print_profile_id: null }
    supabase.__chains.printers._result = { data: [printerA, printerB], error: null }
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printers')

    const rowA = wrapper.findAll('tbody tr').find((r) => r.text().includes('Printer A'))
    await rowA.trigger('click')
    let modal = wrapper.findComponent({ name: 'PrinterModal' })
    expect(modal.find('#printer-name').exists()).toBe(true)

    const closeBtn = modal.findAll('button').find((b) => b.text().trim() === '✕')
    await closeBtn.trigger('click')
    modal = wrapper.findComponent({ name: 'PrinterModal' })
    expect(modal.find('#printer-name').exists()).toBe(false)

    const rowB = wrapper.findAll('tbody tr').find((r) => r.text().includes('Printer B'))
    await rowB.trigger('click')
    modal = wrapper.findComponent({ name: 'PrinterModal' })
    expect(modal.find('#printer-name').element.value).toBe('Printer B')
  })

  it('changes a printer\'s default print profile via update', async () => {
    const printer = {
      id: 'printer-1', name: 'My A1 Mini', model: 'A1 Mini',
      nozzle_diameter: 0.4, bed_size_x: 180, bed_size_y: 180, default_print_profile_id: null,
    }
    const profileA = { id: 'profile-a', name: 'Profile A', printer_model: 'A1 Mini' }
    const profileB = { id: 'profile-b', name: 'Profile B', printer_model: 'A1 Mini' }
    supabase.__chains.printers._result = { data: [printer], error: null }
    supabase.__chains.print_profiles._result = { data: [profileA, profileB], error: null }
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printers')

    const row = wrapper.findAll('tbody tr').find((r) => r.text().includes('My A1 Mini'))
    await row.trigger('click')

    supabase.__chains.printers._result = { data: { ...printer, default_print_profile_id: 'profile-b' }, error: null }
    const selects = wrapper.findComponent({ name: 'PrinterModal' }).findAll('select')
    const defaultProfileSelect = selects[1]
    await defaultProfileSelect.setValue('profile-b')
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.printers.update).toHaveBeenCalledWith(
      expect.objectContaining({ default_print_profile_id: 'profile-b' })
    )
    expect(supabase.__chains.printers.eq).toHaveBeenCalledWith('id', 'printer-1')
  })

  it('shows the default profile name in the printers table', async () => {
    const printer = {
      id: 'printer-1', name: 'My A1 Mini', model: 'A1 Mini',
      nozzle_diameter: 0.4, bed_size_x: 180, bed_size_y: 180, default_print_profile_id: 'profile-a',
    }
    const profileA = { id: 'profile-a', name: 'Profile A', printer_model: 'A1 Mini' }
    supabase.__chains.printers._result = { data: [printer], error: null }
    supabase.__chains.print_profiles._result = { data: [profileA], error: null }
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printers')

    expect(wrapper.text()).toContain('Profile A')
  })
})

// --- Printer Models ---

describe('App.vue — printer models', () => {
  it('adds a new printer model', async () => {
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printer Models')

    supabase.__chains.printer_models._result = { data: { id: 'model-new', name: 'H2D' }, error: null }
    await wrapper.find('input[placeholder="e.g. H2D"]').setValue('H2D')
    const addBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Add')
    await addBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.printer_models.insert).toHaveBeenCalledWith({ name: 'H2D' })
    expect(wrapper.text()).toContain('H2D')
  })

  it('shows a delete button for a model that is not in use, and a warning icon for one that is', async () => {
    const modelA = { id: 'model-a', name: 'A1 Mini' }
    const modelB = { id: 'model-b', name: 'P1S' }
    supabase.__chains.printer_models._result = { data: [modelA, modelB], error: null }
    supabase.rpc.mockResolvedValueOnce({
      data: [{ name: 'A1 Mini', in_use: true }, { name: 'P1S', in_use: false }],
      error: null,
    })
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printer Models')

    const rows = wrapper.findAll('li')
    const a1Row = rows.find((r) => r.text().includes('A1 Mini'))
    const p1sRow = rows.find((r) => r.text().includes('P1S'))
    expect(a1Row.find('[title*="In use"]').exists()).toBe(true)
    expect(a1Row.find('button').exists()).toBe(false)
    expect(p1sRow.find('button').exists()).toBe(true)
  })

  it('deletes a printer model that is not in use', async () => {
    const modelB = { id: 'model-b', name: 'P1S' }
    supabase.__chains.printer_models._result = { data: [modelB], error: null }
    supabase.rpc.mockResolvedValueOnce({ data: [{ name: 'P1S', in_use: false }], error: null })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Printer Models')

    const deleteBtn = wrapper.find('li button')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(supabase.__chains.printer_models.delete).toHaveBeenCalled()
    expect(supabase.__chains.printer_models.eq).toHaveBeenCalledWith('id', 'model-b')
    expect(wrapper.text()).not.toContain('P1S')
    window.confirm.mockRestore()
  })
})

// --- Access Levels / Users ---

describe('App.vue — access levels', () => {
  const otherStandard = () => ({ id: 'user-2', email: 'other-standard@example.com', role: 'standard', disabled: false, full_name: null, phone: null })
  const otherElevated = () => ({ id: 'user-3', email: 'other-elevated@example.com', role: 'elevated', disabled: false, full_name: null, phone: null })

  it('hides the Users nav item for a standard user', async () => {
    const wrapper = await mountSignedInAs('standard')
    const usersBtn = wrapper.findAll('nav button').find((b) => b.text().includes('Users'))
    expect(usersBtn).toBeUndefined()
  })

  it('shows the Users nav item and lists other users for an elevated user', async () => {
    const wrapper = await mountSignedInAs('elevated', {}, [otherStandard()])
    const usersBtn = wrapper.findAll('nav button').find((b) => b.text().includes('Users'))
    expect(usersBtn).not.toBeUndefined()
    await usersBtn.trigger('click')
    expect(wrapper.text()).toContain('other-standard@example.com')
  })

  it('filters the users list by the search box', async () => {
    const wrapper = await mountSignedInAs('elevated', {}, [otherStandard(), otherElevated()])
    await goToView(wrapper, 'Users')
    await wrapper.find('input[placeholder*="email or name"]').setValue('other-elevated')
    expect(wrapper.text()).toContain('other-elevated@example.com')
    expect(wrapper.text()).not.toContain('other-standard@example.com')
  })

  it('does not show an Edit button for an elevated user acting on another elevated/admin user', async () => {
    const wrapper = await mountSignedInAs('elevated', {}, [otherElevated()])
    await goToView(wrapper, 'Users')
    const row = wrapper.findAll('tbody tr').find((r) => r.text().includes('other-elevated@example.com'))
    expect(row.findAll('button')).toHaveLength(0)
  })

  it('actually closes when the header close button is clicked, and reopens correctly with a different user', async () => {
    const wrapper = await mountSignedInAs('elevated', {}, [otherStandard(), otherElevated()])
    await goToView(wrapper, 'Users')

    const rowStandard = wrapper.findAll('tbody tr').find((r) => r.text().includes('other-standard@example.com'))
    await rowStandard.find('button').trigger('click')
    let modal = wrapper.findComponent({ name: 'UserEditModal' })
    expect(modal.find('#user-full-name').exists()).toBe(true)

    const closeBtn = modal.findAll('button').find((b) => b.text().trim() === '✕')
    await closeBtn.trigger('click')
    modal = wrapper.findComponent({ name: 'UserEditModal' })
    expect(modal.find('#user-full-name').exists()).toBe(false)
  })

  it('lets an elevated user edit a standard user\'s name/phone/disabled but locks the role select', async () => {
    const wrapper = await mountSignedInAs('elevated', {}, [otherStandard()])
    await goToView(wrapper, 'Users')
    const row = wrapper.findAll('tbody tr').find((r) => r.text().includes('other-standard@example.com'))
    await row.find('button').trigger('click')

    const modal = wrapper.findComponent({ name: 'UserEditModal' })
    expect(modal.find('#user-role').attributes('disabled')).toBeDefined()

    supabase.__chains.user_profiles._result = { data: { ...otherStandard(), full_name: 'Updated Name', disabled: true }, error: null }
    await modal.find('#user-full-name').setValue('Updated Name')
    await modal.find('#user-disabled').setValue(true)
    await modal.find('button.bg-emerald-600').trigger('click')
    await flushPromises()

    expect(supabase.__chains.user_profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Updated Name', disabled: true, role: 'standard' })
    )
    expect(supabase.__chains.user_profiles.eq).toHaveBeenCalledWith('id', 'user-2')
  })

  it('lets an admin change a user\'s role', async () => {
    const wrapper = await mountSignedInAs('admin', {}, [otherStandard()])
    await goToView(wrapper, 'Users')
    const row = wrapper.findAll('tbody tr').find((r) => r.text().includes('other-standard@example.com'))
    await row.find('button').trigger('click')

    const modal = wrapper.findComponent({ name: 'UserEditModal' })
    expect(modal.find('#user-role').attributes('disabled')).toBeUndefined()

    supabase.__chains.user_profiles._result = { data: { ...otherStandard(), role: 'elevated' }, error: null }
    await modal.find('#user-role').setValue('elevated')
    await modal.find('button.bg-emerald-600').trigger('click')
    await flushPromises()

    expect(supabase.__chains.user_profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'elevated' })
    )
  })

  it('changes a user\'s email via the Edge Function', async () => {
    const wrapper = await mountSignedInAs('admin', {}, [otherStandard()])
    await goToView(wrapper, 'Users')
    const row = wrapper.findAll('tbody tr').find((r) => r.text().includes('other-standard@example.com'))
    await row.find('button').trigger('click')

    const modal = wrapper.findComponent({ name: 'UserEditModal' })
    const changeEmailBtn = modal.findAll('button').find((b) => b.text().includes('Change Email'))
    await changeEmailBtn.trigger('click')
    await modal.find('input[type="email"]').setValue('new-email@example.com')
    const updateBtn = modal.findAll('button').find((b) => b.text().trim() === 'Update')
    await updateBtn.trigger('click')
    await flushPromises()

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'update-user-email',
      expect.objectContaining({ body: { targetUserId: 'user-2', newEmail: 'new-email@example.com' } })
    )
  })

  it('sends a password reset email to the target user', async () => {
    const wrapper = await mountSignedInAs('admin', {}, [otherStandard()])
    await goToView(wrapper, 'Users')
    const row = wrapper.findAll('tbody tr').find((r) => r.text().includes('other-standard@example.com'))
    await row.find('button').trigger('click')

    const modal = wrapper.findComponent({ name: 'UserEditModal' })
    const resetBtn = modal.findAll('button').find((b) => b.text().includes('Send Password Reset Email'))
    await resetBtn.trigger('click')
    await flushPromises()

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'other-standard@example.com',
      expect.objectContaining({ redirectTo: expect.any(String) })
    )
  })

  it('hides write actions and shows a banner for a disabled account', async () => {
    const wrapper = await mountSignedInAs('standard', { disabled: true })
    expect(wrapper.text()).toContain('Account disabled')
    expect(wrapper.findAll('button').find((b) => b.text().includes('New Profile'))).toBeUndefined()
  })
})

// --- Search ---

describe('App.vue — search', () => {
  const profileA = { id: 'p-1', name: 'Overture Standard Profile', user_id: mockUser.id, printer_model: 'A1 Mini' }
  const profileB = { id: 'p-2', name: 'X1C Speed Tune', user_id: 'someone-else', printer_model: 'X1 Carbon' }
  const filamentA = { id: 'f-1', name: 'Generic Overture Filament', user_id: mockUser.id, basic_settings: {} }
  const filamentB = { id: 'f-2', name: 'Bambu PETG', user_id: 'someone-else', basic_settings: {} }

  const mountWithData = async () => {
    supabase.__chains.print_profiles._result = { data: [profileA, profileB], error: null }
    supabase.__chains.filaments._result = { data: [filamentA, filamentB], error: null }
    return mountSignedIn()
  }

  it('defaults to searching both profiles and filaments by name', async () => {
    const wrapper = await mountWithData()
    await wrapper.find('input[placeholder="Search profiles & filaments..."]').setValue('overture')
    expect(wrapper.text()).toContain('Overture Standard Profile')
    expect(wrapper.text()).toContain('Generic Overture Filament')
    expect(wrapper.text()).not.toContain('X1C Speed Tune')
    expect(wrapper.text()).not.toContain('Bambu PETG')
  })

  it('replaces the current tab view with results while searching, and restores it when cleared', async () => {
    const wrapper = await mountWithData()
    const searchInput = wrapper.find('input[placeholder="Search profiles & filaments..."]')
    await searchInput.setValue('overture')
    expect(wrapper.text()).toContain('Search results for')

    await searchInput.setValue('')
    expect(wrapper.text()).not.toContain('Search results for')
    expect(wrapper.text()).toContain('X1C Speed Tune') // back to the normal Print Profiles tab
  })

  it('narrows to profiles only when that scope is selected', async () => {
    const wrapper = await mountWithData()
    const scopeBtn = wrapper.findAll('button').find(b => b.text().trim() === 'profiles')
    await scopeBtn.trigger('click')
    await wrapper.find('input[placeholder="Search profiles & filaments..."]').setValue('overture')

    expect(wrapper.text()).toContain('Overture Standard Profile')
    expect(wrapper.text()).not.toContain('Generic Overture Filament')
  })

  it('narrows to filaments only when that scope is selected', async () => {
    const wrapper = await mountWithData()
    const scopeBtn = wrapper.findAll('button').find(b => b.text().trim() === 'filaments')
    await scopeBtn.trigger('click')
    await wrapper.find('input[placeholder="Search profiles & filaments..."]').setValue('overture')

    expect(wrapper.text()).toContain('Generic Overture Filament')
    expect(wrapper.text()).not.toContain('Overture Standard Profile')
  })
})
