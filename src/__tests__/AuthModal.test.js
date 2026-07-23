import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthModal from '@/components/AuthModal.vue'

describe('AuthModal', () => {
  it('does not render form when isOpen is false', () => {
    const wrapper = mount(AuthModal, { props: { isOpen: false } })
    expect(wrapper.find('input[type="email"]').exists()).toBe(false)
  })

  it('renders form when isOpen is true', () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('shows Sign In mode by default', () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    expect(wrapper.text()).toContain('Welcome Back')
    const submitBtn = wrapper.find('button.bg-emerald-600')
    expect(submitBtn.text()).toContain('Sign In')
  })

  it('switches to Sign Up mode when the toggle link is clicked', async () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    const toggle = wrapper.findAll('span.underline').find(s => s.text().includes('Need an account?'))
    await toggle.trigger('click')
    expect(wrapper.text()).toContain('Create Account')
    const submitBtn = wrapper.find('button.bg-emerald-600')
    expect(submitBtn.text()).toContain('Sign Up')
  })

  it('switches to Reset Password mode when "Forgot password?" is clicked, hiding the password field', async () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    const forgotLink = wrapper.findAll('span.underline').find(s => s.text().includes('Forgot password?'))
    await forgotLink.trigger('click')
    expect(wrapper.text()).toContain('Reset Password')
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
    const submitBtn = wrapper.find('button.bg-emerald-600')
    expect(submitBtn.text()).toContain('Send Reset Link')
  })

  it('emits "forgot-password" with email when reset form is submitted', async () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    const forgotLink = wrapper.findAll('span.underline').find(s => s.text().includes('Forgot password?'))
    await forgotLink.trigger('click')
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('forgot-password')).toBeTruthy()
    expect(wrapper.emitted('forgot-password')[0][0]).toEqual({ email: 'test@example.com' })
  })

  it('emits "authenticate" with mode, email, password on submit', async () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('authenticate')).toBeTruthy()
    expect(wrapper.emitted('authenticate')[0][0]).toEqual({
      mode: 'signin',
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('does not emit "authenticate" when fields are empty', async () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    await wrapper.find('button.bg-emerald-600').trigger('click')
    expect(wrapper.emitted('authenticate')).toBeFalsy()
  })

  it('emits "close" when Cancel is clicked', async () => {
    const wrapper = mount(AuthModal, { props: { isOpen: true } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().trim() === 'Cancel')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
