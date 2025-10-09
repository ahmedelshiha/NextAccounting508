import { render, fireEvent } from '@/test-mocks/testing-library-react'
import { describe, it, expect } from 'vitest'
import SettingsShell from '@/components/admin/settings/SettingsShell'

describe('SettingsShell', () => {
  it('renders tabs and switches active on click', () => {
    const tabs = [{ key: 'one', label: 'One' }, { key: 'two', label: 'Two' }]
    let active = 'one'
    const onChange = (k:string)=> { active = k }
    const { getByText } = render(
      <SettingsShell title="Test" tabs={tabs} activeTab={active} onChangeTab={onChange}>
        <div>content</div>
      </SettingsShell>
    )

    const btnTwo = getByText('Two')
    fireEvent.click(btnTwo)
    expect(active).toBe('two')
  })
})
