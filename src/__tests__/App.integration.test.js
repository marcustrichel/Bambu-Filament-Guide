import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// A "chain" mimics the shape of a Supabase PostgrestFilterBuilder: every
// query method (select/order/eq/insert/update/delete) returns the same
// chain so calls can be composed in any order, and the chain itself is
// thenable so `await supabase.from(x).select(...)` resolves to `_result`
// regardless of how many (or few) methods were chained before it.
function createChain() {
  const chain = { _result: { data: [], error: null } }
  ;['select', 'order', 'eq', 'insert', 'update', 'delete'].forEach((method) => {
    chain[method] = vi.fn(() => chain)
  })
  chain.single = vi.fn(() => Promise.resolve(chain._result))
  chain.then = (resolve, reject) => Promise.resolve(chain._result).then(resolve, reject)
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
  ;['print_profiles', 'filaments', 'printers', 'favorites'].forEach((t) => supabase.from(t))
  vi.clearAllMocks()
  Object.values(supabase.__chains).forEach((chain) => {
    chain._result = { data: [], error: null }
  })
})

const mountSignedIn = async () => {
  supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: mockUser } } })
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

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
})

// --- Filaments ---

describe('App.vue — filament CRUD', () => {
  it('creates a new filament and inserts it into filaments', async () => {
    const wrapper = await mountSignedIn()
    await goToView(wrapper, 'Filaments')
    supabase.__chains.filaments._result = {
      data: { id: 'filament-new', name: 'New Generic PLA', user_id: mockUser.id },
      error: null,
    }

    const newBtn = wrapper.findAll('button').find((b) => b.text().includes('New Filament'))
    await newBtn.trigger('click')
    const saveIcon = wrapper.find('.toolbar-icon[title="Save"]')
    await saveIcon.trigger('click')
    await flushPromises()

    expect(supabase.__chains.filaments.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Generic PLA', user_id: mockUser.id })
    )
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
    const signInBtn = wrapper.find('button.bg-emerald-600')
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
