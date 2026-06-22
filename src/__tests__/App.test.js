import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// vi.mock is hoisted above imports by Vitest, so this intercepts the module
// before App.vue ever imports it — import.meta.env is never accessed.
vi.mock('@/lib/supabase', () => {
  const createChain = () => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue({ error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })

  return {
    supabase: {
      from: vi.fn(() => createChain()),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    },
  }
})

import App from '@/App.vue'

describe('App.vue — smoke tests', () => {
  it('renders without crashing', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows Sign In / Up button when not authenticated', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.text()).toContain('Sign In / Up')
  })

  it('shows Print Profiles section by default', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.text()).toContain('Print Profiles')
  })

  it('shows BambuDB branding in the sidebar', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.text()).toContain('BambuDB')
  })

  it('shows Filaments section when Filaments nav is clicked', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const filamentsBtn = wrapper.findAll('button').find(b => b.text().includes('Filaments'))
    await filamentsBtn.trigger('click')
    expect(wrapper.text()).toContain('Filaments')
    const heading = wrapper.find('h2')
    expect(heading.text()).toBe('Filaments')
  })

  it('shows Printers section when Printers nav is clicked', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const printersBtn = wrapper.findAll('button').find(b => b.text().includes('Printers'))
    await printersBtn.trigger('click')
    const heading = wrapper.find('h2')
    expect(heading.text()).toBe('Printers')
  })

  it('does not show New Profile button when not authenticated', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const buttons = wrapper.findAll('button')
    const newProfileBtn = buttons.find(b => b.text().includes('New Profile'))
    expect(newProfileBtn).toBeUndefined()
  })

  it('opens auth modal when Sign In / Up is clicked', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.findComponent({ name: 'AuthModal' }).props('isOpen')).toBe(false)
    const signInBtn = wrapper.find('button.bg-emerald-600')
    await signInBtn.trigger('click')
    expect(wrapper.findComponent({ name: 'AuthModal' }).props('isOpen')).toBe(true)
  })
})
