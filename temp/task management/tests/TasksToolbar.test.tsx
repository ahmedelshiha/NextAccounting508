import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TasksToolbar } from '../components/layout/TasksToolbar'

it('calls search and toggles filters and view mode', () => {
  const onSearchChange = vi.fn()
  const onFiltersToggle = vi.fn()
  const onViewModeChange = vi.fn()
  render(
    <TasksToolbar
      searchQuery=""
      onSearchChange={onSearchChange}
      onFiltersToggle={onFiltersToggle}
      filtersActive={2}
      viewMode="list"
      onViewModeChange={onViewModeChange}
      sortBy="dueDate"
      onSortChange={() => {}}
      showFilters
    />
  )
  fireEvent.change(screen.getByPlaceholderText(/search tasks/i), { target: { value: 'tax' } })
  expect(onSearchChange).toHaveBeenCalled()
  fireEvent.click(screen.getByText('Filters'))
  expect(onFiltersToggle).toHaveBeenCalled()
  fireEvent.click(screen.getByTitle('Board'))
  expect(onViewModeChange).toHaveBeenCalledWith('board')
})
