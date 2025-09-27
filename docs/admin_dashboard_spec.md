# Professional Admin Dashboard Specification
## Service Management System - QuickBooks-Inspired Design

### Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Navigation Architecture](#navigation-architecture)
3. [Component Specifications](#component-specifications)
4. [Settings & Configuration](#settings--configuration)
5. [UI/UX Design System](#uiux-design-system)
6. [Technical Implementation](#technical-implementation)
7. [Responsive Design](#responsive-design)
8. [Security & Permissions](#security--permissions)

---

## Dashboard Overview

### Design Philosophy
The admin dashboard follows QuickBooks' proven enterprise interface patterns, emphasizing clarity, efficiency, and professional aesthetics. The design prioritizes data visibility, workflow optimization, and administrative control while maintaining an intuitive user experience.

### Core Principles
- **Information Hierarchy**: Critical business metrics prominently displayed
- **Workflow Efficiency**: Logical grouping of related functions
- **Data Integrity**: Real-time updates with clear status indicators
- **Professional Aesthetics**: Clean, modern interface with consistent styling
- **Scalable Architecture**: Modular components supporting business growth

### Key Features
- Fixed left sidebar navigation with collapsible sections
- Real-time dashboard metrics and KPIs
- Comprehensive settings panel for system configuration
- Role-based access control with permission management
- Multi-tenant support with tenant switching
- Advanced filtering and search capabilities
- Export/import functionality across all modules
- Audit trail and activity monitoring

---

## Navigation Architecture

### Primary Navigation Structure

```
📊 Dashboard
├── Overview
├── Business Metrics
└── Quick Actions

👥 Customers
├── Customer List
├── Customer Profiles
├── Invitations
└── Customer Analytics

📋 Work Orders
├── All Work Orders
├── Pending Approval
├── In Progress
├── Completed
├── Create New
└── Work Order Analytics

📅 Bookings
├── Today's Bookings
├── Calendar View
├── Booking Management
├── Availability Slots
├── Recurring Bookings
└── Booking Analytics

🎯 Service Requests
├── All Requests
├── Pending Review
├── Under Evaluation
├── Approved Requests
├── Converted Requests
└── Request Analytics

✅ Tasks
├── Task Board (Kanban)
├── Task List
├── My Tasks
├── Team Tasks
├── Task Analytics
├── Task Templates
└── Bulk Operations

🛍️ Services
├── Service Catalog
├── Service Categories
├── Pricing Management
├── Service Analytics
└── Bulk Service Operations

💰 Financial
├── Invoices
├── Invoice Sequences
├── Payments
├── Expenses
├── Tax Management
├── Financial Reports
└── Currency Management

👨‍💼 Team Management
├── Staff Directory
├── Roles & Permissions
├── Team Performance
├── Workload Distribution
├── Skills Management
└── Availability Management

📊 Analytics & Reports
├── Business Intelligence
├── Performance Metrics
├── Custom Reports
├── Export Center
└── Report Scheduling

📱 Communications
├── Notifications
├── Chat Console
├── Email Templates
├── Newsletter Management
└── Communication Logs

🔧 System Management
├── General Settings
├── Booking Settings
├── Integration Management
├── Upload Quarantine
├── Audit Logs
├── Performance Monitoring
├── Security Settings
└── System Health

🔒 Compliance & Security
├── User Permissions
├── Security Logs
├── Compliance Reports
├── Data Privacy
└── Backup Management
```

### Navigation Component Structure

```jsx
// Sidebar Navigation Component
const AdminSidebar = () => {
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <Logo />
        <TenantSwitcher />
      </div>
      
      <div className="sidebar-content">
        <NavigationSection title="Overview">
          <NavItem icon="dashboard" href="/admin" label="Dashboard" />
          <NavItem icon="chart-line" href="/admin/analytics" label="Analytics" />
        </NavigationSection>

        <NavigationSection title="Operations">
          <NavItem icon="users" href="/admin/customers" label="Customers" />
          <NavItem icon="clipboard-list" href="/admin/work-orders" label="Work Orders" />
          <NavItem icon="calendar" href="/admin/bookings" label="Bookings" />
          <NavItem icon="message-square" href="/admin/service-requests" label="Service Requests" />
          <NavItem icon="check-square" href="/admin/tasks" label="Tasks" />
          <NavItem icon="package" href="/admin/services" label="Services" />
        </NavigationSection>

        <NavigationSection title="Financial">
          <NavItem icon="file-text" href="/admin/invoices" label="Invoices" />
          <NavItem icon="credit-card" href="/admin/payments" label="Payments" />
          <NavItem icon="trending-up" href="/admin/expenses" label="Expenses" />
          <NavItem icon="percent" href="/admin/taxes" label="Taxes" />
        </NavigationSection>

        <NavigationSection title="Management">
          <NavItem icon="users-cog" href="/admin/team" label="Team" />
          <NavItem icon="shield-check" href="/admin/permissions" label="Permissions" />
          <NavItem icon="mail" href="/admin/notifications" label="Notifications" />
          <NavItem icon="settings" href="/admin/settings" label="Settings" />
        </NavigationSection>
      </div>

      <div className="sidebar-footer">
        <UserProfile />
        <QuickActions />
      </div>
    </div>
  );
};
```

---

## Component Specifications

### 1. Dashboard Overview

#### Main Dashboard Layout
```jsx
const DashboardOverview = () => {
  return (
    <div className="dashboard-container">
      <DashboardHeader />
      
      <div className="dashboard-grid">
        {/* Key Metrics Row */}
        <div className="metrics-row">
          <MetricCard 
            title="Active Work Orders"
            value={157}
            change={12}
            trend="up"
            period="this month"
          />
          <MetricCard 
            title="Pending Bookings"
            value={43}
            change={-3}
            trend="down"
            period="today"
          />
          <MetricCard 
            title="Revenue (MTD)"
            value="$24,580"
            change={8.3}
            trend="up"
            period="vs last month"
          />
          <MetricCard 
            title="Team Utilization"
            value="87%"
            change={2.1}
            trend="up"
            period="this week"
          />
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <ChartWidget 
            title="Work Order Trends"
            type="line"
            timeframe="30d"
          />
          <ChartWidget 
            title="Revenue by Service"
            type="donut"
            timeframe="30d"
          />
        </div>

        {/* Activity Row */}
        <div className="activity-row">
          <ActivityFeed />
          <UpcomingTasks />
          <RecentBookings />
        </div>
      </div>
    </div>
  );
};
```

#### Metric Cards Component
```jsx
const MetricCard = ({ title, value, change, trend, period, icon }) => {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon">
          <Icon name={icon} />
        </div>
        <div className="metric-actions">
          <DropdownMenu>
            <MenuItem>View Details</MenuItem>
            <MenuItem>Export Data</MenuItem>
            <MenuItem>Configure Alert</MenuItem>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="metric-content">
        <h3 className="metric-title">{title}</h3>
        <div className="metric-value">{value}</div>
        
        <div className="metric-footer">
          <div className={`metric-change ${trend}`}>
            <Icon name={trend === 'up' ? 'trending-up' : 'trending-down'} />
            <span>{Math.abs(change)}%</span>
          </div>
          <span className="metric-period">{period}</span>
        </div>
      </div>
    </div>
  );
};
```

### 2. Work Orders Management

#### Work Orders List View
```jsx
const WorkOrdersList = () => {
  return (
    <div className="work-orders-container">
      <div className="page-header">
        <div className="header-title">
          <h1>Work Orders</h1>
          <span className="record-count">1,247 total orders</span>
        </div>
        
        <div className="header-actions">
          <SearchInput placeholder="Search work orders..." />
          <FilterDropdown />
          <ExportButton />
          <Button primary>Create Work Order</Button>
        </div>
      </div>

      <div className="filters-bar">
        <FilterChips />
        <StatusTabs />
      </div>

      <div className="data-table-container">
        <WorkOrdersTable 
          columns={workOrderColumns}
          data={workOrders}
          pagination={true}
          sortable={true}
          selectable={true}
        />
      </div>
    </div>
  );
};
```

#### Work Order Details Panel
```jsx
const WorkOrderDetails = ({ workOrderId }) => {
  return (
    <div className="work-order-details">
      <div className="details-header">
        <div className="order-info">
          <h2>Work Order #{workOrder.orderNumber}</h2>
          <StatusBadge status={workOrder.status} />
        </div>
        
        <div className="details-actions">
          <Button variant="outline">Edit</Button>
          <Button variant="outline">Duplicate</Button>
          <DropdownMenu>
            <MenuItem>Convert to Invoice</MenuItem>
            <MenuItem>Archive</MenuItem>
            <MenuItem>Delete</MenuItem>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WorkOrderOverview workOrder={workOrder} />
        </TabsContent>
        
        <TabsContent value="services">
          <ServicesTable services={workOrder.services} />
        </TabsContent>
        
        <TabsContent value="tasks">
          <TasksList tasks={workOrder.tasks} />
        </TabsContent>
        
        <TabsContent value="timeline">
          <TimelineView events={workOrder.timeline} />
        </TabsContent>
        
        <TabsContent value="attachments">
          <AttachmentsGrid attachments={workOrder.attachments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 3. Task Management

#### Kanban Board View
```jsx
const TaskKanbanBoard = () => {
  const taskStatuses = ['pending', 'assigned', 'in_progress', 'blocked', 'completed'];
  
  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div className="header-controls">
          <ViewToggle />
          <FilterButton />
          <SortButton />
        </div>
        
        <div className="header-actions">
          <BulkActionsMenu />
          <Button primary>Create Task</Button>
        </div>
      </div>

      <div className="kanban-board">
        {taskStatuses.map(status => (
          <KanbanColumn 
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onTaskMove={handleTaskMove}
            onTaskUpdate={handleTaskUpdate}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Task Card Component
```jsx
const TaskCard = ({ task, onUpdate, draggable = true }) => {
  return (
    <div 
      className={`task-card ${task.priority} ${draggable ? 'draggable' : ''}`}
      draggable={draggable}
    >
      <div className="task-header">
        <div className="task-priority">
          <PriorityIndicator priority={task.priority} />
        </div>
        <div className="task-actions">
          <TaskActionsMenu task={task} />
        </div>
      </div>

      <div className="task-content">
        <h4 className="task-title">{task.title}</h4>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        <div className="task-metadata">
          {task.dueDate && (
            <div className="due-date">
              <Icon name="calendar" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          
          {task.estimatedHours && (
            <div className="estimated-hours">
              <Icon name="clock" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>

      <div className="task-footer">
        <div className="assignee">
          {task.assignedTo ? (
            <Avatar user={task.assignedTo} size="sm" />
          ) : (
            <Button variant="ghost" size="sm">Assign</Button>
          )}
        </div>
        
        <div className="task-tags">
          {task.tags.map(tag => (
            <Tag key={tag} variant="secondary">{tag}</Tag>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 4. Service Requests Management

#### Service Requests List
```jsx
const ServiceRequestsList = () => {
  return (
    <div className="service-requests-container">
      <div className="page-header">
        <div className="header-title">
          <h1>Service Requests</h1>
          <StatusSummary />
        </div>
        
        <div className="header-actions">
          <SearchAndFilter />
          <BulkActions />
        </div>
      </div>

      <div className="requests-content">
        <div className="filters-sidebar">
          <FilterPanel />
        </div>
        
        <div className="requests-main">
          <RequestsDataTable />
        </div>
      </div>
    </div>
  );
};
```

#### Service Request Review Panel
```jsx
const ServiceRequestReview = ({ requestId }) => {
  return (
    <div className="request-review-panel">
      <div className="review-header">
        <div className="request-info">
          <h2>Service Request #{request.requestNumber}</h2>
          <CustomerInfo customer={request.customer} />
        </div>
        
        <div className="review-actions">
          <Button variant="success">Approve</Button>
          <Button variant="warning">Request More Info</Button>
          <Button variant="danger">Reject</Button>
        </div>
      </div>

      <div className="review-content">
        <div className="request-details">
          <RequestDetailsForm request={request} />
        </div>
        
        <div className="review-sidebar">
          <PricingEstimator />
          <ServiceMatcher />
          <ConversionOptions />
        </div>
      </div>
    </div>
  );
};
```

### 5. Calendar & Booking Management

#### Calendar View
```jsx
const BookingCalendar = () => {
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <DateNavigator />
          <ViewSelector views={['day', 'week', 'month']} />
        </div>
        
        <div className="calendar-actions">
          <AvailabilityToggle />
          <BookingActions />
        </div>
      </div>

      <div className="calendar-content">
        <CalendarGrid 
          bookings={bookings}
          availability={availability}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      </div>

      <BookingModal />
      <AvailabilityModal />
    </div>
  );
};
```

### 6. Financial Management

#### Invoices Dashboard
```jsx
const InvoicesDashboard = () => {
  return (
    <div className="invoices-container">
      <div className="financial-header">
        <FinancialMetrics />
      </div>

      <div className="invoices-content">
        <div className="invoices-toolbar">
          <InvoiceFilters />
          <InvoiceActions />
        </div>
        
        <InvoicesTable />
      </div>
      
      <div className="invoice-sidebar">
        <QuickCreateInvoice />
        <InvoiceTemplates />
        <PaymentReminders />
      </div>
    </div>
  );
};
```

---

## Settings & Configuration

### Settings Navigation Structure
```
⚙️ General Settings
├── Company Information
├── Business Profile
├── Contact Information
├── Timezone & Localization
└── Default Preferences

📅 Booking Settings
├── Business Hours
├── Availability Rules
├── Booking Steps Configuration
├── Payment Methods
├── Notification Templates
└── Cancellation Policies

💰 Financial Settings
├── Currency Configuration
├── Tax Settings
├── Payment Gateway Integration
├── Invoice Templates
├── Payment Terms
└── Financial Year Settings

👥 User Management
├── User Accounts
├── Roles & Permissions
├── Access Control
├── Team Settings
└── Authentication Settings

🔧 System Configuration
├── API Settings
├── Integration Management
├── Email Configuration
├── File Upload Settings
├── Backup Configuration
└── Performance Settings

🛡️ Security Settings
├── Security Policies
├── Audit Configuration
├── Data Privacy Settings
├── Compliance Settings
└── Access Logs
```

### Settings Panel Layout
```jsx
const SettingsPanel = () => {
  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <SettingsNavigation />
      </div>
      
      <div className="settings-content">
        <SettingsHeader />
        <SettingsForm />
        <SettingsActions />
      </div>
    </div>
  );
};
```

### General Settings Form
```jsx
const GeneralSettingsForm = () => {
  return (
    <form className="settings-form">
      <SettingsSection title="Company Information">
        <FormField label="Company Name" required>
          <Input name="companyName" />
        </FormField>
        
        <FormField label="Business Type">
          <Select name="businessType" options={businessTypes} />
        </FormField>
        
        <FormField label="Company Logo">
          <FileUpload 
            accept="image/*"
            maxSize="2MB"
            name="logo"
          />
        </FormField>
      </SettingsSection>

      <SettingsSection title="Contact Information">
        <FormRow>
          <FormField label="Email Address">
            <Input type="email" name="email" />
          </FormField>
          
          <FormField label="Phone Number">
            <Input type="tel" name="phone" />
          </FormField>
        </FormRow>
        
        <FormField label="Business Address">
          <AddressInput name="address" />
        </FormField>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <FormField label="Default Currency">
          <CurrencySelect name="defaultCurrency" />
        </FormField>
        
        <FormField label="Timezone">
          <TimezoneSelect name="timezone" />
        </FormField>
        
        <FormField label="Date Format">
          <Select name="dateFormat" options={dateFormats} />
        </FormField>
      </SettingsSection>

      <div className="form-actions">
        <Button type="submit" primary>Save Settings</Button>
        <Button type="button" variant="outline">Reset</Button>
      </div>
    </form>
  );
};
```

### Booking Settings Configuration
```jsx
const BookingSettingsForm = () => {
  return (
    <form className="booking-settings-form">
      <SettingsSection title="Business Hours">
        <BusinessHoursEditor />
      </SettingsSection>

      <SettingsSection title="Booking Rules">
        <FormField label="Advance Booking Window">
          <Select name="advanceBooking" options={bookingWindows} />
        </FormField>
        
        <FormField label="Minimum Booking Notice">
          <DurationInput name="minNotice" />
        </FormField>
        
        <FormField label="Maximum Concurrent Bookings">
          <NumberInput name="maxConcurrent" min={1} />
        </FormField>
        
        <FormField label="Buffer Time Between Bookings">
          <DurationInput name="bufferTime" />
        </FormField>
      </SettingsSection>

      <SettingsSection title="Payment Settings">
        <FormField label="Require Payment">
          <RadioGroup name="paymentRequired">
            <Radio value="none">No Payment Required</Radio>
            <Radio value="deposit">Deposit Required</Radio>
            <Radio value="full">Full Payment Required</Radio>
          </RadioGroup>
        </FormField>
        
        <FormField label="Cancellation Policy">
          <TextArea name="cancellationPolicy" rows={4} />
        </FormField>
      </SettingsSection>
    </form>
  );
};
```

---

## UI/UX Design System

### Color Palette
```css
/* Primary Colors - Professional Blue Palette */
:root {
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;

  /* Secondary Colors - Warm Gray */
  --secondary-50: #f9fafb;
  --secondary-100: #f3f4f6;
  --secondary-500: #6b7280;
  --secondary-600: #4b5563;
  --secondary-900: #111827;

  /* Status Colors */
  --success-50: #ecfdf5;
  --success-500: #10b981;
  --success-600: #059669;
  
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  
  --info-50: #f0f9ff;
  --info-500: #06b6d4;
  --info-600: #0891b2;

  /* Layout */
  --sidebar-width: 280px;
  --header-height: 64px;
  --border-radius: 8px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Typography System
```css
/* Typography Scale */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }

/* Font Weights */
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

### Component Styles

#### Sidebar Styling
```css
.sidebar-container {
  position: fixed;
  left: 0;
  top: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: white;
  border-right: 1px solid var(--secondary-200);
  display: flex;
  flex-direction: column;
  z-index: 40;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--secondary-200);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.navigation-section {
  margin-bottom: 2rem;
}

.navigation-section-title {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--secondary-500);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin: 0 0.5rem;
  border-radius: var(--border-radius);
  color: var(--secondary-700);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--secondary-100);
  color: var(--secondary-900);
}

.nav-item.active {
  background-color: var(--primary-100);
  color: var(--primary-700);
  font-weight: 500;
}

.nav-item-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
  opacity: 0.75;
}

.nav-item.active .nav-item-icon {
  opacity: 1;
}
```

#### Card Components
```css
.card {
  background: white;
  border-radius: var(--border-radius);
  border: 1px solid var(--secondary-200);
  box-shadow: var(--shadow-sm);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--secondary-200);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--secondary-900);
  margin: 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--secondary-500);
  margin: 0.25rem 0 0 0;
}

.card-content {
  padding: 1.5rem;
}

.card-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--secondary-200);
  background: var(--secondary-50);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

/* Metric Cards */
.metric-card {
  @extend .card;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-500);
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--secondary-900);
  margin: 0.5rem 0;
}

