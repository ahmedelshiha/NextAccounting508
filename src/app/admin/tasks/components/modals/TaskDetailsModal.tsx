'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, FileText, Calendar, Users, User, Clock, AlertTriangle, Tag as TagIcon, Building, Link2, CheckCircle2 } from 'lucide-react'
import CommentsPanel from '../comments/CommentsPanel'
import TaskWatchers from '../widgets/TaskWatchers'
import TaskReminders from '../widgets/TaskReminders'
import TaskDependencies from '../widgets/TaskDependencies'
import type { TaskPriority, TaskStatus, TaskCategory } from '@/lib/tasks/types'

interface Props {
  open: boolean
  onClose: () => void
  task?: any
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
}
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }

const priorityBadges: Record<TaskPriority, string> = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
}

const statusBadges: Record<TaskStatus, string> = {
  pending: 'text-gray-700 bg-gray-100 border-gray-200',
  in_progress: 'text-blue-700 bg-blue-100 border-blue-200',
  review: 'text-purple-700 bg-purple-100 border-purple-200',
  completed: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  blocked: 'text-red-700 bg-red-100 border-red-200',
}

export default function TaskDetailsModal({ open, onClose, task }: Props) {
  if (!open) return null
  const title: string = task?.title || 'Task details'
  const description: string = task?.description || ''
  const priority: TaskPriority = (task?.priority || 'medium') as TaskPriority
  const status: TaskStatus = (task?.status || 'pending') as TaskStatus
  const category: TaskCategory = (task?.category || 'system') as TaskCategory
  const dueDate: string | undefined = task?.dueDate

  const metaItem = (icon: React.ReactNode, label: string, value?: React.ReactNode) => (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white">
      <div className="p-2 rounded-lg bg-gray-50 text-gray-600">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value ?? '—'}</div>
      </div>
    </div>
  )

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose} />

          <motion.div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" variants={modalVariants} initial="hidden" animate="visible" exit="exit">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/10 rounded-lg"><FileText className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Task Details</h2>
                    <p className="text-blue-100 text-sm line-clamp-1">{title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border bg-white/20 text-white border-white/30`}>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border bg-white/20 text-white border-white/30`}>{status.replace('_',' ')}</span>
                  <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {/* Summary badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${priorityBadges[priority]}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</span>
                {status === 'completed' && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Completed</span>
                )}
                {Array.isArray(task?.tags) && task.tags.length > 0 && task.tags.slice(0, 3).map((t: string) => (
                  <span key={t} className="px-3 py-1 text-xs font-medium rounded-full border text-blue-700 bg-blue-50 border-blue-200 inline-flex items-center gap-1"><TagIcon className="w-3.5 h-3.5" />{t}</span>
                ))}
              </div>

              {/* Description */}
              {description && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold"><FileText className="w-4 h-4" /><span>Description</span></div>
                  <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-4">{description}</div>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {metaItem(<Calendar className="w-4 h-4" />, 'Due Date', dueDate ? new Date(dueDate).toLocaleString() : '—')}
                {metaItem(<User className="w-4 h-4" />, 'Assignee', task?.assignee?.name ?? task?.assigneeId ?? 'Unassigned')}
                {metaItem(<AlertTriangle className="w-4 h-4" />, 'Status', status.replace('_',' '))}
                {metaItem(<Clock className="w-4 h-4" />, 'Estimated Hours', (typeof task?.estimatedHours !== 'undefined' ? task.estimatedHours : '—'))}
              </div>

              {/* Business context */}
              {(task?.clientId || task?.bookingId) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {metaItem(<Building className="w-4 h-4" />, 'Client', task?.client?.name || task?.clientId)}
                  {metaItem(<Link2 className="w-4 h-4" />, 'Booking', task?.booking ? `${task.booking.service || 'Service'} — ${task.booking.scheduledDate || ''}` : task?.bookingId)}
                </div>
              )}

              {/* Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Users className="w-4 h-4" /><span>Watchers</span></div>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"><TaskWatchers watchers={task?.watchers || []} /></div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /><span>Reminders</span></div>
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100"><TaskReminders reminders={task?.reminders || []} /></div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Link2 className="w-4 h-4" /><span>Dependencies</span></div>
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"><TaskDependencies dependencies={task?.dependencies || []} /></div>
                </div>
              </div>

              {/* Comments */}
              {!!task?.id && (
                <div className="mt-4">
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><MessageBubble />
                    <span>Comments</span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <CommentsPanel taskId={task.id} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <motion.button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">Close</motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function MessageBubble() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-700"><path d="M18 10c0 3.866-3.582 7-8 7-.898 0-1.76-.12-2.563-.343-.392-.11-.81.024-1.06.343L4.5 18.5a1 1 0 01-1.707-.707v-1.379c0-.298-.133-.58-.36-.773C1.545 14.58 1 12.855 1 11c0-3.866 3.582-7 8-7s9 3.134 9 6z"/></svg>
  )
}
