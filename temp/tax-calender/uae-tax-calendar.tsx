import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, Bell, Settings, Filter, Download, Plus, Search, Globe, Zap, BarChart3, MessageSquare, Shield, UserPlus, Mail } from 'lucide-react';

// Mock data for demonstration
const mockEvents = [
  {
    id: '1',
    title: 'VAT Return Filing',
    start: '2025-01-15',
    end: '2025-01-15',
    type: 'vat',
    description: 'Monthly VAT return filing deadline for December 2024',
    company: 'company-1',
    status: 'upcoming',
    priority: 'high',
    reminder: '7days',
    assignee: 'user-1',
    tags: ['filing', 'monthly'],
    attachments: []
  },
  {
    id: '2',
    title: 'Corporate Tax Payment',
    start: '2025-02-28',
    end: '2025-02-28',
    type: 'corporate',
    description: 'Q4 Corporate tax payment deadline',
    company: 'company-1',
    status: 'upcoming',
    priority: 'critical',
    reminder: '14days',
    assignee: 'user-2',
    tags: ['payment', 'quarterly'],
    attachments: []
  },
  {
    id: '3',
    title: 'Excise Tax Registration',
    start: '2025-01-30',
    end: '2025-01-30',
    type: 'excise',
    description: 'Register for excise tax for new tobacco products',
    company: 'company-2',
    status: 'in-progress',
    priority: 'medium',
    reminder: '3days',
    assignee: 'user-3',
    tags: ['registration'],
    attachments: []
  }
];

const mockTeams = [
  { id: 'team-1', name: 'Accounting Team', role: 'admin', members: 5 },
  { id: 'team-2', name: 'Tax Compliance', role: 'editor', members: 3 }
];

const mockCalendars = [
  { id: 'cal-1', name: 'VAT Deadlines', color: '#ef4444', subscribed: true, teamId: 'team-1' },
  { id: 'cal-2', name: 'Corporate Tax', color: '#3b82f6', subscribed: true, teamId: 'team-1' },
  { id: 'cal-3', name: 'Excise Tax', color: '#10b981', subscribed: false, teamId: 'team-2' }
];

export default function UAETaxCalendar() {
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState(mockEvents);
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);
  const [filters, setFilters] = useState({
    types: { vat: true, corporate: true, excise: true },
    priority: { high: true, medium: true, low: true, critical: true },
    status: { upcoming: true, 'in-progress': true, completed: true, overdue: true }
  });
  const [selectedTeam, setSelectedTeam] = useState('team-1');
  const [calendars, setCalendars] = useState(mockCalendars);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  // Simulate real-time connection
  useEffect(() => {
    const timer = setTimeout(() => setIsRealTimeConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter events based on active filters
  useEffect(() => {
    let filtered = events.filter(event => {
      const typeMatch = filters.types[event.type];
      const priorityMatch = filters.priority[event.priority];
      const statusMatch = filters.status[event.status];
      const searchMatch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return typeMatch && priorityMatch && statusMatch && searchMatch;
    });
    setFilteredEvents(filtered);
  }, [events, filters, searchTerm]);

  const toggleFilter = (category, key) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const toggleCalendarSubscription = (calId) => {
    setCalendars(prev => prev.map(cal => 
      cal.id === calId ? { ...cal, subscribed: !cal.subscribed } : cal
    ));
  };

  const getEventTypeColor = (type) => {
    const colors = {
      vat: 'bg-red-100 text-red-800 border-red-200',
      corporate: 'bg-blue-100 text-blue-800 border-blue-200',
      excise: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const exportToICal = () => {
    const icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UAE Tax Calendar//EN
${filteredEvents.map(event => `BEGIN:VEVENT
UID:${event.id}@uaetaxcalendar.com
DTSTART:${event.start.replace(/-/g, '')}
DTEND:${event.end.replace(/-/g, '')}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT`).join('\n')}
END:VCALENDAR`;
    
    const blob = new Blob([icalData], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uae-tax-calendar.ics';
    a.click();
  };

  const EventModal = ({ event, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(event.type)}`}>
                {event.type.toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                {event.priority.toUpperCase()}
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{event.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Date</h3>
                <p className="text-gray-700">{new Date(event.start).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Status</h3>
                <p className="text-gray-700 capitalize">{event.status}</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add to Calendar
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Set Reminder
              </button>
              <button onClick={exportToICal} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Export iCal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const InviteModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Invite Team Members</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Addresses</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Enter email addresses (one per line)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Send Invites
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CalendarView = () => (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Tax Calendar</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isRealTimeConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <Zap className="w-4 h-4" />
            {isRealTimeConnected ? 'Live Updates' : 'Connecting...'}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="p-2 text-gray-600 hover:text-gray-800">
            <Globe className="w-5 h-5" />
          </button>
          <button onClick={exportToICal} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Tax Types</h3>
            <div className="flex gap-3">
              {Object.keys(filters.types).map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.types[type]}
                    onChange={() => toggleFilter('types', type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
            <div className="flex gap-3">
              {Object.keys(filters.priority).map(priority => (
                <label key={priority} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.priority[priority]}
                    onChange={() => toggleFilter('priority', priority)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Calendars */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-medium text-gray-900 mb-3">Team Calendars</h3>
        <div className="space-y-2">
          {calendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={cal.subscribed}
                onChange={() => toggleCalendarSubscription(cal.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: cal.color }}></div>
              <span className="font-medium">{cal.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-900">Upcoming Events ({filteredEvents.length})</h3>
        </div>
        <div className="divide-y">
          {filteredEvents.map(event => (
            <div key={event.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEvent(event)}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                      {event.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.start).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {event.reminder}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <Bell className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TeamView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Members
        </button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">12</h3>
              <p className="text-gray-600">Team Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">3</h3>
              <p className="text-gray-600">Shared Calendars</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">8</h3>
              <p className="text-gray-600">Active Reminders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">John Doe invited 3 new members</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">VAT Return deadline updated</p>
              <p className="text-xs text-gray-500">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">Reminder sent for Corporate Tax payment</p>
              <p className="text-xs text-gray-500">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">24</h3>
              <p className="text-gray-600">Upcoming Deadlines</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">96%</h3>
              <p className="text-gray-600">Compliance Rate</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">5.2</h3>
              <p className="text-gray-600">Avg Days Early</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">12</h3>
              <p className="text-gray-600">Active Users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Chart visualization would be rendered here with actual data
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">UAE Tax Calendar</span>
              </div>
              <div className="ml-8 flex space-x-8">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => setCurrentView('team')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'team' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Users className="w-4 h-4 inline-block mr-2" />
                  Team
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <BarChart3 className="w-4 h-4 inline-block mr-2" />
                  Analytics
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">JD</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'team' && <TeamView />}
        {currentView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Modals */}
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
    </div>
  );
}