.metric-change {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-change.up {
  color: var(--success-600);
}

.metric-change.down {
  color: var(--error-600);
}
```

#### Data Table Styles
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.data-table th {
  background: var(--secondary-50);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--secondary-700);
  border-bottom: 1px solid var(--secondary-200);
  font-size: 0.875rem;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--secondary-200);
  font-size: 0.875rem;
}

.data-table tbody tr:hover {
  background: var(--secondary-50);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.pending {
  background: var(--warning-100);
  color: var(--warning-800);
}

.status-badge.confirmed {
  background: var(--info-100);
  color: var(--info-800);
}

.status-badge.in-progress {
  background: var(--primary-100);
  color: var(--primary-800);
}

.status-badge.completed {
  background: var(--success-100);
  color: var(--success-800);
}

.status-badge.cancelled {
  background: var(--error-100);
  color: var(--error-800);
}
```

#### Form Components
```css
.form-field {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--secondary-700);
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: var(--error-500);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--secondary-300);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: var(--error-500);
}

.form-error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--error-600);
}

.form-help {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--secondary-500);
}
```

#### Button Components
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-600);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--secondary-100);
  color: var(--secondary-700);
  border: 1px solid var(--secondary-300);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--secondary-200);
  border-color: var(--secondary-400);
}

.btn-outline {
  background: transparent;
  color: var(--primary-600);
  border: 1px solid var(--primary-600);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-50);
}

