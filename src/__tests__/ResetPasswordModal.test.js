import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResetPasswordModal from '@/components/ResetPasswordModal.vue'

describe('ResetPasswordModal', () => {
  it('does not render when isOpen is false', () => {
    const wrapper = mount(ResetPasswordModal, { props: { isOpen: false } })
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
  })

  it('renders new-password and confirm-password fields when isOpen is true', () => {
    const wrapper = mount(ResetPasswordModal, { props: { isOpen: true } })
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2)
  })

  it('emits "submit" with the new password when both fields match', async () => {
    const wrapper = mount(ResetPasswordModal, { props: { isOpen: true } })
    const [password, confirm] = wrapper.findAll('input[type="password"]')
    await password.setValue('newpassword123')
    await confirm.setValue('newpassword123')
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({ password: 'newpassword123' })
  })

  it('does not emit "submit" when passwords do not match', async () => {
    const wrapper = mount(ResetPasswordModal, { props: { isOpen: true } })
    const [password, confirm] = wrapper.findAll('input[type="password"]')
    await password.setValue('newpassword123')
    await confirm.setValue('somethingelse')
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('does not emit "submit" when the password is too short', async () => {
    const wrapper = mount(ResetPasswordModal, { props: { isOpen: true } })
    const [password, confirm] = wrapper.findAll('input[type="password"]')
    await password.setValue('abc')
    await confirm.setValue('abc')
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('shows a mismatch warning when passwords differ', async () => {
    const wrapper = mount(ResetPasswordModal, { props: { isOpen: true } })
    const [password, confirm] = wrapper.findAll('input[type="password"]')
    await password.setValue('newpassword123')
    await confirm.setValue('different')
    expect(wrapper.text()).toContain('Passwords do not match')
  })
})
