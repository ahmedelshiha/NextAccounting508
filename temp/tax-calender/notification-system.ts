// lib/notifications.ts - Notification service
import nodemailer from 'nodemailer';
import { query } from './db';

interface NotificationPayload {
  type: string;
  teamId?: string;
  eventId?: string;
  userId?: string;
  title: string;
  message: string;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendNotification(payload: NotificationPayload): Promise<string> {
    try {
      // Store notification in database
      const result = await query(`
        INSERT INTO notifications (
          user_id, team_id, event_id, type, title, message, 
          scheduled_for, metadata, delivery_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        payload.userId || null,
        payload.teamId || null,
        payload.eventId || null,
        payload.type,
        payload.title,
        payload.message,
        payload.scheduledFor || new Date(),
        JSON.stringify(payload.metadata || {}),
        payload.scheduledFor && payload.scheduledFor > new Date() ? 'scheduled' : 'pending'
      ]);

      const notificationId = result.rows[0].id;

      // If not scheduled for future, send immediately
      if (!payload.scheduledFor || payload.scheduledFor <= new Date()) {
        await this.processNotification(notificationId);
      }

      return notificationId;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async processNotification(notificationId: string): Promise<void> {
    try {
      // Get notification details with user info
      const notificationResult = await query(`
        SELECT n.*, u.email, u.name, up.notification_settings, up.language
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        LEFT JOIN user_preferences up ON up.user_id = u.id
        WHERE n.id = $1 AND n.delivery_status = 'pending'
      `, [notificationId]);

      if (!notificationResult.rows.length) return;

      const notification = notificationResult.rows[0];
      
      // Check user's notification preferences
      const settings = notification.notification_settings || {};
      if (settings.email === false) {
        await this.markAsSkipped(notificationId, 'User disabled email notifications');
        return;
      }

      // Generate email template based on notification type
      const template = await this.getEmailTemplate(notification);
      
      // Send email
      await this.transporter.sendMail({
        from: `UAE Tax Calendar <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: notification.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Mark as sent
      await query(
        'UPDATE notifications SET delivery_status = $1, sent_at = $2 WHERE id = $3',
        ['sent', new Date(), notificationId]
      );

      console.log(`Notification sent successfully: ${notificationId}`);
    } catch (error) {
      console.error(`Failed to process notification ${notificationId}:`, error);
      
      // Mark as failed and increment failure count
      await query(`
        UPDATE notifications 
        SET delivery_status = 'failed', 
            metadata = jsonb_set(
              COALESCE(metadata, '{}'), 
              '{error}', 
              $1::jsonb
            )
        WHERE id = $2
      `, [JSON.stringify(error.message), notificationId]);
    }
  }

  private async markAsSkipped(notificationId: string, reason: string): Promise<void> {
    await query(`
      UPDATE notifications 
      SET delivery_status = 'skipped',
          metadata = jsonb_set(COALESCE(metadata, '{}'), '{skip_reason}', $1::jsonb)
      WHERE id = $2
    `, [JSON.stringify(reason), notificationId]);
  }

  private async getEmailTemplate(notification: any): Promise<EmailTemplate> {
    const language = notification.language || 'en';
    
    const templates = {
      reminder: {
        en: {
          subject: `Reminder: ${notification.title}`,
          html: this.generateReminderHTML(notification, 'en'),
          text: this.generateReminderText(notification, 'en')
        },
        ar: {
          subject: `تذكير: ${notification.title}`,
          html: this.generateReminderHTML(notification, 'ar'),
          text: this.generateReminderText(notification, 'ar')
        }
      },
      event_created: {
        en: {
          subject: `New Event: ${notification.title}`,
          html: this.generateEventHTML(notification, 'created', 'en'),
          text: this.generateEventText(notification, 'created', 'en')
        }
      },
      event_updated: {
        en: {
          subject: `Event Updated: ${notification.title}`,
          html: this.generateEventHTML(notification, 'updated', 'en'),
          text: this.generateEventText(notification, 'updated', 'en')
        }
      },
      team_invite: {
        en: {
          subject: `You're invited to join a tax compliance team`,
          html: this.generateInviteHTML(notification, 'en'),
          text: this.generateInviteText(notification, 'en')
        }
      }
    };

    const template = templates[notification.type]?.[language] || templates[notification.type]?.['en'];
    
    if (!template) {
      return {
        subject: notification.title,
        html: `<p>${notification.message}</p>`,
        text: notification.message
      };
    }

    return template;
  }

  private generateReminderHTML(notification: any, language: string): string {
    const isArabic = language === 'ar';
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" ${isArabic ? 'dir="rtl"' : ''}>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">
            ${isArabic ? 'تقويم الضرائب الإماراتي' : 'UAE Tax Calendar'}
          </h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">
            ${isArabic ? 'تذكير بموعد مهم' : 'Important Deadline Reminder'}
          </p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px; color: #1e40af; font-size: 20px;">
              ${notification.title}
            </h2>
            <p style="margin: 0; color: #64748b; font-size: 16px;">
              ${notification.message}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${notification.event_id}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${isArabic ? 'عرض التفاصيل' : 'View Details'}
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p>
              ${isArabic ? 
                'إذا لم تعد ترغب في تلقي هذه التذكيرات، يمكنك إلغاء الاشتراك من إعدادات حسابك.' : 
                'If you no longer wish to receive these reminders, you can unsubscribe in your account settings.'
              }
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private generateReminderText(notification: any, language: string): string {
    const isArabic = language === 'ar';
    return `
${isArabic ? 'تقويم الضرائب الإماراتي' : 'UAE Tax Calendar'}
${isArabic ? 'تذكير بموعد مهم' : 'Important Deadline Reminder'}

${notification.title}

${notification.message}

${isArabic ? 'عرض التفاصيل:' : 'View Details:'} ${process.env.NEXT_PUBLIC_APP_URL}/events/${notification.event_id}

${isArabic ? 
  'إذا لم تعد ترغب في تلقي هذه التذكيرات، يمكنك إلغاء الاشتراك من إعدادات حسابك.' : 
  'If you no longer wish to receive these reminders, you can unsubscribe in your account settings.'
}
    `.trim();
  }

  private generateEventHTML(notification: any, action: string, language: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">UAE Tax Calendar</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">
            Event ${action === 'created' ? 'Created' : 'Updated'}
          </p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e40af; margin: 0 0 15px;">${notification.title}</h2>
          <p style="color: #64748b; margin: 0 0 20px; font-size: 16px;">${notification.message}</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${notification.event_id}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Event Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateEventText(notification: any, action: string, language: string): string {
    return `
UAE Tax Calendar - Event ${action === 'created' ? 'Created' : 'Updated'}

${notification.title}

${notification.message}

View Details: ${process.env.NEXT_PUBLIC_APP_URL}/events/${notification.event_id}
    `.trim();
  }

  private generateInviteHTML(notification: any, language: string): string {
    const metadata = notification.metadata || {};
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">UAE Tax Calendar</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Team Invitation</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #059669; margin: 0 0 15px;">You're Invited!</h2>
          <p style="color: #374151; margin: 0 0 20px; font-size: 16px;">
            You've been invited to join <strong>${metadata.teamName || 'a team'}</strong> 
            on UAE Tax Calendar to collaborate on tax compliance management.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #374151;">What you'll get:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
              <li>Access to shared tax calendars</li>
              <li>Real-time notifications for deadlines</li>
              <li>Collaborative event management</li>
              <li>AI-powered tax guidance</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/team/accept?token=${metadata.inviteToken}" 
               style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This invitation will expire in 7 days. If you don't want to join, simply ignore this email.</p>
          </div>
        </div>
      </div>
    `;
  }

  private generateInviteText(notification: any, language: string): string {
    const metadata = notification.metadata || {};
    return `
UAE Tax Calendar - Team Invitation

You're Invited!

You've been invited to join ${metadata.teamName || 'a team'} on UAE Tax Calendar to collaborate on tax compliance management.

What you'll get:
- Access to shared tax calendars
- Real-time notifications for deadlines  
- Collaborative event management
- AI-powered tax guidance

Accept your invitation: ${process.env.NEXT_PUBLIC_APP_URL}/team/accept?token=${metadata.inviteToken}

This invitation will expire in 7 days. If you don't want to join, simply ignore this email.
    `.trim();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper function for API routes
export async function sendNotification(payload: NotificationPayload): Promise<string> {
  return notificationService.sendNotification(payload);
}

// workers/notification-worker.ts - Background worker for processing notifications
import { query } from '../lib/db';
import { notificationService } from '../lib/notifications';

class NotificationWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting notification worker...');
    
    // Process notifications every minute
    this.intervalId = setInterval(async () => {
      await this.processScheduledNotifications();
      await this.retryFailedNotifications();
    }, 60000);

    // Initial run
    await this.processScheduledNotifications();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Notification worker stopped');
  }

  private async processScheduledNotifications(): Promise<void> {
    try {
      // Get pending notifications that are due
      const result = await query(`
        SELECT id FROM notifications 
        WHERE delivery_status IN ('pending', 'scheduled') 
        AND (scheduled_for IS NULL OR scheduled_for <= now())
        ORDER BY created_at ASC
        LIMIT 50
      `);

      for (const row of result.rows) {
        await notificationService.processNotification(row.id);
        // Small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (result.rows.length > 0) {
        console.log(`Processed ${result.rows.length} notifications`);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  private async retryFailedNotifications(): Promise<void> {
    try {
      // Retry failed notifications (max 3 retries)
      const result = await query(`
        SELECT id FROM notifications 
        WHERE delivery_status = 'failed'
        AND (metadata->>'retry_count')::int < 3
        AND created_at > now() - INTERVAL '24 hours'
        ORDER BY created_at ASC
        LIMIT 10
      `);

      for (const row of result.rows) {
        // Update retry count
        await query(`
          UPDATE notifications 
          SET delivery_status = 'pending',
              metadata = jsonb_set(
                COALESCE(metadata, '{}'), 
                '{retry_count}', 
                (COALESCE(metadata->>'retry_count', '0')::int + 1)::text::jsonb
              )
          WHERE id = $1
        `, [row.id]);

        await notificationService.processNotification(row.id);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (result.rows.length > 0) {
        console.log(`Retried ${result.rows.length} failed notifications`);
      }
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
    }
  }
}

// workers/reminder-scheduler.ts - Background worker for scheduling reminders
import { query } from '../lib/db';
import { sendNotification } from '../lib/notifications';

class ReminderScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting reminder scheduler...');
    
    // Check for events needing reminders every hour
    this.intervalId = setInterval(async () => {
      await this.scheduleUpcomingReminders();
    }, 3600000);

    // Initial run
    await this.scheduleUpcomingReminders();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Reminder scheduler stopped');
  }

  private async scheduleUpcomingReminders(): Promise<void> {
    try {
      console.log('Checking for events needing reminders...');

      // Find events that need reminders scheduled
      const result = await query(`
        SELECT 
          ce.id, ce.title, ce.description, ce.start_date, 
          ce.reminder_settings, ce.team_id, ce.assignee,
          t.name as team_name
        FROM calendar_events ce
        LEFT JOIN teams t ON ce.team_id = t.id
        WHERE ce.published = true
        AND ce.start_date > now()
        AND ce.start_date <= now() + INTERVAL '30 days'
        AND ce.reminder_settings IS NOT NULL
        AND ce.reminder_settings != '{}'::jsonb
      `);

      for (const event of result.rows) {
        await this.scheduleEventReminders(event);
      }

      console.log(`Processed ${result.rows.length} events for reminder scheduling`);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  private async scheduleEventReminders(event: any): Promise<void> {
    const reminderSettings = event.reminder_settings;
    
    if (!reminderSettings || typeof reminderSettings !== 'object') return;

    // Handle different reminder types
    if (reminderSettings.days) {
      await this.scheduleDaysBeforeReminder(event, reminderSettings.days);
    }

    if (reminderSettings.email && reminderSettings.email.enabled) {
      await this.scheduleEmailReminders(event, reminderSettings.email);
    }

    if (reminderSettings.push && reminderSettings.push.enabled) {
      await this.schedulePushReminders(event, reminderSettings.push);
    }
  }

  private async scheduleDaysBeforeReminder(event: any, days: number[]): Promise<void> {
    for (const dayCount of days) {
      const reminderDate = new Date(event.start_date);
      reminderDate.setDate(reminderDate.getDate() - dayCount);

      // Skip if reminder date is in the past
      if (reminderDate <= new Date()) continue;

      // Get users who should receive this reminder
      const users = await this.getEventUsers(event);

      for (const user of users) {
        // Check if reminder already scheduled
        const existing = await query(`
          SELECT id FROM notifications 
          WHERE user_id = $1 AND event_id = $2 AND type = 'reminder'
          AND scheduled_for::date = $3::date
        `, [user.id, event.id, reminderDate.toISOString()]);

        if (existing.rows.length > 0) continue;

        // Schedule the reminder
        await sendNotification({
          type: 'reminder',
          userId: user.id,
          teamId: event.team_id,
          eventId: event.id,
          title: event.title,
          message: `Reminder: ${event.title} is coming up in ${dayCount} ${dayCount === 1 ? 'day' : 'days'}`,
          scheduledFor: reminderDate,
          metadata: {
            daysBeforeEvent: dayCount,
            eventDate: event.start_date
          }
        });
      }
    }
  }

  private async scheduleEmailReminders(event: any, emailSettings: any): Promise<void> {
    // Implementation for custom email reminder scheduling
    // This could include custom templates, specific timing, etc.
  }

  private async schedulePushReminders(event: any, pushSettings: any): Promise<void> {
    // Implementation for push notification reminders
    // This would integrate with a push service like FCM or APNs
  }

  private async getEventUsers(event: any): Promise<any[]> {
    let users = [];

    // Get assigned user
    if (event.assignee) {
      const assignedUser = await query(
        'SELECT id, email, name FROM users WHERE id = $1',
        [event.assignee]
      );
      users = users.concat(assignedUser.rows);
    }

    // Get team members if it's a team event
    if (event.team_id) {
      const teamMembers = await query(`
        SELECT u.id, u.email, u.name, up.notification_settings
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE tm.team_id = $1
      `, [event.team_id]);

      // Filter out users who have disabled notifications
      const filteredMembers = teamMembers.rows.filter(member => {
        const settings = member.notification_settings || {};
        return settings.reminders !== false;
      });

      users = users.concat(filteredMembers);
    }

    // Remove duplicates
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    return uniqueUsers;
  }
}

// Export worker instances
export const notificationWorker = new NotificationWorker();
export const reminderScheduler = new ReminderScheduler();

// Main worker process entry point
if (require.main === module) {
  async function startWorkers() {
    console.log('Starting UAE Tax Calendar workers...');
    
    await notificationWorker.start();
    await reminderScheduler.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down workers...');
      notificationWorker.stop();
      reminderScheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down workers...');
      notificationWorker.stop();
      reminderScheduler.stop();
      process.exit(0);
    });
  }

  startWorkers().catch(console.error);
}