.btn-success {
  background: var(--success-600);
  color: white;
}

.btn-warning {
  background: var(--warning-600);
  color: white;
}

.btn-danger {
  background: var(--error-600);
  color: white;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}
```

---

## Technical Implementation

### Component Architecture

#### Base Layout Structure
```jsx
// layouts/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { BreadcrumbNavigation } from '@/components/admin/layout/BreadcrumbNavigation';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PermissionProvider } from '@/contexts/PermissionContext';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <PermissionProvider>
      <NotificationProvider>
        <div className="admin-layout">
          <AdminSidebar 
            collapsed={sidebarCollapsed}
            onToggle={setSidebarCollapsed}
            mobile={isMobile}
          />
          
          <div 
            className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
          >
            <AdminHeader 
              onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            <div className="admin-content">
              <BreadcrumbNavigation />
              <main className="admin-main-content">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </NotificationProvider>
    </PermissionProvider>
  );
};

export default AdminLayout;
```

#### Sidebar Implementation
```jsx
// components/admin/layout/AdminSidebar.jsx
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight,
  Dashboard,
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  CheckSquare,
  Package,
  FileText,
  CreditCard,
  Settings
} from 'lucide-react';

const navigationConfig = [
  {
    section: 'Overview',
    items: [
      { 
        label: 'Dashboard', 
        href: '/admin', 
        icon: Dashboard,
        exact: true 
      },
      { 
        label: 'Analytics', 
        href: '/admin/analytics', 
        icon: TrendingUp 
      }
    ]
  },
  {
    section: 'Operations',
    items: [
      { 
        label: 'Work Orders', 
        href: '/admin/work-orders', 
        icon: ClipboardList,
        badge: { count: 23, variant: 'warning' }
      },
      { 
        label: 'Bookings', 
        href: '/admin/bookings', 
        icon: Calendar,
        children: [
          { label: 'All Bookings', href: '/admin/bookings' },
          { label: 'Calendar View', href: '/admin/bookings/calendar' },
          { label: 'Availability', href: '/admin/bookings/availability' }
        ]
      },
      { 
        label: 'Service Requests', 
        href: '/admin/service-requests', 
        icon: MessageSquare,
        badge: { count: 8, variant: 'info' }
      },
      { 
        label: 'Tasks', 
        href: '/admin/tasks', 
        icon: CheckSquare,
        children: [
          { label: 'Task Board', href: '/admin/tasks' },
          { label: 'My Tasks', href: '/admin/tasks/my-tasks' },
          { label: 'Team Tasks', href: '/admin/tasks/team' }
        ]
      },
      { 
        label: 'Services', 
        href: '/admin/services', 
        icon: Package 
      },
      { 
        label: 'Customers', 
        href: '/admin/customers', 
        icon: Users 
      }
    ]
  },
  {
    section: 'Financial',
    items: [
      { 
        label: 'Invoices', 
        href: '/admin/invoices', 
        icon: FileText 
      },
      { 
        label: 'Payments', 
        href: '/admin/payments', 
        icon: CreditCard 
      },
      { 
        label: 'Expenses', 
        href: '/admin/expenses', 
        icon: Receipt 
      }
    ]
  },
  {
    section: 'System',
    items: [
      { 
        label: 'Settings', 
        href: '/admin/settings', 
        icon: Settings 
      },
      { 
        label: 'Team Management', 
        href: '/admin/team', 
        icon: UserCog 
      }
    ]
  }
];

