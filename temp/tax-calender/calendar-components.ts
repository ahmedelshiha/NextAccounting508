// components/Calendar/CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Download, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EventModal } from './EventModal';
import { FilterPanel } from './FilterPanel';

interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end?: string;
  type: 'vat' | 'corporate' | 'excise';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue';
  assignee?: string;
  tags: string[];
  teamId?: string;
  calendarId?: string;
}

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventUpdate: (eventId: string, updates: Partial<Event>) => void;
  onEventCreate: (event: Omit<Event, 'id'>) => void;
  currentUser: { id: string; role: string };
  selectedTeam?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
  onEventUpdate,
  onEventCreate,
  currentUser,
  selectedTeam
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    types: { vat: true, corporate: true, excise: true },
    priorities: { low: true, medium: true, high: true, critical: true },
    status: { upcoming: true, 'in-progress': true, completed: true, overdue: true }
  });
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);

  // Filter events based on search term and filters
  useEffect(() => {
    let filtered = events.filter(event => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const typeMatch = filters.types[event.type];
      
      // Priority filter
      const priorityMatch = filters.priorities[event.priority];
      
      // Status filter
      const statusMatch = filters.status[event.status];

      return searchMatch && typeMatch && priorityMatch && statusMatch;
    });

    setFilteredEvents(filtered);
  }, [events, searchTerm, filters]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      vat: 'bg-red-500',
      corporate: 'bg-blue-500',
      excise: 'bg-green-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getPriorityBorder = (priority: string) => {
    const borders = {
      low: 'border-l-2 border-green-400',
      medium: 'border-l-2 border-yellow-400',
      high: 'border-l-2 border-orange-400',
      critical: 'border-l-4 border-red-500'
    };
    return borders[priority as keyof typeof borders] || '';
  };

  const exportToICal = () => {
    const icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UAE Tax Calendar//EN
${filteredEvents.map(event => `BEGIN:VEVENT
UID:${event.id}@uaetaxcalendar.com
DTSTART:${event.start.replace(/[-:]/g, '').split('T')[0]}T000000Z
DTEND:${(event.end || event.start).replace(/[-:]/g, '').split('T')[0]}T235959Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
CATEGORIES:${event.type.toUpperCase()}
PRIORITY:${event.priority === 'critical' ? '1' : event.priority === 'high' ? '3' : event.priority === 'medium' ? '5' : '7'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icalData], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'editor' || event.assignee === currentUser.id;

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Event' : 'Event Details'} size="lg">
      <div className="space-y-6">
        {!isEditing ? (
          <>
            {/* Event Header */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getTypeColor(event.type) as any}>
                    {event.type.toUpperCase()}
                  </Badge>
                  <Badge variant={getPriorityColor(event.priority) as any}>
                    {event.priority}
                  </Badge>
                  <Badge variant={getStatusColor(event.status) as any}>
                    {event.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700">{event.description}</p>
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Start Date</p>
                    <p className="text-sm text-gray-600">{formatDate(event.start)}</p>
                  </div>
                </div>

                {event.end && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">End Date</p>
                      <p className="text-sm text-gray-600">{formatDate(event.end)}</p>
                    </div>
                  </div>
                )}

                {event.assignee && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Assigned To</p>
                      <p className="text-sm text-gray-600">{event.assignee}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {event.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="default" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {event.priority === 'critical' && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Critical Priority</p>
                      <p className="text-sm text-red-600">This event requires immediate attention</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {event.status !== 'completed' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex gap-2">
                  {event.status === 'upcoming' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange('in-progress')}
                    >
                      Start Working
                    </Button>
                  )}
                  
                  {(event.status === 'upcoming' || event.status === 'in-progress') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange('completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <div className="flex gap-3">
                <Button variant="outline" onClick={addToGoogleCalendar}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Add to Google
                </Button>
                <Button variant="outline" onClick={exportToICal}>
                  <Download className="w-4 h-4 mr-2" />
                  Export iCal
                </Button>
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {currentUser.role === 'admin' && (
                    <Button variant="danger">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Edit Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editedEvent.title}
                  onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editedEvent.description}
                  onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={editedEvent.priority}
                    onChange={(e) => setEditedEvent({ ...editedEvent, priority: e.target.value as Event['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editedEvent.status}
                    onChange={(e) => setEditedEvent({ ...editedEvent, status: e.target.value as Event['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editedEvent.tags.join(', ')}
                  onChange={(e) => setEditedEvent({ 
                    ...editedEvent, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// components/Calendar/FilterPanel.tsx
import React from 'react';
import { Filter, X } from 'lucide-react';
import { Card } from '../ui/Card';

interface Filters {
  types: { [key: string]: boolean };
  priorities: { [key: string]: boolean };
  status: { [key: string]: boolean };
}

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  eventCounts: {
    vat: number;
    corporate: number;
    excise: number;
  };
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  eventCounts
}) => {
  const updateFilter = (category: keyof Filters, key: string, value: boolean) => {
    onFiltersChange({
      ...filters,
      [category]: {
        ...filters[category],
        [key]: value
      }
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      types: { vat: true, corporate: true, excise: true },
      priorities: { low: true, medium: true, high: true, critical: true },
      status: { upcoming: true, 'in-progress': true, completed: true, overdue: true }
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      vat: 'bg-red-100 text-red-800 border-red-200',
      corporate: 'bg-blue-100 text-blue-800 border-blue-200',
      excise: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Event Types */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Event Types</h4>
          <div className="space-y-2">
            {Object.entries(filters.types).map(([type, checked]) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateFilter('types', type, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(type)}`}>
                  {type.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  ({eventCounts[type as keyof typeof eventCounts] || 0})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Levels */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Priority</h4>
          <div className="space-y-2">
            {Object.entries(filters.priorities).map(([priority, checked]) => (
              <label key={priority} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateFilter('priorities', priority, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
          <div className="space-y-2">
            {Object.entries(filters.status).map(([status, checked]) => (
              <label key={status} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateFilter('status', status, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                  {status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};' : event.priority === 'medium' ? '5' : '7'}
END:VEVENT`).join('\n')}
END:VCALENDAR`;
    
    const blob = new Blob([icalData], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uae-tax-calendar.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
      const isToday = dateStr === currentDateStr;
      const dayEvents = filteredEvents.filter(event => 
        event.start.split('T')[0] === dateStr
      );

      days.push(
        <div
          key={dateStr}
          className={`min-h-24 border border-gray-200 p-1 ${
            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
          } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
          onDrop={(e) => handleDrop(e, dateStr)}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className={`text-sm font-medium ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${isToday ? 'text-blue-600' : ''}`}>
            {date.getDate()}
          </div>
          <div className="space-y-1 mt-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                draggable={currentUser.role !== 'viewer'}
                onDragStart={(e) => handleDragStart(e, event)}
                onClick={() => setSelectedEvent(event)}
                className={`text-xs p-1 rounded cursor-pointer truncate ${getEventTypeColor(event.type)} text-white hover:opacity-80 ${getPriorityBorder(event.priority)}`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-0 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
      </div>
    );
  };

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    if (currentUser.role === 'viewer') return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, newDate: string) => {
    e.preventDefault();
    if (!draggedEvent || currentUser.role === 'viewer') return;
    
    const updatedEvent = {
      ...draggedEvent,
      start: newDate + 'T' + draggedEvent.start.split('T')[1],
      end: draggedEvent.end ? newDate + 'T' + draggedEvent.end.split('T')[1] : undefined
    };
    
    onEventUpdate(draggedEvent.id, { start: updatedEvent.start, end: updatedEvent.end });
    setDraggedEvent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              {formatDate(currentDate)}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-md p-1">
            {(['month', 'week', 'day'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 text-sm font-medium rounded capitalize transition-colors ${
                  view === viewType 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportToICal}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          eventCounts={{
            vat: events.filter(e => e.type === 'vat').length,
            corporate: events.filter(e => e.type === 'corporate').length,
            excise: events.filter(e => e.type === 'excise').length
          }}
        />
      )}

      {/* Calendar */}
      <div className="bg-white">
        {view === 'month' && renderMonthView()}
        {view === 'week' && (
          <div className="text-center py-12 text-gray-500">
            Week view - Implementation pending
          </div>
        )}
        {view === 'day' && (
          <div className="text-center py-12 text-gray-500">
            Day view - Implementation pending
          </div>
        )}
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">VAT Events</p>
              <p className="text-lg font-semibold text-red-600">
                {filteredEvents.filter(e => e.type === 'vat').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Corporate Tax</p>
              <p className="text-lg font-semibold text-blue-600">
                {filteredEvents.filter(e => e.type === 'corporate').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Excise Tax</p>
              <p className="text-lg font-semibold text-green-600">
                {filteredEvents.filter(e => e.type === 'excise').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={onEventUpdate}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// components/Calendar/EventModal.tsx
import React, { useState } from 'react';
import { Calendar, Clock, User, Tag, AlertTriangle, Edit, Trash2, Bell, Download, ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end?: string;
  type: 'vat' | 'corporate' | 'excise';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue';
  assignee?: string;
  tags: string[];
  teamId?: string;
  calendarId?: string;
}

interface EventModalProps {
  event: Event;
  onClose: () => void;
  onUpdate: (eventId: string, updates: Partial<Event>) => void;
  currentUser: { id: string; role: string };
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  onClose,
  onUpdate,
  currentUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      vat: 'danger',
      corporate: 'info',
      excise: 'success'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'warning',
      critical: 'danger'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'info',
      'in-progress': 'warning',
      completed: 'success',
      overdue: 'danger'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const handleSave = () => {
    onUpdate(event.id, editedEvent);
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: Event['status']) => {
    const updates: Partial<Event> = { status: newStatus };
    if (newStatus === 'completed') {
      updates.status = 'completed';
    }
    onUpdate(event.id, updates);
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(event.start).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const endDate = event.end 
      ? new Date(event.end).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
      : startDate;
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=UAE`;
    window.open(url, '_blank');
  };

  const exportToICal = () => {
    const icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UAE Tax Calendar//EN
BEGIN:VEVENT
UID:${event.id}@uaetaxcalendar.com
DTSTART:${event.start.replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${(event.end || event.start).replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
CATEGORIES:${event.type.toUpperCase()}
PRIORITY:${event.priority === 'critical' ? '1' : event.priority === 'high' ? '3