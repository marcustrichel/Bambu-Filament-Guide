import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserGuideView from '@/components/UserGuideView.vue'

describe('UserGuideView', () => {
  it('renders the markdown user guide as HTML with a real heading structure', () => {
    const wrapper = mount(UserGuideView)
    // marked should have turned "# BambuDB User Guide" into an actual <h1>,
    // not left it as literal "#" text.
    const h1 = wrapper.find('.prose h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('BambuDB User Guide')
  })

  it('renders section headings from the guide as h2 elements', () => {
    const wrapper = mount(UserGuideView)
    const headings = wrapper.findAll('.prose h2').map(h => h.text())
    expect(headings).toContain('Print Profiles')
    expect(headings).toContain('Filaments')
    expect(headings).toContain('Printers')
  })

  it('does not leave raw markdown syntax (#, **, etc.) in the rendered text', () => {
    const wrapper = mount(UserGuideView)
    const text = wrapper.find('.prose').text()
    expect(text).not.toContain('# BambuDB')
    expect(text).not.toMatch(/\*\*\w/)
  })
})