export const AdminSidebar = ({ collapsed, onToggle, mobile }) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['Overview', 'Operations']));
  const [expandedItems, setExpandedItems] = useState(new Set());
  const location = useLocation();

  const toggleSection = (section) => {
    if (collapsed) return;
    
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleItem = (itemLabel) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemLabel)) {
      newExpanded.delete(itemLabel);
    } else {
      newExpanded.add(itemLabel);
    }
    setExpandedItems(newExpanded);
  };

  const isActiveRoute = (href, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside 
      className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobile ? 'mobile' : ''}`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-container">
          <img 
            src="/logo.svg" 
            alt="Company Logo" 
            className={`logo ${collapsed ? 'logo-sm' : ''}`}
          />
          {!collapsed && (
            <span className="company-name">ServicePro</span>
          )}
        </div>
        
        <button 
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-content">
          {navigationConfig.map((section) => (
            <div key={section.section} className="nav-section">
              {!collapsed && (
                <button
                  className={`section-header ${expandedSections.has(section.section) ? 'expanded' : ''}`}
                  onClick={() => toggleSection(section.section)}
                >
                  <span className="section-title">{section.section}</span>
                  <ChevronDown className="section-arrow" />
                </button>
              )}
              
              <div 
                className={`section-items ${
                  !collapsed && expandedSections.has(section.section) ? 'expanded' : ''
                }`}
              >
                {section.items.map((item) => (
                  <div key={item.label} className="nav-item-container">
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => 
                        `nav-item ${isActive || isActiveRoute(item.href, item.exact) ? 'active' : ''}`
                      }
                      title={collapsed ? item.label : ''}
                    >
                      <div className="nav-item-content">
                        <item.icon className="nav-item-icon" />
                        {!collapsed && (
                          <>
                            <span className="nav-item-label">{item.label}</span>
                            {item.badge && (
                              <span className={`nav-badge ${item.badge.variant}`}>
                                {item.badge.count}
                              </span>
                            )}
                            {item.children && (
                              <button
                                className="nav-item-toggle"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleItem(item.label);
                                }}
                              >
                                <ChevronRight 
                                  className={`w-3 h-3 transition-transform ${
                                    expandedItems.has(item.label) ? 'rotate-90' : ''
                                  }`} 
                                />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </NavLink>
                    
                    {/* Sub-navigation */}
                    {!collapsed && item.children && expandedItems.has(item.label) && (
                      <div className="sub-nav">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.label}
                            to={child.href}
                            className={({ isActive }) => 
                              `sub-nav-item ${isActive ? 'active' : ''}`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-profile">
            <div className="user-avatar">
              <img src="/avatar.jpg" alt="User Avatar" />
            </div>
            <div className="user-info">
              <div className="user-name">John Smith</div>
              <div className="user-role">Administrator</div>
            </div>
            <DropdownMenu>
              <DropdownMenuItem href="/admin/profile">Profile</DropdownMenuItem>
              <DropdownMenuItem href="/admin/settings">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenu>
          </div>
        )}
      </div>
    </aside>
  );
};
```

