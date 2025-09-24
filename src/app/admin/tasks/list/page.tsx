"use client"

import PageHeader from '@/components/dashboard/PageHeader'
import TasksList from '@/components/dashboard/lists/TasksList'

export default function TasksListPage() {
  return (
    <div className="px-6 py-4">
      <PageHeader title="Tasks" subtitle="Review, update status, and export tasks" />
      <TasksList />
    </div>
  )
}
