import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrinterModal from '@/components/PrinterModal.vue'

const baseProfiles = [
  { id: 'profile-1', name: '0.20mm Standard @A1Mini', printer_model: 'A1 Mini' },
  { id: 'profile-2', name: '0.20mm Standard @X1C', printer_model: 'X1 Carbon' },
]

const newPrinter = () => ({
  user_id: 'user-1',
  name: 'New Printer',
  model: 'A1 Mini',
  nozzle_diameter: 0.4,
  bed_size_x: 180,
  bed_size_y: 180,
  default_print_profile_id: null,
})

describe('PrinterModal', () => {
  it('does not render when printer is null', () => {
    const wrapper = mount(PrinterModal, { props: { printer: null, profiles: baseProfiles, loading: false } })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders name, model, nozzle, and bed size fields when a printer is given', () => {
    const wrapper = mount(PrinterModal, { props: { printer: newPrinter(), profiles: baseProfiles, loading: false } })
    expect(wrapper.text()).toContain('New Printer')
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(3)
  })

  it('lists available print profiles in the default-profile select, including printer model', () => {
    const wrapper = mount(PrinterModal, { props: { printer: newPrinter(), profiles: baseProfiles, loading: false } })
    expect(wrapper.text()).toContain('0.20mm Standard @A1Mini (A1 Mini)')
    expect(wrapper.text()).toContain('0.20mm Standard @X1C (X1 Carbon)')
  })

  it('emits "save" with the edited printer, including a changed default profile', async () => {
    const wrapper = mount(PrinterModal, { props: { printer: newPrinter(), profiles: baseProfiles, loading: false } })
    const selects = wrapper.findAll('select')
    const defaultProfileSelect = selects[1] // [0] = model, [1] = default profile
    await defaultProfileSelect.setValue('profile-2')
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toMatchObject({ default_print_profile_id: 'profile-2' })
  })

  it('emits "close" when Cancel is clicked without changes', async () => {
    const wrapper = mount(PrinterModal, { props: { printer: newPrinter(), profiles: baseProfiles, loading: false } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