#### Data Grid Component
```jsx
// components/admin/common/DataGrid.jsx
import { useState, useMemo } from 'react';
import { 
  flexRender, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable 
} from '@tanstack/react-table';
import { Search, Filter, Download, MoreVertical } from 'lucide-react';

export const DataGrid = ({ 
  data, 
  columns, 
  loading = false,
  pagination = true,
  selection = false,
  filtering = true,
  sorting = true,
  actions = [],
  onRowClick,
  className = ''
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: selection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRowsCount = Object.keys(rowSelection).length;

  return (
    <div className={`data-grid ${className}`}>
      {/* Toolbar */}
      <div className="data-grid-toolbar">
        <div className="toolbar-left">
          {filtering && (
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          
          {selection && selectedRowsCount > 0 && (
            <div className="selection-info">
              <span className="selected-count">
                {selectedRowsCount} selected
              </span>
              <div className="bulk-actions">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    className={`btn btn-sm ${action.variant || 'btn-secondary'}`}
                    onClick={() => action.onClick(Object.keys(rowSelection))}
                  >
                    {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <button className="btn btn-secondary btn-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="data-grid-container">
        {loading ? (
          <div className="data-grid-loading">
            <LoadingSpinner />
            <span>Loading data...</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className={header.column.getCanSort() ? 'sortable' : ''}>
                      <div
                        className="header-content"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <SortIcon direction={header.column.getIsSorted()} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr 
                  key={row.id}
                  className={row.getIsSelected() ? 'selected' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && !loading && (
        <div className="data-grid-pagination">
          <div className="pagination-info">
            Showing {table.getRowModel().rows.length} of {table.getRowCount()} entries
          </div>
          
          <div className="pagination-controls">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <button
                  key={i}
                  className={`page-number ${
                    table.getState().pagination.pageIndex === i ? 'active' : ''
                  }`}
                  onClick={() => table.setPageIndex(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### State Management

#### Context Providers
```jsx
// contexts/AdminContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';

