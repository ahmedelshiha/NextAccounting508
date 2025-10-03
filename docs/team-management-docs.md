# Team Member Management System

A comprehensive React-based team member management system designed for professional services firms to handle staff assignments, performance tracking, and booking management integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Components](#components)
- [Installation](#installation)
- [API Integration](#api-integration)
- [Usage](#usage)
- [Data Structure](#data-structure)
- [Configuration](#configuration)
- [Integration with Booking System](#integration-with-booking-system)

## Overview

The Team Member Management System provides a complete solution for managing professional staff members, their specialties, availability, performance metrics, and permissions. It's designed to integrate seamlessly with appointment booking systems and client management platforms.

### Key Benefits

- **Centralized Staff Management** - Single dashboard for all team member information
- **Performance Tracking** - Monitor utilization rates, revenue generation, and client satisfaction
- **Intelligent Assignment** - Filter staff by availability, specialties, and department
- **Flexible Permissions** - Granular control over booking and client access permissions
- **Professional Profiles** - Complete staff profiles with certifications and specialties

## Features

### Core Functionality

- ✅ **Staff Directory** with search and filtering capabilities
- ✅ **Performance Dashboard** with KPIs and utilization metrics
- ✅ **Multi-tab Form Interface** for comprehensive data entry
- ✅ **Status Management** (Active, Busy, On Leave, Inactive)
- ✅ **Department Organization** across service lines
- ✅ **Availability Tracking** with working hours and timezone support
- ✅ **Skills Management** with specialties and certifications
- ✅ **Permission Control** for booking and client access

### Advanced Features

- 📊 **Real-time Statistics** with performance indicators
- 🔍 **Advanced Search** across name, email, title, and specialties
- 📅 **Schedule Management** with working hours and availability notes
- 💼 **Professional Profiles** with experience years and hourly rates
- 🔔 **Notification Settings** for email, SMS, and in-app alerts
- 📈 **Revenue Tracking** and utilization rate monitoring

## Components

### 1. TeamMemberCard

**Purpose**: Display individual team member information in a card format

**Props**:
- `member` - Team member object
- `onEdit` - Edit callback function
- `onDelete` - Delete callback function
- `onToggleStatus` - Status toggle callback
- `onViewDetails` - View details callback

**Features**:
- Status indicators with color coding
- Performance metrics visualization
- Quick action buttons
- Dropdown menu for additional actions

### 2. TeamMemberForm

**Purpose**: Multi-tab form for creating and editing team members

**Props**:
- `member` - Existing member data (null for new member)
- `users` - Array of user accounts to link
- `onSave` - Save callback function
- `onCancel` - Cancel callback function

**Tabs**:
- **Basic Info** - Name, contact, role, department
- **Professional** - Experience, certifications, specialties
- **Schedule** - Working hours, days, timezone
- **Permissions** - Access controls and notifications

### 3. TeamMemberDetails

**Purpose**: Detailed view modal showing complete member information

**Props**:
- `member` - Team member object
- `onClose` - Close callback function
- `onEdit` - Edit callback function

**Sections**:
- Contact information
- Performance metrics with visual indicators
- Specialties and certifications
- Schedule and availability
- Permission settings

### 4. TeamManagement (Main Component)

**Purpose**: Orchestrates the entire team management system

**State Management**:
- Team member list with filtering
- Form visibility and editing state
- Loading states and error handling
- Search and filter parameters

## Installation

### Prerequisites

- React 18+
- Lucide React for icons
- Tailwind CSS for styling

### Setup Steps

1. **Copy the component files** to your project:
```bash
mkdir src/components/team
cp TeamManagement.jsx src/components/team/
```

2. **Add to your routing** (Next.js example):
```javascript
// pages/admin/team.js or app/admin/team/page.js
import TeamManagement from '@/components/team/TeamManagement'

export default function TeamPage() {
  return <TeamManagement />
}
```

3. **Update navigation** to include team management:
```javascript
const navigation = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Team', href: '/admin/team' },
  { name: 'Bookings', href: '/admin/bookings' },
  // ... other nav items
]
```

## API Integration

### Required Endpoints

Create these API endpoints for full functionality:

#### GET /api/admin/team-members
```javascript
// Response format
{
  "teamMembers": [
    {
      "id": "tm1",
      "userId": "user1",
      "name": "John Smith",
      "email": "john.smith@firm.com",
      "role": "STAFF",
      "department": "tax",
      "status": "active",
      // ... other properties
    }
  ]
}
```

#### POST /api/admin/team-members
```javascript
// Request body
{
  "name": "Jane Doe",
  "email": "jane.doe@firm.com",
  "department": "audit",
  "title": "Senior Auditor",
  "specialties": ["Financial Audit", "Risk Assessment"],
  "workingHours": {
    "start": "09:00",
    "end": "17:00",
    "timezone": "Africa/Cairo",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }
  // ... other fields
}
```

#### PUT /api/admin/team-members/:id
Update existing team member with same structure as POST.

#### DELETE /api/admin/team-members/:id
Remove team member from system.

### Database Schema

```sql
CREATE TABLE team_members (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role ENUM('STAFF', 'MANAGER', 'ADMIN'),
  department ENUM('tax', 'audit', 'consulting', 'bookkeeping', 'advisory', 'admin'),
  title VARCHAR(255),
  status ENUM('active', 'inactive', 'on_leave', 'busy') DEFAULT 'active',
  experience_years INT DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  specialties JSON,
  certifications JSON,
  working_hours JSON,
  can_manage_bookings BOOLEAN DEFAULT FALSE,
  can_view_all_clients BOOLEAN DEFAULT FALSE,
  notification_settings JSON,
  availability_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE team_member_stats (
  id VARCHAR(36) PRIMARY KEY,
  team_member_id VARCHAR(36) REFERENCES team_members(id),
  total_bookings INT DEFAULT 0,
  completed_bookings INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  utilization_rate INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Usage

### Basic Implementation

```javascript
import TeamManagement from '@/components/team/TeamManagement'

function AdminTeamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TeamManagement />
    </div>
  )
}
```

### Integration with Existing User System

The component automatically integrates with your user management system by:

1. **Loading existing users** via `/api/admin/users`
2. **Linking team members** to user accounts through `userId`
3. **Creating new users** when adding team members without existing accounts

### Customization Options

#### Department Configuration
```javascript
const departmentOptions = [
  { value: 'tax', label: 'Tax Services', color: 'bg-green-100 text-green-800' },
  { value: 'audit', label: 'Audit', color: 'bg-blue-100 text-blue-800' },
  // Add your custom departments
]
```

#### Specialty Lists
```javascript
const commonSpecialties = [
  'Corporate Tax', 'Individual Tax',
  'Financial Audit', 'Internal Audit',
  // Add your service specialties
]
```

## Data Structure

### TeamMember Interface

```javascript
const teamMember = {
  // Basic Information
  id: "unique-identifier",
  userId: "linked-user-account-id",
  name: "Full Name",
  email: "email@domain.com",
  phone: "+1234567890",
  role: "STAFF|MANAGER|ADMIN",
  department: "tax|audit|consulting|bookkeeping|advisory|admin",
  status: "active|inactive|on_leave|busy",
  title: "Job Title",

  // Professional Details
  experienceYears: 5,
  hourlyRate: 150.00,
  specialties: ["Tax Planning", "Corporate Tax"],
  certifications: ["CPA", "Tax Specialist"],

  // Availability
  workingHours: {
    start: "09:00",
    end: "17:00",
    timezone: "Africa/Cairo",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  isAvailable: true,
  availabilityNotes: "Available for emergency calls",

  // Performance Metrics
  stats: {
    totalBookings: 156,
    completedBookings: 148,
    averageRating: 4.8,
    totalRatings: 89,
    revenueGenerated: 45600,
    utilizationRate: 87
  },

  // Permissions
  canManageBookings: true,
  canViewAllClients: true,
  notificationSettings: {
    email: true,
    sms: false,
    inApp: true
  },

  // Metadata
  joinDate: "2023-01-15",
  lastActive: "2025-09-11T08:30:00Z",
  notes: "Additional notes"
}
```

## Configuration

### Environment Variables

```bash
# API endpoints
NEXT_PUBLIC_API_BASE_URL=https://yourapi.com/api
TEAM_MANAGEMENT_ENABLED=true

# Feature flags
ENABLE_PERFORMANCE_METRICS=true
ENABLE_HOURLY_RATES=true
ENABLE_SMS_NOTIFICATIONS=true
```

### Customization Options

#### Status Colors
```javascript
const statusColors = {
  active: 'text-green-600 bg-green-50',
  busy: 'text-yellow-600 bg-yellow-50',
  on_leave: 'text-blue-600 bg-blue-50',
  inactive: 'text-gray-600 bg-gray-50'
}
```

#### Performance Thresholds
```javascript
const performanceThresholds = {
  utilization: {
    excellent: 85,
    good: 70,
    poor: 50
  },
  rating: {
    excellent: 4.5,
    good: 4.0,
    poor: 3.5
  }
}
```

## Integration with Booking System

### 1. Staff Assignment Component

Replace your existing staff selection with data from the team management system:

```javascript
// In your booking component
const [teamMembers, setTeamMembers] = useState([])

useEffect(() => {
  const loadTeamMembers = async () => {
    const response = await fetch('/api/admin/team-members')
    const data = await response.json()
    setTeamMembers(data.teamMembers)
  }
  loadTeamMembers()
}, [])

// Filter available members for assignment
const availableStaff = teamMembers.filter(member => 
  member.isAvailable && 
  member.status === 'active' &&
  member.department === selectedServiceCategory
)
```

### 2. Smart Assignment Algorithm

```javascript
const findBestStaffMember = (serviceType, clientTier, datetime) => {
  return teamMembers
    .filter(member => {
      // Check availability
      if (!member.isAvailable || member.status !== 'active') return false
      
      // Check specialties
      if (!member.specialties.some(specialty => 
        serviceType.toLowerCase().includes(specialty.toLowerCase())
      )) return false
      
      // Check working hours
      const appointmentTime = new Date(datetime)
      const dayOfWeek = appointmentTime.toLocaleDateString('en', { weekday: 'long' })
      if (!member.workingHours.days.includes(dayOfWeek)) return false
      
      return true
    })
    .sort((a, b) => {
      // Priority: 1. Rating 2. Availability 3. Experience
      if (a.stats.averageRating !== b.stats.averageRating) {
        return b.stats.averageRating - a.stats.averageRating
      }
      if (a.stats.utilizationRate !== b.stats.utilizationRate) {
        return a.stats.utilizationRate - b.stats.utilizationRate
      }
      return b.experienceYears - a.experienceYears
    })[0]
}
```

### 3. Performance Updates

Update team member statistics after completed bookings:

```javascript
const updateMemberStats = async (memberId, bookingData) => {
  await fetch(`/api/admin/team-members/${memberId}/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingCompleted: true,
      revenue: bookingData.amount,
      rating: bookingData.clientRating,
      duration: bookingData.duration
    })
  })
}
```

## Troubleshooting

### Common Issues

#### 1. TypeScript Errors
The component is written in JavaScript. If using TypeScript, add type definitions:

```typescript
interface TeamMember {
  id: string;
  name: string;
  email: string;
  // ... add other properties
}
```

#### 2. Styling Issues
Ensure Tailwind CSS is properly configured with all utility classes:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  // ... rest of config
}
```

#### 3. API Integration
Check network requests and response formats:

```javascript
// Add error handling
const loadTeamMembers = async () => {
  try {
    const response = await fetch('/api/admin/team-members')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    setTeamMembers(data.teamMembers || [])
  } catch (error) {
    console.error('Failed to load team members:', error)
    // Handle error appropriately
  }
}
```

## Performance Considerations

### Optimization Tips

1. **Pagination** for large team lists:
```javascript
const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 12
const paginatedMembers = filteredMembers.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
)
```

2. **Debounced Search** to reduce API calls:
```javascript
import { useMemo } from 'react'
import { debounce } from 'lodash'

const debouncedSearch = useMemo(
  () => debounce((term) => setSearchTerm(term), 300),
  []
)
```

3. **Virtual Scrolling** for very large lists:
```javascript
// Consider react-window for 100+ team members
import { FixedSizeList as List } from 'react-window'
```

## Security Considerations

### Access Control
- Implement role-based permissions for team management
- Validate user permissions before allowing member creation/modification
- Sanitize all input data before database operations

### Data Protection
- Encrypt sensitive information (phone numbers, notes)
- Implement audit trails for team member changes
- Regular security updates and dependency management

## Contributing

### Code Standards
- Follow ESLint configuration
- Use meaningful component and function names
- Add comprehensive error handling
- Include loading states for all async operations

### Testing
```javascript
// Example test structure
describe('TeamManagement', () => {
  test('renders team member cards', () => {
    // Test implementation
  })
  
  test('filters members by search term', () => {
    // Test implementation
  })
})
```

This documentation provides comprehensive guidance for implementing and maintaining the Team Member Management System in your professional services application.