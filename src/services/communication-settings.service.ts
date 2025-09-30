import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { logAudit } from '@/lib/audit'
import {
  CommunicationSettingsSchema,
  type CommunicationSettings,
} from '@/schemas/settings/communication'
import type { z } from 'zod'

const cache = new CacheService()
const patchSchema = CommunicationSettingsSchema.deepPartial()

type CommunicationSettingsPatch = z.infer<typeof patchSchema>

function cacheKeyFor(tenantId: string | null) {
  return `communication-settings:${tenantId ?? 'default'}`
}

function defaults(): CommunicationSettings {
  return CommunicationSettingsSchema.parse({})
}

function mergeSettings(current: CommunicationSettings, patch: CommunicationSettingsPatch): CommunicationSettings {
  const mergedEmail = patch.email
    ? {
        ...current.email,
        ...patch.email,
        templates: patch.email.templates ?? current.email.templates,
      }
    : current.email

  const mergedSms = patch.sms
    ? {
        ...current.sms,
        ...patch.sms,
        routes: patch.sms.routes ?? current.sms.routes,
      }
    : current.sms

  const mergedChat = patch.chat ? { ...current.chat, ...patch.chat, escalationEmails: patch.chat.escalationEmails ?? current.chat.escalationEmails } : current.chat

  const mergedNotifications = patch.notifications
    ? {
        ...current.notifications,
        ...patch.notifications,
        preferences: patch.notifications.preferences ?? current.notifications.preferences,
      }
    : current.notifications

  const mergedNewsletters = patch.newsletters
    ? {
        ...current.newsletters,
        ...patch.newsletters,
        topics: patch.newsletters.topics ?? current.newsletters.topics,
      }
    : current.newsletters

  const mergedReminders = patch.reminders
    ? {
        bookings: patch.reminders.bookings
          ? {
              ...current.reminders.bookings,
              ...patch.reminders.bookings,
              channels: patch.reminders.bookings.channels ?? current.reminders.bookings.channels,
            }
          : current.reminders.bookings,
        invoices: patch.reminders.invoices
          ? {
              ...current.reminders.invoices,
              ...patch.reminders.invoices,
              channels: patch.reminders.invoices.channels ?? current.reminders.invoices.channels,
            }
          : current.reminders.invoices,
        tasks: patch.reminders.tasks
          ? {
              ...current.reminders.tasks,
              ...patch.reminders.tasks,
              channels: patch.reminders.tasks.channels ?? current.reminders.tasks.channels,
            }
          : current.reminders.tasks,
      }
    : current.reminders

  return CommunicationSettingsSchema.parse({
    email: mergedEmail,
    sms: mergedSms,
    chat: mergedChat,
    notifications: mergedNotifications,
    newsletters: mergedNewsletters,
    reminders: mergedReminders,
  })
}

export class CommunicationSettingsService {
  async get(tenantId: string | null): Promise<CommunicationSettings> {
    const key = cacheKeyFor(tenantId)
    const cached = await cache.get<CommunicationSettings>(key)
    if (cached) return cached

    const anyPrisma = prisma as any
    const row = await anyPrisma.communicationSettings
      ?.findFirst?.({ where: { tenantId: tenantId ?? undefined } })
      .catch?.(() => null)

    const value = row
      ? CommunicationSettingsSchema.parse({
          email: row.email ?? {},
          sms: row.sms ?? {},
          chat: row.chat ?? {},
          notifications: row.notifications ?? {},
          newsletters: row.newsletters ?? {},
          reminders: row.reminders ?? {},
        })
      : defaults()

    await cache.set(key, value, 300)
    return value
  }

  async upsert(tenantId: string | null, updates: CommunicationSettingsPatch): Promise<CommunicationSettings> {
    const parsed = patchSchema.parse(updates ?? {})
    const anyPrisma = prisma as any

    let existing = await anyPrisma.communicationSettings
      ?.findFirst?.({ where: { tenantId: tenantId ?? undefined } })
      .catch?.(() => null)

    if (!existing) {
      const base = defaults()
      existing = await anyPrisma.communicationSettings
        ?.create?.({
          data: {
            tenantId: tenantId ?? null,
            email: base.email,
            sms: base.sms,
            chat: base.chat,
            notifications: base.notifications,
            newsletters: base.newsletters,
            reminders: base.reminders,
          },
        })
        .catch?.(() => null)
    }

    const current = existing ? await this.get(tenantId) : defaults()
    const merged = mergeSettings(current, parsed)

    if (existing) {
      await anyPrisma.communicationSettings
        ?.update?.({
          where: { id: existing.id },
          data: {
            tenantId: tenantId ?? null,
            email: merged.email,
            sms: merged.sms,
            chat: merged.chat,
            notifications: merged.notifications,
            newsletters: merged.newsletters,
            reminders: merged.reminders,
            updatedAt: new Date(),
          },
        })
        .catch?.(() => null)
    }

    await cache.delete(cacheKeyFor(tenantId))
    const updated = await this.get(tenantId)
    try {
      await logAudit({
        action: 'communication-settings:update',
        details: { tenantId, sections: Object.keys(parsed) },
      })
    } catch (error) {
      console.warn('Failed to log communication settings audit event', error)
    }
    return updated
  }
}

const communicationSettingsService = new CommunicationSettingsService()
export default communicationSettingsService