const AdminContext = createContext();

const initialState = {
  user: null,
  permissions: [],
  tenant: null,
  settings: {},
  notifications: [],
  loading: false,
  error: null
};

function adminReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    
    case 'SET_TENANT':
      return { ...state, tenant: action.payload };
    
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Initialize admin context
  useEffect(() => {
    initializeAdmin();
  }, []);

  const initializeAdmin = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fetch user data
      const user = await fetchCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
      
      // Fetch permissions
      const permissions = await fetchUserPermissions(user.id);
      dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
      
      // Fetch tenant data
      const tenant = await fetchCurrentTenant();
      dispatch({ type: 'SET_TENANT', payload: tenant });
      
      // Fetch settings
      const settings = await fetchAdminSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const showNotification = (notification) => {
    const id = Date.now().toString();
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: { ...notification, id } 
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, 5000);
  };

  const updateSettings = async (newSettings) => {
    try {
      await saveAdminSettings(newSettings);
      dispatch({ type: 'SET_SETTINGS', payload: newSettings });
      showNotification({
        type: 'success',
        message: 'Settings updated successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to update settings'
      });
    }
  };

  const value = {
    ...state,
    dispatch,
    showNotification,
    updateSettings
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
```

---

## Responsive Design

### Breakpoint System
```css
/* Responsive Breakpoints */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Mobile-first responsive design */
@media (max-width: 1023px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  
  .admin-sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 50;
  }
  
  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .admin-main {
    margin-left: 0;
    width: 100%;
  }
  
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }
}

@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .data-grid-toolbar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: stretch;
  }
  
  .card {
    margin: 0 1rem;
  }
  
  .form-row {
    flex-direction: column;
  }
}

@media (max-width: 479px) {
  .metrics-row {
    grid-template-columns: 1fr;
  }
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

### Mobile-Optimized Components
```jsx
// components/admin/mobile/MobileNavigation.jsx
export const MobileNavigation = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h3>Navigation</h3>
          <button className="close-button" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mobile-nav-content">
          {/* Navigation items optimized for mobile */}
        </nav>
      </div>
    </>
  );
};

// components/admin/mobile/MobileMetricCard.jsx
export const MobileMetricCard = ({ metric }) => {
  return (
    <div className="mobile-metric-card">
      <div className="metric-header">
        <h4 className="metric-title">{metric.title}</h4>
        <span className={`trend-indicator ${metric.trend}`}>
          {metric.change > 0 ? '+' : ''}{metric.change}%
        </span>
      </div>
      
      <div className="metric-value">{metric.value}</div>
      
      <div className="metric-chart">
        <MiniChart data={metric.chartData} />
      </div>
    </div>
  );
};
```

---

## Security & Permissions

### Permission-Based Component Rendering
```jsx
// components/admin/common/PermissionGate.jsx
import { useAdmin } from '@/contexts/AdminContext';

export const PermissionGate = ({ 
  permission, 
  permissions = [], 
  role,
  fallback = null,
  children 
}) => {
  const { user, permissions: userPermissions } = useAdmin();

  const hasPermission = () => {
    // Check single permission
    if (permission && !userPermissions.includes(permission)) {
      return false;
    }
    
    // Check multiple permissions (all required)
    if (permissions.length > 0 && !permissions.every(p => userPermissions.includes(p))) {
      return false;
    }
    
    // Check role
    if (role && user.role !== role) {
      return false;
    }
    
    return true;
  };

  if (!hasPermission()) {
    return fallback;
  }

  return children;
};

// Usage example
<PermissionGate permission="work_orders.delete">
  <button className="btn btn-danger">Delete Work Order</button>
</PermissionGate>
```

### Secure API Integration
```jsx
// hooks/useSecureApi.js
import { useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

export const useSecureApi = () => {
  const { user, showNotification } = useAdmin();

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/admin${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': user.tenantId,
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      showNotification({
        type: 'error',
        message: error.message
      });
      throw error;
    }
  }, [user, showNotification]);

  return { apiCall };
};
```

### Audit Trail Component
```jsx
// components/admin/common/AuditTrail.jsx
export const AuditTrail = ({ entityType, entityId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { apiCall } = useSecureApi();

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await apiCall(`/audits?entityType=${entityType}&entityId=${entityId}`);
        setAuditLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [entityType, entityId, apiCall]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="audit-trail">
      <div className="audit-header">
        <h3>Activity History</h3>
        <span className="audit-count">{auditLogs.length} events</span>
      </div>
      
      <div className="audit-timeline">
        {auditLogs.map((log) => (
          <div key={log.id} className="audit-entry">
            <div className="audit-icon">
              <AuditIcon action={log.action} />
            </div>
            
            <div className="audit-content">
              <div className="audit-action">
                <span className="action-type">{log.action}</span>
                <span className="audit-user">by {log.user.name}</span>
              </div>
              
              <div className="audit-timestamp">
                {formatDateTime(log.createdAt)}
              </div>
              
              {log.changes && (
                <div className="audit-changes">
                  {Object.entries(log.changes).map(([field, change]) => (
                    <div key={field} className="field-change">
                      <strong>{field}:</strong>
                      <span className="old-value">{change.from}</span>
                      <span className="arrow">→</span>
                      <span className="new-value">{change.to}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {log.comment && (
                <div className="audit-comment">
                  <p>"{log.comment}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Performance Optimization

### Virtual Scrolling for Large Datasets
```jsx
// components/admin/common/VirtualizedList.jsx
import { FixedSizeList as List } from 'react-window';

export const VirtualizedDataList = ({ 
  items, 
  itemHeight = 80, 
  height = 600,
  renderItem 
}) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <div className="virtualized-list">
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
};
```

### Optimized Search and Filtering
```jsx
// hooks/useAdvancedSearch.js
import { useMemo, useState, useCallback } from 'react';
import { debounce } from 'lodash';

