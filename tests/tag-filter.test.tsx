import { render, screen, fireEvent } from '@testing-library/react'
import TagFilter from '@/app/admin/tasks/tag-filter'

describe('TagFilter', () => {
  it('renders unique tags and toggles selection', () => {
    const tasks = [
      { tags: ['alpha', 'beta'] },
      { tags: ['beta', 'gamma'] },
      { tags: [] },
    ]
    const onChange = vi.fn()
    render(<TagFilter tasks={tasks as any} value={undefined} onChange={onChange} />)

    expect(screen.getByText('All tags')).toBeInTheDocument()
    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
    expect(screen.getByText('gamma')).toBeInTheDocument()

    fireEvent.click(screen.getByText('alpha'))
    expect(onChange).toHaveBeenCalledWith('alpha')

    fireEvent.click(screen.getByText('All tags'))
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})
