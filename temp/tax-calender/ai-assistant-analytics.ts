// components/AIAssistant.tsx - AI-powered tax guidance component
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  relatedEvents?: any[];
  confidence?: number;
}

interface AIAssistantProps {
  teamId?: string;
  eventContext?: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ teamId, eventContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your UAE tax compliance assistant. I can help you understand VAT, Corporate Tax, and Excise Tax requirements. What would you like to know?",
      timestamp: new Date(),
      confidence: 1.0
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user' // Replace with actual user ID
        },
        body: JSON.stringify({
          query: inputMessage,
          context: {
            teamId,
            eventContext,
            previousMessages: messages.slice(-5) // Send last 5 messages for context
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions,
          relatedEvents: data.relatedEvents,
          confidence: data.confidence
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact support if the issue persists.",
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const provideFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user'
        },
        body: JSON.stringify({
          messageId,
          helpful
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium">Tax Assistant</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-white/80 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs opacity-75">Suggestions:</p>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.confidence !== undefined && message.confidence < 0.8 && (
                    <p className="text-xs opacity-75 mt-1">
                      I'm not entirely sure about this answer. Please verify with official sources.
                    </p>
                  )}
                </div>
              </div>

              {message.type === 'assistant' && (
                <div className="flex justify-end gap-1 mt-2">
                  <button
                    onClick={() => provideFeedback(message.id, true)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => provideFeedback(message.id, false)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about UAE tax requirements..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// pages/api/analytics/dashboard.ts - Analytics API
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface AnalyticsQuery {
  teamId?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamId, dateFrom, dateTo } = req.query as AnalyticsQuery;

  try {
    const analytics = await gatherAnalytics({
      teamId: teamId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      userId: userId as string
    });

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function gatherAnalytics(params: AnalyticsQuery & { userId: string }) {
  const { teamId, dateFrom, dateTo, userId } = params;

  // Build dynamic WHERE conditions
  let whereConditions = ['ce.published = true'];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (teamId) {
    whereConditions.push(`ce.team_id = $${paramIndex}`);
    queryParams.push(teamId);
    paramIndex++;
  }

  if (dateFrom) {
    whereConditions.push(`ce.start_date >= $${paramIndex}`);
    queryParams.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereConditions.push(`ce.start_date <= $${paramIndex}`);
    queryParams.push(dateTo);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get comprehensive analytics data
  const [
    eventStats,
    complianceStats,
    eventTypeBreakdown,
    priorityBreakdown,
    statusBreakdown,
    upcomingDeadlines,
    teamActivity,
    monthlyTrends
  ] = await Promise.all([
    getEventStats(whereClause, queryParams),
    getComplianceStats(whereClause, queryParams),
    getEventTypeBreakdown(whereClause, queryParams),
    getPriorityBreakdown(whereClause, queryParams),
    getStatusBreakdown(whereClause, queryParams),
    getUpcomingDeadlines(teamId),
    getTeamActivity(teamId),
    getMonthlyTrends(whereClause, queryParams)
  ]);

  return {
    eventStats,
    complianceStats,
    breakdowns: {
      eventTypes: eventTypeBreakdown,
      priorities: priorityBreakdown,
      status: statusBreakdown
    },
    upcomingDeadlines,
    teamActivity,
    monthlyTrends,
    generatedAt: new Date().toISOString()
  };
}

async function getEventStats(whereClause: string, queryParams: any[]) {
  const result = await query(`
    SELECT 
      COUNT(*) as total_events,
      COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as upcoming_events,
      COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END) as past_events,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_events
    FROM calendar_events ce
    WHERE ${whereClause}
  `, queryParams);

  return result.rows[0];
}

async function getComplianceStats(whereClause: string, queryParams: any[]) {
  const result = await query(`
    SELECT 
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / 
      NULLIF(COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END)::float, 0) * 100 as compliance_rate,
      AVG(CASE 
        WHEN status = 'completed' AND completed_at IS NOT NULL 
        THEN EXTRACT(epoch FROM (start_date - completed_at))/86400 
        ELSE NULL 
      END) as avg_days_early
    FROM calendar_events ce
    WHERE ${whereClause}
  `, queryParams);

  const stats = result.rows[0];
  return {
    complianceRate: Math.round(stats.compliance_rate || 0),
    avgDaysEarly: Math.round(stats.avg_days_early || 0)
  };
}

async function getEventTypeBreakdown(whereClause: string, queryParams: any[]) {
  const result = await query(`
    SELECT 
      event_type,
      COUNT(*) as count,
      COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
    FROM calendar_events ce
    WHERE ${whereClause}
    GROUP BY event_type
    ORDER BY count DESC
  `, queryParams);

  return result.rows.map(row => ({
    type: row.event_type,
    count: parseInt(row.count),
    percentage: Math.round(row.percentage)
  }));
}

async function getPriorityBreakdown(whereClause: string, queryParams: any[]) {
  const result = await query(`
    SELECT 
      priority,
      COUNT(*) as count
    FROM calendar_events ce
    WHERE ${whereClause}
    GROUP BY priority
    ORDER BY 
      CASE priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END
  `, queryParams);

  return result.rows.map(row => ({
    priority: row.priority,
    count: parseInt(row.count)
  }));
}

async function getStatusBreakdown(whereClause: string, queryParams: any[]) {
  const result = await query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM calendar_events ce
    WHERE ${whereClause}
    GROUP BY status
  `, queryParams);

  return result.rows.map(row => ({
    status: row.status,
    count: parseInt(row.count)
  }));
}

async function getUpcomingDeadlines(teamId?: string) {
  let whereClause = 'ce.start_date >= CURRENT_DATE AND ce.published = true';
  let queryParams: any[] = [];

  if (teamId) {
    whereClause += ' AND ce.team_id = $1';
    queryParams.push(teamId);
  }

  const result = await query(`
    SELECT 
      ce.id, ce.title, ce.start_date, ce.event_type, ce.priority,
      EXTRACT(epoch FROM (ce.start_date - CURRENT_DATE))/86400 as days_until
    FROM calendar_events ce
    WHERE ${whereClause}
    ORDER BY ce.start_date ASC
    LIMIT 10
  `, queryParams);

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    eventType: row.event_type,
    priority: row.priority,
    daysUntil: Math.ceil(row.days_until)
  }));
}

async function getTeamActivity(teamId?: string) {
  if (!teamId) return [];

  const result = await query(`
    SELECT 
      al.action,
      al.actor,
      al.created_at,
      u.name as actor_name,
      al.metadata
    FROM audit_logs al
    JOIN users u ON al.actor = u.id
    WHERE al.team_id = $1
    ORDER BY al.created_at DESC
    LIMIT 20
  `, [teamId]);

  return result.rows.map(row => ({
    action: row.action,
    actor: row.actor_name,
    timestamp: row.created_at,
    metadata: row.metadata
  }));
}

async function getMonthlyTrends(whereClause: string, queryParams: any[]) {
  const result = await query(`
    SELECT 
      DATE_TRUNC('month', start_date) as month,
      COUNT(*) as total_events,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
      COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_events
    FROM calendar_events ce
    WHERE ${whereClause}
    AND start_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', start_date)
    ORDER BY month
  `, queryParams);

  return result.rows.map(row => ({
    month: row.month,
    totalEvents: parseInt(row.total_events),
    completedEvents: parseInt(row.completed_events),
    criticalEvents: parseInt(row.critical_events),
    complianceRate: row.total_events > 0 ? Math.round((row.completed_events / row.total_events) * 100) : 0
  }));
}

// components/AnalyticsDashboard.tsx - Comprehensive analytics dashboard
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Calendar, Users, Clock } from 'lucide-react';

interface AnalyticsData {
  eventStats: any;
  complianceStats: any;
  breakdowns: any;
  upcomingDeadlines: any[];
  teamActivity: any[];
  monthlyTrends: any[];
  generatedAt: string;
}

export const AnalyticsDashboard: React.FC<{ teamId?: string }> = ({ teamId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [teamId, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(teamId && { teamId }),
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`, {
        headers: { 'x-user-id': 'demo-user' }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const { eventStats, complianceStats, breakdowns, upcomingDeadlines, teamActivity, monthlyTrends } = analytics;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Update
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{eventStats.total_events}</h3>
              <p className="text-gray-600">Total Events</p>
              <p className="text-sm text-gray-500">{eventStats.upcoming_events} upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{complianceStats.complianceRate}%</h3>
              <p className="text-gray-600">Compliance Rate</p>
              <p className="text-sm text-gray-500">
                {eventStats.completed_events} of {eventStats.past_events} completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{complianceStats.avgDaysEarly}</h3>
              <p className="text-gray-600">Avg Days Early</p>
              <p className="text-sm text-gray-500">Completion timing</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{eventStats.overdue_events}</h3>
              <p className="text-gray-600">Overdue Events</p>
              <p className="text-sm text-gray-500">Need attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
          <div className="space-y-3">
            {breakdowns.eventTypes.map((item: any, index: number) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
              return (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {breakdowns.priorities.map((item: any) => {
              const colors = {
                critical: 'bg-red-600',
                high: 'bg-orange-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500'
              };
              return (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[item.priority as keyof typeof colors]}`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.priority}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
        </div>
        <div className="divide-y">
          {upcomingDeadlines.slice(0, 5).map((deadline) => (
            <div key={deadline.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      {new Date(deadline.startDate).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deadline.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      deadline.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {deadline.priority}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    deadline.daysUntil <= 3 ? 'text-red-600' :
                    deadline.daysUntil <= 7 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {deadline.daysUntil === 0 ? 'Today' :
                     deadline.daysUntil === 1 ? 'Tomorrow' :
                     `${deadline.daysUntil} days`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {deadline.eventType.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p>Chart visualization would be rendered here</p>
            <p className="text-sm">Integration with Chart.js or similar charting library</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {teamActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Team Activity</h3>
          </div>
          <div className="p-4 space-y-4">
            {teamActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.actor}</span> {activity.action.toLowerCase().replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};