export const useAdvancedSearch = (data, searchFields, filterConfig) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });

  const debouncedSearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  );

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm) {
      result = result.filter(item => 
        searchFields.some(field => 
          String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        const config = filterConfig[field];
        if (config) {
          result = result.filter(item => config.filter(item, filterValue));
        }
      }
    });

    // Apply sorting
    if (sortConfig.field) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        
        if (sortConfig.direction === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, searchFields, filterConfig]);

  return {
    filteredData: filteredAndSortedData,
    searchTerm,
    filters,
    sortConfig,
    setSearch: debouncedSearch,
    setFilters,
    setSortConfig
  };
};
```

### Data Caching Strategy
```jsx
// services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
  }

  set(key, data, customTTL = null) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + (customTTL || this.ttl));
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const expiry = this.timestamps.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Automatic cleanup
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of this.timestamps.entries()) {
        if (now > expiry) {
          this.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }
}

export const cacheService = new CacheService();
cacheService.startCleanup();
```

---

## Advanced Features

### Real-time Updates with WebSocket
```jsx
// hooks/useRealTimeUpdates.js
import { useEffect, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

export const useRealTimeUpdates = (eventTypes = []) => {
  const { user, showNotification } = useAdmin();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.token) return;

    // Establish WebSocket connection
    socketRef.current = new WebSocket(
      `${process.env.REACT_APP_WS_URL}?token=${user.token}`
    );

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      
      // Subscribe to specific event types
      eventTypes.forEach(eventType => {
        socketRef.current.send(JSON.stringify({
          type: 'subscribe',
          eventType
        }));
      });
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealTimeEvent(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      showNotification({
        type: 'error',
        message: 'Connection error - some updates may be delayed'
      });
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (user?.token) {
          useRealTimeUpdates(eventTypes);
        }
      }, 3000);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user?.token, eventTypes]);

  const handleRealTimeEvent = (data) => {
    switch (data.type) {
      case 'work_order.created':
        showNotification({
          type: 'info',
          message: `New work order #${data.workOrder.orderNumber} created`
        });
        // Invalidate work orders cache
        queryClient.invalidateQueries(['work-orders']);
        break;

      case 'work_order.status_changed':
        showNotification({
          type: 'info',
          message: `Work order #${data.workOrder.orderNumber} status changed to ${data.newStatus}`
        });
        // Update specific work order in cache
        queryClient.setQueryData(['work-order', data.workOrder.id], data.workOrder);
        break;

      case 'task.assigned':
        if (data.assigneeId === user.id) {
          showNotification({
            type: 'info',
            message: `New task assigned: ${data.task.title}`
          });
        }
        queryClient.invalidateQueries(['tasks']);
        break;

      case 'booking.created':
        showNotification({
          type: 'success',
          message: `New booking received from ${data.booking.customer.name}`
        });
        queryClient.invalidateQueries(['bookings']);
        break;

      default:
        console.log('Unhandled real-time event:', data.type);
    }
  };

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN
  };
};
```

### Export/Import Functionality
```jsx
// components/admin/common/ExportImport.jsx
import { useState } from 'react';
import { Download, Upload, FileText, Table, FileSpreadsheet } from 'lucide-react';

