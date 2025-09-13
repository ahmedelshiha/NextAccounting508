// pages/api/events/index.ts - Enhanced Events API with advanced filtering
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { logAudit } from '../../../lib/audit';
import { recordOnChain } from '../../../lib/blockchain';
import { sendNotification } from '../../../lib/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    return getEvents(req, res, userId as string);
  } else if (req.method === 'POST') {
    return createEvent(req, res, userId as string);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getEvents(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { 
    from, 
    to, 
    types, 
    priorities, 
    status, 
    teamId, 
    calendarIds, 
    search,
    limit = '50',
    offset = '0'
  } = req.query;

  let whereConditions = ['ce.published = true'];
  let queryParams: any[] = [];
  let paramIndex = 1;

  // Date range filter
  if (from) {
    whereConditions.push(`ce.start_date >= $${paramIndex}`);
    queryParams.push(from);
    paramIndex++;
  }
  if (to) {
    whereConditions.push(`ce.start_date <= $${paramIndex}`);
    queryParams.push(to);
    paramIndex++;
  }

  // Event types filter
  if (types && typeof types === 'string') {
    const typeArray = types.split(',');
    whereConditions.push(`ce.event_type = ANY($${paramIndex}::text[])`);
    queryParams.push(typeArray);
    paramIndex++;
  }

  // Priority filter
  if (priorities && typeof priorities === 'string') {
    const priorityArray = priorities.split(',');
    whereConditions.push(`ce.priority = ANY($${paramIndex}::text[])`);
    queryParams.push(priorityArray);
    paramIndex++;
  }

  // Status filter
  if (status && typeof status === 'string') {
    const statusArray = status.split(',');
    whereConditions.push(`ce.status = ANY($${paramIndex}::text[])`);
    queryParams.push(statusArray);
    paramIndex++;
  }

  // Team filter
  if (teamId) {
    whereConditions.push(`ce.team_id = $${paramIndex}`);
    queryParams.push(teamId);
    paramIndex++;
  }

  // Calendar IDs filter
  if (calendarIds && typeof calendarIds === 'string') {
    const calendarArray = calendarIds.split(',');
    whereConditions.push(`ce.calendar_id = ANY($${paramIndex}::uuid[])`);
    queryParams.push(calendarArray);
    paramIndex++;
  }

  // Search filter
  if (search) {
    whereConditions.push(`(ce.title ILIKE $${paramIndex} OR ce.description ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  // Add pagination
  queryParams.push(parseInt(limit as string));
  queryParams.push(parseInt(offset as string));

  const sql = `
    SELECT 
      ce.*,
      tc.name as calendar_name,
      tc.color as calendar_color,
      t.name as team_name,
      COUNT(*) OVER() as total_count
    FROM calendar_events ce
    LEFT JOIN team_calendars tc ON ce.calendar_id = tc.id
    LEFT JOIN teams t ON ce.team_id = t.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY ce.start_date ASC
    LIMIT $${paramIndex - 1} OFFSET $${paramIndex}
  `;

  try {
    const result = await query(sql, queryParams);
    const events = result.rows;
    const totalCount = events.length > 0 ? parseInt(events[0].total_count) : 0;

    res.json({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        event_type: event.event_type,
        priority: event.priority,
        status: event.status,
        reminder_settings: event.reminder_settings,
        calendar_id: event.calendar_id,
        calendar_name: event.calendar_name,
        calendar_color: event.calendar_color,
        team_name: event.team_name,
        attachments: event.attachments || [],
        tags: event.tags || [],
        assignee: event.assignee,
        created_at: event.created_at,
        updated_at: event.updated_at
      })),
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createEvent(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const {
    title,
    description,
    start_date,
    end_date,
    event_type,
    priority = 'medium',
    status = 'upcoming',
    reminder_settings,
    calendar_id,
    team_id,
    tags = [],
    assignee,
    attachments = []
  } = req.body;

  // Validate required fields
  if (!title || !start_date || !event_type) {
    return res.status(400).json({ error: 'Title, start_date, and event_type are required' });
  }

  // Check permissions
  if (team_id) {
    const memberCheck = await query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, userId]
    );
    
    if (!memberCheck.rows.length) {
      return res.status(403).json({ error: 'Not a team member' });
    }

    const role = memberCheck.rows[0].role;
    if (!['owner', 'admin', 'editor'].includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create events' });
    }
  }

  try {
    const result = await query(`
      INSERT INTO calendar_events (
        title, description, start_date, end_date, event_type, 
        priority, status, reminder_settings, calendar_id, 
        team_id, tags, assignee, attachments, created_by, published
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `, [
      title, description, start_date, end_date || start_date, event_type,
      priority, status, JSON.stringify(reminder_settings), calendar_id,
      team_id, JSON.stringify(tags), assignee, JSON.stringify(attachments), 
      userId, true // Auto-publish for now, can be changed based on role
    ]);

    const newEvent = result.rows[0];

    // Log audit trail
    await logAudit(userId, 'CREATE_EVENT', team_id, {
      eventId: newEvent.id,
      title,
      event_type
    });

    // Optional blockchain timestamping
    try {
      const hash = await recordOnChain('CREATE_EVENT', {
        actor: userId,
        eventId: newEvent.id,
        timestamp: new Date().toISOString()
      });
      await query(
        'UPDATE calendar_events SET blockchain_hash = $1 WHERE id = $2',
        [hash, newEvent.id]
      );
    } catch (blockchainError) {
      console.warn('Blockchain timestamping failed:', blockchainError);
    }

    // Send notifications to team members if it's a team event
    if (team_id && reminder_settings) {
      await sendNotification({
        type: 'event_created',
        teamId: team_id,
        eventId: newEvent.id,
        title: `New event: ${title}`,
        message: `A new ${event_type} event has been created`,
        scheduledFor: new Date(start_date)
      });
    }

    res.status(201).json({ event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// pages/api/ai/assistant.ts - AI Assistant for tax guidance
export async function aiAssistantHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query: userQuery, context } = req.body;

  if (!userQuery) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // In a real implementation, this would call an AI service like OpenAI
    const response = await processAIQuery(userQuery, context);

    // Log the AI interaction
    await logAudit(userId as string, 'AI_QUERY', null, {
      query: userQuery,
      response: response.summary
    });

    res.json({
      response: response.answer,
      suggestions: response.suggestions,
      relatedEvents: response.relatedEvents,
      confidence: response.confidence
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
}

async function processAIQuery(userQuery: string, context: any) {
  // Mock AI response - in production, integrate with OpenAI, Claude, or similar
  const responses = {
    vat: {
      answer: "UAE VAT returns are due monthly by the 28th of the following month. For businesses with annual turnover below AED 150 million, quarterly filing may be available.",
      suggestions: ["Set up automatic reminders", "Review VAT registration status", "Check for available exemptions"],
      relatedEvents: ["VAT Return Filing", "VAT Payment Due"],
      confidence: 0.95
    },
    corporate: {
      answer: "UAE Corporate Tax applies to businesses with annual revenue exceeding AED 375,000. The standard rate is 9% for profits above this threshold.",
      suggestions: ["Calculate estimated tax liability", "Prepare required documentation", "Consider tax planning strategies"],
      relatedEvents: ["Corporate Tax Return", "Corporate Tax Payment"],
      confidence: 0.92
    },
    excise: {
      answer: "UAE Excise Tax applies to specific goods like tobacco, energy drinks, and carbonated beverages. Rates vary by product category.",
      suggestions: ["Review applicable product categories", "Register if dealing with excise goods", "Monitor rate changes"],
      relatedEvents: ["Excise Tax Registration", "Excise Tax Return"],
      confidence: 0.88
    }
  };

  const queryLower = userQuery.toLowerCase();
  if (queryLower.includes('vat')) return responses.vat;
  if (queryLower.includes('corporate')) return responses.corporate;
  if (queryLower.includes('excise')) return responses.excise;

  return {
    answer: "I can help you with UAE tax compliance questions. Ask me about VAT, Corporate Tax, or Excise Tax requirements.",
    suggestions: ["Ask about VAT filing requirements", "Learn about Corporate Tax rates", "Understand Excise Tax categories"],
    relatedEvents: [],
    confidence: 0.5
  };
}

// Enhanced database schema
const enhancedDatabaseSchema = `
-- Enhanced calendar_events table with new fields
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'upcoming';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS assignee UUID REFERENCES users(id);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS blockchain_hash VARCHAR(255);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_settings JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_priority ON calendar_events(priority);
CREATE INDEX IF NOT EXISTS idx_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_events_team_id ON calendar_events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_assignee ON calendar_events(assignee);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_events_search ON calendar_events 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(delivery_status);

-- AI interactions log
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT,
  confidence DECIMAL(3,2),
  feedback VARCHAR(20), -- 'helpful', 'not_helpful', 'incorrect'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  notification_settings JSONB DEFAULT '{}',
  theme VARCHAR(20) DEFAULT 'light',
  calendar_view VARCHAR(20) DEFAULT 'month',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Webhook integrations
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  secret_key VARCHAR(255),
  events TEXT[] NOT NULL, -- array of event types to subscribe to
  active BOOLEAN DEFAULT true,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced audit logging with more context
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(255);

-- Create stored procedure for automated reminders
CREATE OR REPLACE FUNCTION schedule_event_reminders()
RETURNS void AS $$
DECLARE
  event_record RECORD;
  reminder_date TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR event_record IN 
    SELECT ce.*, u.email, u.notification_preferences
    FROM calendar_events ce
    JOIN users u ON (
      ce.assignee = u.id OR 
      EXISTS(SELECT 1 FROM team_members tm WHERE tm.team_id = ce.team_id AND tm.user_id = u.id)
    )
    WHERE ce.start_date > now() 
    AND ce.reminder_settings IS NOT NULL
    AND ce.published = true
  LOOP
    -- Calculate reminder date based on settings
    IF event_record.reminder_settings->>'days' IS NOT NULL THEN
      reminder_date := event_record.start_date - INTERVAL '1 day' * (event_record.reminder_settings->>'days')::integer;
      
      -- Insert notification if not already scheduled
      INSERT INTO notifications (
        user_id, team_id, event_id, type, title, message, scheduled_for
      )
      SELECT 
        u.id, event_record.team_id, event_record.id, 'reminder', 
        'Upcoming: ' || event_record.title,
        'Don''t forget about ' || event_record.title || ' on ' || event_record.start_date::date,
        reminder_date
      FROM users u
      JOIN team_members tm ON tm.user_id = u.id
      WHERE tm.team_id = event_record.team_id
      AND NOT EXISTS(
        SELECT 1 FROM notifications n 
        WHERE n.user_id = u.id AND n.event_id = event_record.id AND n.type = 'reminder'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create job to run reminder scheduler
-- This would typically be called by a cron job or worker process
-- SELECT schedule_event_reminders();
`;

export default enhancedDatabaseSchema;