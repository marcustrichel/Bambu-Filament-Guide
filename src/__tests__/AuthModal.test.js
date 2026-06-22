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
    await wrapper.find('span.underline').trigger('click')
    expect(wrapper.text()).toContain('Create Account')
    const submitBtn = wrapper.find('button.bg-emerald-600')
    expect(submitBtn.text()).toContain('Sign Up')
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
