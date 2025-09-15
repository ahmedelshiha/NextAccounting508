import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function mapStatusToUi(status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | string) {
  const v = String(status || '').toUpperCase()
  if (v === 'DONE') return 'Completed'
  if (v === 'IN_PROGRESS') return 'In Progress'
  return 'Not Started'
}

function mapPriorityToUi(priority: 'LOW' | 'MEDIUM' | 'HIGH' | string) {
  const v = String(priority || '').toUpperCase()
  if (v === 'HIGH') return 'High'
  if (v === 'LOW') return 'Low'
  return 'Medium'
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const timeframeDays = Number(url.searchParams.get('timeframe') || '30')

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const timeframeStart = new Date()
    timeframeStart.setDate(timeframeStart.getDate() - timeframeDays)

    const nextWeekEnd = new Date()
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7)

    // Preload tasks we'll need to compute metrics efficiently
    const tasks = await prisma.task.findMany({
      where: { createdAt: { gte: timeframeStart } },
      orderBy: { updatedAt: 'desc' },
      take: 500, // cap for performance; adjust as needed
    })

    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'DONE').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const notStarted = tasks.filter(t => t.status === 'OPEN').length

    const overdue = tasks.filter(t => t.dueAt && t.status !== 'DONE' && t.dueAt < now).length
    const dueToday = tasks.filter(t => t.dueAt && t.status !== 'DONE' && t.dueAt >= todayStart && t.dueAt <= todayEnd).length
    const dueSoon = tasks.filter(t => t.dueAt && t.status !== 'DONE' && t.dueAt > todayEnd && t.dueAt <= nextWeekEnd).length

    const byPriority: Record<string, number> = { Low: 0, Medium: 0, High: 0 }
    for (const t of tasks) {
      const p = mapPriorityToUi(t.priority as any)
      byPriority[p] = (byPriority[p] || 0) + 1
    }

    const byAssignee: Record<string, number> = {}
    for (const t of tasks) {
      if (t.assigneeId) byAssignee[t.assigneeId] = (byAssignee[t.assigneeId] || 0) + 1
    }

    // Average task age (days) for open/in_progress tasks
    const openTasks = tasks.filter(t => t.status !== 'DONE')
    const avgAgeDays = openTasks.length
      ? Math.round(openTasks.reduce((sum, t) => sum + ((now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / openTasks.length)
      : 0

    // On-time completion percentage
    const completedTasks = tasks.filter(t => t.status === 'DONE')
    // We don't store completedAt; approximate using updatedAt
    const onTimeCompleted = completedTasks.filter(t => !t.dueAt || t.updatedAt <= t.dueAt).length
    const onTimeCompletion = completedTasks.length ? Math.round((onTimeCompleted / completedTasks.length) * 100) : 0

    const recentTasks = tasks.slice(0, 10).map(t => ({
      id: t.id,
      title: t.title,
      description: undefined as unknown as string | undefined,
      priority: mapPriorityToUi(t.priority as any) as 'Critical' | 'High' | 'Medium' | 'Low',
      status: mapStatusToUi(t.status as any) as 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'On Hold',
      category: 'General',
      dueDate: t.dueAt ? t.dueAt.toISOString() : '',
      assignee: t.assigneeId ? { id: t.assigneeId, name: '', avatar: undefined } : undefined,
      client: undefined,
      complianceRequired: false,
      completionPercentage: t.status === 'DONE' ? 100 : (t.status === 'IN_PROGRESS' ? 50 : 0),
    }))

    const urgentTasks = tasks.filter(t => (
      (t.priority === 'HIGH') ||
      (t.dueAt && t.dueAt <= nextWeekEnd && t.status !== 'DONE') ||
      (t.dueAt && t.dueAt < now && t.status !== 'DONE')
    )).slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      reason: (t.priority === 'HIGH') ? 'High Priority' : (t.dueAt && t.dueAt < now ? 'Overdue' : 'Due Soon'),
      dueDate: t.dueAt ? t.dueAt.toISOString() : '',
      client: undefined,
    }))

    return NextResponse.json({
      total,
      overdue,
      dueToday,
      dueSoon,
      completed,
      inProgress,
      notStarted,
      byPriority,
      byAssignee,
      averageCompletionTime: 0,
      productivity: 0,
      performance: {
        onTimeCompletion,
        averageTaskAge: avgAgeDays,
      },
      recentTasks,
      urgentTasks,
    })
  } catch (err) {
    console.error('GET /api/admin/tasks/statistics error', err)
    return NextResponse.json({ error: 'Failed to compute statistics' }, { status: 500 })
  }
}
