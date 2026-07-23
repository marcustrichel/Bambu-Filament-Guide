import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserEditModal from '@/components/UserEditModal.vue'

const standardUser = () => ({
  id: 'user-1',
  email: 'standard@example.com',
  full_name: 'Stan Dard',
  phone: '555-0100',
  role: 'standard',
  disabled: false,
})

describe('UserEditModal', () => {
  it('does not render when targetUser is null', () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: null, myRole: 'admin', loading: false } })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders the target user\'s current details', () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'admin', loading: false } })
    expect(wrapper.text()).toContain('standard@example.com')
    expect(wrapper.find('#user-full-name').element.value).toBe('Stan Dard')
    expect(wrapper.find('#user-phone').element.value).toBe('555-0100')
  })

  it('disables the role select for elevated callers, with an explanatory note', () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'elevated', loading: false } })
    expect(wrapper.find('#user-role').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain("Only admins can change a user's role")
  })

  it('enables the role select for admin callers', () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'admin', loading: false } })
    expect(wrapper.find('#user-role').attributes('disabled')).toBeUndefined()
  })

  it('emits "save" with full_name, phone, role, and disabled', async () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'admin', loading: false } })
    await wrapper.find('#user-full-name').setValue('New Name')
    await wrapper.find('#user-disabled').setValue(true)
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual({
      id: 'user-1', full_name: 'New Name', phone: '555-0100', role: 'standard', disabled: true,
    })
  })

  it('reveals an email field and emits "change-email" with the new address', async () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'admin', loading: false } })
    const changeEmailBtn = wrapper.findAll('button').find(b => b.text().includes('Change Email'))
    await changeEmailBtn.trigger('click')
    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.exists()).toBe(true)
    await emailInput.setValue('new@example.com')
    const updateBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Update')
    await updateBtn.trigger('click')
    expect(wrapper.emitted('change-email')).toBeTruthy()
    expect(wrapper.emitted('change-email')[0][0]).toEqual({ targetUserId: 'user-1', newEmail: 'new@example.com' })
  })

  it('emits "send-password-reset" with the user\'s email', async () => {
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'admin', loading: false } })
    const resetBtn = wrapper.findAll('button').find(b => b.text().includes('Send Password Reset Email'))
    await resetBtn.trigger('click')
    expect(wrapper.emitted('send-password-reset')).toBeTruthy()
    expect(wrapper.emitted('send-password-reset')[0][0]).toEqual({ email: 'standard@example.com' })
  })

  it('asks for confirmation before closing with unsaved changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(UserEditModal, { props: { targetUser: standardUser(), myRole: 'admin', loading: false } })
    await wrapper.find('#user-full-name').setValue('Changed')
    const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
    confirmSpy.mockRestore()
  })
})