export const ExportImport = ({ 
  entityType, 
  onImportSuccess, 
  exportFormats = ['csv', 'excel', 'pdf'],
  importFormats = ['csv', 'excel']
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const { apiCall } = useSecureApi();

  const handleExport = async (format, filters = {}) => {
    setExportLoading(true);
    try {
      const response = await apiCall(`/${entityType}/export`, {
        method: 'POST',
        body: JSON.stringify({ format, filters })
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: getContentType(format) 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      showNotification({
        type: 'success',
        message: `${entityType} exported successfully`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (file) => {
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiCall(`/${entityType}/import`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set content-type for FormData
      });

      showNotification({
        type: 'success',
        message: `Imported ${response.data.imported} records successfully`
      });

      onImportSuccess?.(response.data);
    } catch (error) {
      showNotification({
        type: 'error',
        message: `Import failed: ${error.message}`
      });
    } finally {
      setImportLoading(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'csv': return <Table className="w-4 h-4" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <Download className="w-4 h-4" />;
    }
  };

  return (
    <div className="export-import-panel">
      {/* Export Section */}
      <div className="panel-section">
        <h4>Export Data</h4>
        <div className="export-options">
          {exportFormats.map(format => (
            <button
              key={format}
              className="btn btn-outline btn-sm"
              onClick={() => handleExport(format)}
              disabled={exportLoading}
            >
              {getFormatIcon(format)}
              Export {format.toUpperCase()}
              {exportLoading && <LoadingSpinner size="sm" />}
            </button>
          ))}
        </div>
      </div>

      {/* Import Section */}
      <div className="panel-section">
        <h4>Import Data</h4>
        <FileUpload
          accept={importFormats.map(f => `.${f}`).join(',')}
          onFileSelect={handleImport}
          loading={importLoading}
          className="import-dropzone"
        >
          <Upload className="w-8 h-8 text-secondary-400" />
          <p>Drop files here or click to browse</p>
          <p className="text-sm text-secondary-500">
            Supported: {importFormats.join(', ').toUpperCase()}
          </p>
        </FileUpload>
      </div>
    </div>
  );
};
```

### Advanced Analytics Dashboard
```jsx
// components/admin/analytics/AnalyticsDashboard.jsx
import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

export const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const { apiCall } = useSecureApi();

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overview, trends, distribution] = await Promise.all([
        apiCall(`/analytics/overview?timeframe=${timeframe}`),
        apiCall(`/analytics/trends?timeframe=${timeframe}`),
        apiCall(`/analytics/distribution?timeframe=${timeframe}`)
      ]);

      setMetrics({
        overview: overview.data,
        trends: trends.data,
        distribution: distribution.data
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AnalyticsLoading />;

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Business Analytics</h1>
        <div className="timeframe-selector">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="form-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Key Metrics */}
        <div className="metrics-section">
          <div className="section-header">
            <h2>Key Performance Indicators</h2>
          </div>
          <div className="metrics-grid">
            {metrics.overview?.kpis.map((kpi) => (
              <KPICard key={kpi.name} kpi={kpi} />
            ))}
          </div>
        </div>

        {/* Trends Chart */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Trends Overview</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trends?.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="workOrders" 
                  stroke="var(--primary-500)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--success-500)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="var(--info-500)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Service Distribution</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.distribution?.services}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.distribution?.services.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Team Performance</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.distribution?.team}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="var(--success-500)" />
                <Bar dataKey="pending" fill="var(--warning-500)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="activity-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
          </div>
          <RecentActivityFeed activities={metrics.overview?.recentActivity} />
        </div>

        {/* Top Customers */}
        <div className="customers-section">
          <div className="section-header">
            <h2>Top Customers</h2>
          </div>
          <TopCustomersList customers={metrics.distribution?.topCustomers} />
        </div>
      </div>
    </div>
  );
};
```

---

## Accessibility Features

### ARIA Labels and Keyboard Navigation
```jsx
// components/admin/common/AccessibleDataGrid.jsx
export const AccessibleDataGrid = ({ data, columns, ...props }) => {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });

  const handleKeyDown = (event) => {
    const { key } = event;
    const { row, col } = focusedCell;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedCell({ row: Math.min(row + 1, data.length - 1), col });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedCell({ row: Math.max(row - 1, 0), col });
        break;
      case 'ArrowRight':
        event.preventDefault();
        setFocusedCell({ row, col: Math.min(col + 1, columns.length - 1) });
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedCell({ row, col: Math.max(col - 1, 0) });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Trigger row selection or action
        break;
    }
  };

  return (
    <div 
      className="accessible-data-grid"
      role="grid"
      aria-label="Data table"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div role="rowgroup">
        <div role="row" className="header-row">
          {columns.map((column, colIndex) => (
            <div 
              key={column.id}
              role="columnheader"
              className="header-cell"
              aria-sort={getSortDirection(column.id)}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>
      
      <div role="rowgroup">
        {data.map((row, rowIndex) => (
          <div 
            key={row.id}
            role="row"
            className={`data-row ${
              focusedCell.row === rowIndex ? 'focused' : ''
            }`}
            aria-selected={row.selected}
          >
            {columns.map((column, colIndex) => (
              <div
                key={`${row.id}-${column.id}`}
                role="gridcell"
                className={`data-cell ${
                  focusedCell.row === rowIndex && focusedCell.col === colIndex 
                    ? 'focused' : ''
                }`}
                tabIndex={
                  focusedCell.row === rowIndex && focusedCell.col === colIndex 
                    ? 0 : -1
                }
                aria-describedby={`cell-${rowIndex}-${colIndex}-desc`}
              >
                {renderCell(row, column)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Screen Reader Support
```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus indicators */
*:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-600);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --primary-500: #0066cc;
    --secondary-500: #333333;
    --error-500: #cc0000;
    --success-500: #006600;
    --warning-500: #cc6600;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Testing Strategy

### Component Testing
```jsx
// tests/components/AdminSidebar.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminProvider } from '@/contexts/AdminContext';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';

const mockUser = {
  id: '1',
  name: 'Admin User',
  role: 'admin',
  permissions: ['work_orders.read', 'work_orders.write']
};

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <AdminProvider value={{ user: mockUser, permissions: mockUser.permissions }}>
      {children}
    </AdminProvider>
  </MemoryRouter>
);

describe('AdminSidebar', () => {
  it('renders navigation items correctly', () => {
    render(
      <TestWrapper>
        <AdminSidebar collapsed={false} />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
  });

  it('handles sidebar collapse correctly', () => {
    const onToggle = jest.fn();
    render(
      <TestWrapper>
        <AdminSidebar collapsed={false} onToggle={onToggle} />
      </TestWrapper>
    );

    const toggleButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleButton);
    
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('shows permission-based navigation items', () => {
    render(
      <TestWrapper>
        <AdminSidebar collapsed={false} />
      </TestWrapper>
    );

    // Should show work orders since user has permission
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
    
    // Should not show restricted items
    expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
  });
});
```

### Integration Testing
```jsx
// tests/integration/WorkOrderFlow.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WorkOrdersList } from '@/components/admin/work-orders/WorkOrdersList';

const server = setupServer(
  rest.get('/api/admin/work-orders', (req, res, ctx) => {
    return res(ctx.json({
      data: {
        items: [
          {
            id: '1',
            orderNumber: 'WO-001',
            status: 'pending',
            customer: { name: 'John Doe' }
          }
        ],
        pagination: { total: 1, page: 1, limit: 20 }
      }
    }));
  }),
  
  rest.post('/api/admin/work-orders', (req, res, ctx) => {
    return res(ctx.json({
      data: {
        id: '2',
        orderNumber: 'WO-002',
        status: 'pending'
      }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Work Orders Integration', () => {
  it('displays work orders list and allows creation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <WorkOrdersList />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('WO-001')).toBeInTheDocument();
    });

    // Click create button
    fireEvent.click(screen.getByText('Create Work Order'));
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText('Customer'), { 
      target: { value: 'customer-1' } 
    });
    fireEvent.click(screen.getByText('Create'));

    // Verify new work order appears
    await waitFor(() => {
      expect(screen.getByText('WO-002')).toBeInTheDocument();
    });
  });
});
```

---

## Deployment and Configuration

### Docker Configuration
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Environment Configuration
```env
# .env.production
REACT_APP_API_BASE_URL=https://api.yourservice.com
REACT_APP_WS_URL=wss://api.yourservice.com
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production

# Feature flags
REACT_APP_FEATURE_ANALYTICS=true
REACT_APP_FEATURE_
  