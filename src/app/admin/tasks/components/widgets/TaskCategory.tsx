import React from 'react'
import { DollarSign, AlertTriangle, User, Settings, TrendingUp, Calendar, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TaskCategory as TaskCategoryType } from '@/lib/tasks/types'

interface TaskCategoryProps { category: TaskCategoryType; variant?: 'badge' | 'icon' | 'full' }

export const TaskCategory: React.FC<TaskCategoryProps> = ({ category, variant = 'badge' }) => {
  const icons = { finance: DollarSign, compliance: AlertTriangle, client: User, system: Settings, marketing: TrendingUp, booking: Calendar }
  const Icon = (icons as any)[category] || FileText
  if (variant === 'icon') return (<div className="p-1 rounded bg-gray-100"><Icon className="h-4 w-4 text-gray-600" /></div>)
  if (variant === 'full') return (<div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"><Icon className="h-3 w-3" /><span className="capitalize">{category}</span></div>)
  return (<Badge variant="secondary" className="text-xs capitalize">{category}</Badge>)
}
