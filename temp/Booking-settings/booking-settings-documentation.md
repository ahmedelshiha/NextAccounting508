# Professional Booking Settings Panel - Complete Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)  
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Components](#frontend-components)
6. [API Endpoints](#api-endpoints)
7. [Configuration Options](#configuration-options)
8. [Integration Guide](#integration-guide)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)
12. [Maintenance](#maintenance)

## Overview

The Professional Booking Settings Panel provides comprehensive administrative control over the booking system's behavior, appearance, and functionality. This implementation allows administrators to:

- **Enable/Disable Features**: Control which booking features are active
- **Configure Payment Methods**: Select and customize payment options (cash, card, wire transfer, etc.)
- **Customize Booking Flow**: Enable/disable specific steps in the booking wizard  
- **Set Availability Rules**: Configure business hours, advance booking limits, and capacity
- **Manage Notifications**: Control automatic emails, SMS, and reminders
- **Configure Pricing**: Set dynamic pricing rules and surcharges
- **Team Assignment**: Control automatic team member assignment strategies

### Key Benefits

- **Granular Control**: Fine-tune every aspect of the booking system
- **Real-time Updates**: Changes take effect immediately 
- **Validation**: Comprehensive validation prevents invalid configurations
- **Audit Trail**: Complete logging of all configuration changes
- **Import/Export**: Backup and migrate settings between environments
- **Role-based Access**: Different permission levels for different users

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   API Layer     │    │   Database      │
│                 │    │                 │    │                 │
│ Settings UI     │◄──►│ Validation      │◄──►│ BookingSettings │
│ Component Tree  │    │ Service Layer   │    │ Related Tables  │
│ State Management│    │ Security        │    │ Audit Logs     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Booking System  │
                    │                 │
                    │ Real-time       │
                    │ Configuration   │
                    │ Updates         │
                    └─────────────────┘
```

### Component Hierarchy

```
BookingSettingsPanel
├── Header (Actions, Messages)
├── TabNavigation
└── SettingsContent
    ├── GeneralSettings
    ├── PaymentSettings  
    ├── BookingStepsSettings
    ├── AvailabilitySettings
    ├── NotificationSettings
    ├── CustomerSettings
    ├── AssignmentSettings
    └── PricingSettings
```

## Database Schema

### Core Tables

#### BookingSettings
Primary configuration table storing all booking system settings.

```sql
CREATE TABLE BookingSettings (
    id VARCHAR(255) PRIMARY KEY,
    organizationId VARCHAR(255) NOT NULL,
    
    -- General Settings
    bookingEnabled BOOLEAN DEFAULT true,
    requireApproval BOOLEAN DEFAULT false,
    allowCancellation BOOLEAN DEFAULT true,
    allowRescheduling BOOLEAN DEFAULT true,
    cancellationDeadlineHours INTEGER DEFAULT 24,
    rescheduleDeadlineHours INTEGER DEFAULT 4,
    
    -- Payment Configuration  
    paymentRequired BOOLEAN DEFAULT false,
    acceptCash BOOLEAN DEFAULT true,
    acceptCard BOOLEAN DEFAULT true,
    acceptBankTransfer BOOLEAN DEFAULT false,
    acceptWire BOOLEAN DEFAULT false,
    acceptCrypto BOOLEAN DEFAULT false,
    requireFullPayment BOOLEAN DEFAULT false,
    allowPartialPayment BOOLEAN DEFAULT true,
    depositPercentage INTEGER DEFAULT 50,
    
    -- Booking Steps
    enableServiceSelection BOOLEAN DEFAULT true,
    enableDateTimeSelection BOOLEAN DEFAULT true,
    enableCustomerDetails BOOLEAN DEFAULT true,
    enableAdditionalServices BOOLEAN DEFAULT true,
    enablePaymentStep BOOLEAN DEFAULT false,
    enableConfirmationStep BOOLEAN DEFAULT true,
    enableFileUpload BOOLEAN DEFAULT false,
    enableSpecialRequests BOOLEAN DEFAULT true,
    
    -- Availability Settings
    advanceBookingDays INTEGER DEFAULT 365,
    minAdvanceBookingHours INTEGER DEFAULT 2,
    maxBookingsPerDay INTEGER DEFAULT 50,
    maxBookingsPerCustomer INTEGER DEFAULT 5,
    bufferTimeBetweenBookings INTEGER DEFAULT 15,
    
    -- Business Hours
    businessHours JSON DEFAULT '{}',
    blackoutDates JSON DEFAULT '[]',
    holidaySchedule JSON DEFAULT '{}',
    
    -- Notifications
    sendBookingConfirmation BOOLEAN DEFAULT true,
    sendReminders BOOLEAN DEFAULT true,
    reminderHours JSON DEFAULT '[24, 2]',
    notifyTeamMembers BOOLEAN DEFAULT true,
    emailNotifications BOOLEAN DEFAULT true,
    smsNotifications BOOLEAN DEFAULT false,
    
    -- Customer Experience
    requireLogin BOOLEAN DEFAULT false,
    allowGuestBooking BOOLEAN DEFAULT true,
    showPricing BOOLEAN DEFAULT true,
    showTeamMemberSelection BOOLEAN DEFAULT false,
    allowRecurringBookings BOOLEAN DEFAULT false,
    enableWaitlist BOOLEAN DEFAULT false,
    
    -- Team Assignment
    enableAutoAssignment BOOLEAN DEFAULT false,
    assignmentStrategy VARCHAR(50) DEFAULT 'ROUND_ROBIN',
    considerWorkload BOOLEAN DEFAULT true,
    considerSpecialization BOOLEAN DEFAULT true,
    
    -- Dynamic Pricing
    enableDynamicPricing BOOLEAN DEFAULT false,
    peakHoursSurcharge DECIMAL(5,2) DEFAULT 0.00,
    weekendSurcharge DECIMAL(5,2) DEFAULT 0.00,
    emergencyBookingSurcharge DECIMAL(5,2) DEFAULT 0.50,
    
    -- Integration
    calendarSync BOOLEAN DEFAULT false,
    webhookUrl VARCHAR(500),
    apiAccessEnabled BOOLEAN DEFAULT false,
    
    -- Metadata
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedBy VARCHAR(255),
    
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE,
    UNIQUE(organizationId)
);
```

#### Supporting Tables

**BookingStepConfig** - Configurable booking wizard steps
**BusinessHoursConfig** - Day-specific working hours  
**PaymentMethodConfig** - Payment method configurations
**NotificationTemplate** - Customizable notification templates

See the database schema artifact for complete table definitions.

## Backend Implementation

### Service Layer

The `BookingSettingsService` class provides the core business logic:

```typescript
class BookingSettingsService {
  // Core CRUD operations
  async getBookingSettings(organizationId: string): Promise<BookingSettings | null>
  async createDefaultSettings(organizationId: string): Promise<BookingSettings>  
  async updateBookingSettings(organizationId: string, updates: BookingSettingsUpdateRequest): Promise<BookingSettings>
  
  // Specialized updates
  async updateBookingSteps(settingsId: string, steps: Partial<BookingStepConfig>[]): Promise<BookingStepConfig[]>
  async updateBusinessHours(settingsId: string, hours: Partial<BusinessHoursConfig>[]): Promise<BusinessHoursConfig[]>
  async updatePaymentMethods(settingsId: string, methods: Partial<PaymentMethodConfig>[]): Promise<PaymentMethodConfig[]>
  
  // Validation
  async validateSettingsUpdate(organizationId: string, updates: BookingSettingsUpdateRequest): Promise<SettingsValidationResult>
  
  // Import/Export
  async exportSettings(organizationId: string): Promise<BookingSettingsExport>
  async importSettings(organizationId: string, importData: BookingSettingsImport): Promise<BookingSettings>
  async resetToDefaults(organizationId: string): Promise<BookingSettings>
}
```

### Key Features

#### 1. **Comprehensive Validation**
- Business rule validation (e.g., at least one payment method when payment required)
- Data type and range validation  
- Cross-field dependency validation
- Warning system for potentially problematic configurations

#### 2. **Transaction Safety**
- All multi-table updates wrapped in database transactions
- Rollback on any failure to maintain data consistency
- Optimistic locking to prevent concurrent modification issues

#### 3. **Audit Logging**  
- Complete change history tracking
- User attribution for all modifications
- Detailed before/after state capture

## Frontend Components

### Main Panel Component

The `BookingSettingsPanel` component serves as the main interface:

```typescript
const BookingSettingsPanel = () => {
  // State management for settings, changes, and UI
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [changes, setChanges] = useState({});
  
  // Handles real-time validation and saving
  const handleSettingChange = (section, field, value) => { ... }
  const saveSettings = async () => { ... }
  
  return (
    <div className="booking-settings-panel">
      <Header />
      <TabNavigation />  
      <SettingsContent />
    </div>
  );
};
```

### Setting Categories

#### 1. **General Settings**
- Enable/disable booking system
- Approval requirements
- Cancellation and rescheduling policies

#### 2. **Payment Settings**  
- Payment requirement configuration
- Individual payment method toggles (cash, card, wire, crypto, etc.)
- Partial payment and deposit settings

#### 3. **Booking Steps**
- Enable/disable individual wizard steps
- Configure step order and requirements
- Custom field management

#### 4. **Availability Settings**
- Advance booking timeframes
- Daily booking limits
- Buffer time configuration

#### 5. **Notification Settings**
- Email and SMS toggles
- Reminder configuration
- Template management

#### 6. **Customer Experience**
- Login requirements
- Guest booking options
- Pricing visibility
- Advanced features (recurring bookings, waitlist)

#### 7. **Team Assignment**
- Auto-assignment strategies
- Workload and specialization considerations
- Manual override options

#### 8. **Dynamic Pricing**
- Surcharge configuration
- Peak hours and weekend pricing
- Emergency booking premiums

### UI Components

#### Interactive Elements

**ToggleSwitch** - Clean on/off controls
```typescript
const ToggleSwitch = ({ enabled, onChange, label, disabled = false }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled && !disabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  </div>
);
```

**SettingCard** - Organized setting groups
```typescript
const SettingCard = ({ title, description, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {children}
  </div>
);
```

**PaymentMethodToggle** - Visual payment method selection
```typescript
const PaymentMethodToggle = ({ method, label, enabled, onChange, icon }) => (
  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
    enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
  }`} onClick={() => onChange(!enabled)}>
    <div className="flex items-center space-x-2">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
      </div>
      <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
        {enabled && <div className="w-2 h-2 bg-white rounded-full m-1"></div>}
      </div>
    </div>
  </div>
);
```

## API Endpoints

### Core Endpoints

```
GET    /api/admin/booking-settings           # Get current settings
PUT    /api/admin/booking-settings           # Update settings
POST   /api/admin/booking-settings/validate  # Validate without saving
POST   /api/admin/booking-settings/reset     # Reset to defaults
GET    /api/admin/booking-settings/export    # Export configuration  
POST   /api/admin/booking-settings/import    # Import configuration
```

### Specialized Endpoints

```
PUT    /api/admin/booking-settings/steps            # Update booking steps
PUT    /api/admin/booking-settings/business-hours   # Update business hours  
PUT    /api/admin/booking-settings/payment-methods  # Update payment methods
```

### Authentication & Authorization

All endpoints require:
- Valid authentication session
- Appropriate permissions (VIEW, EDIT, EXPORT, IMPORT, RESET)
- Organization context validation

```typescript
// Permission checking example
if (!hasPermission(session.user, 'BOOKING_SETTINGS_EDIT')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

## Configuration Options

### General Settings

| Setting | Description | Default | Validation |
|---------|-------------|---------|------------|
| `bookingEnabled` | Enable/disable entire booking system | `true` | Boolean |
| `requireApproval` | Require manual approval for bookings | `false` | Boolean |
| `allowCancellation` | Allow customer cancellations | `true` | Boolean |
| `cancellationDeadlineHours` | Hours before booking to allow cancellation | `24` | 1-168 hours |
| `allowRescheduling` | Allow customer rescheduling | `true` | Boolean |
| `rescheduleDeadlineHours` | Hours before booking to allow rescheduling | `4` | 1-72 hours |

### Payment Settings

| Setting | Description | Default | Dependencies |
|---------|-------------|---------|--------------|
| `paymentRequired` | Require payment for bookings | `false` | If true, at least one payment method must be enabled |
| `acceptCash` | Accept cash payments | `true` | None |
| `acceptCard` | Accept credit/debit cards | `true` | Payment gateway configuration |
| `acceptBankTransfer` | Accept bank transfers | `false` | Bank account configuration |
| `acceptWire` | Accept wire transfers | `false` | Wire transfer details |
| `acceptCrypto` | Accept cryptocurrency | `false` | Crypto wallet setup |
| `requireFullPayment` | Require full payment upfront | `false` | `paymentRequired = true` |
| `allowPartialPayment` | Allow partial/deposit payments | `true` | `paymentRequired = true` |
| `depositPercentage` | Deposit percentage for partial payments | `50%` | 10-100%, `allowPartialPayment = true` |

### Booking Steps Configuration

| Step | Description | Required | Dependencies |
|------|-------------|----------|--------------|
| `enableServiceSelection` | Service selection step | Yes | Cannot be disabled |
| `enableDateTimeSelection` | Date/time selection step | Yes | Cannot be disabled |
| `enableCustomerDetails` | Customer information step | Yes | Cannot be disabled |
| `enableAdditionalServices` | Add-on services step | No | Service add-ons configured |
| `enablePaymentStep` | Payment processing step | No | `paymentRequired = true` |
| `enableFileUpload` | Document upload step | No | File storage configured |
| `enableSpecialRequests` | Special requests/notes step | No | None |
| `enableConfirmationStep` | Final confirmation step | Yes | Cannot be disabled |

### Availability Settings

| Setting | Description | Default | Range |
|---------|-------------|---------|--------|
| `advanceBookingDays` | Maximum days in advance to allow bookings | `365` | 1-730 days |
| `minAdvanceBookingHours` | Minimum hours in advance required | `2` | 0-168 hours |
| `maxBookingsPerDay` | Maximum bookings allowed per day | `50` | 1-200 |
| `maxBookingsPerCustomer` | Maximum bookings per customer | `5` | 1-20 |
| `bufferTimeBetweenBookings` | Buffer minutes between bookings | `15` | 0-120 minutes |

### Notification Settings  

| Setting | Description | Default | Dependencies |
|---------|-------------|---------|--------------|
| `sendBookingConfirmation` | Send booking confirmation emails | `true` | Email service configured |
| `sendReminders` | Send reminder notifications | `true` | Email/SMS service configured |
| `reminderHours` | Hours before booking to send reminders | `[24, 2]` | Array of valid hour values |
| `notifyTeamMembers` | Notify assigned team members | `true` | Team member email addresses |
| `emailNotifications` | Enable email notifications | `true` | Email service configured |
| `smsNotifications` | Enable SMS notifications | `false` | SMS service configured |

### Customer Experience Settings

| Setting | Description | Default | Impact |
|---------|-------------|---------|--------|
| `requireLogin` | Require customer login for booking | `false` | Disables guest booking |
| `allowGuestBooking` | Allow booking without account | `true` | Requires email verification |
| `showPricing` | Display pricing information | `true` | Affects booking wizard display |
| `showTeamMemberSelection` | Allow customer to choose team member | `false` | Adds team selection step |
| `allowRecurringBookings` | Enable recurring booking options | `false` | Adds recurring booking UI |
| `enableWaitlist` | Enable waitlist for fully booked slots | `false` | Adds waitlist functionality |

### Team Assignment Settings

| Setting | Description | Default | Options |
|---------|-------------|---------|---------|
| `enableAutoAssignment` | Automatically assign team members | `false` | Boolean |
| `assignmentStrategy` | How to select team members | `ROUND_ROBIN` | ROUND_ROBIN, LOAD_BALANCED, SKILL_BASED, AVAILABILITY_BASED, MANUAL |
| `considerWorkload` | Factor in current workload | `true` | Requires workload tracking |
| `considerSpecialization` | Match skills to service type | `true` | Requires skill/service mapping |

### Dynamic Pricing Settings

| Setting | Description | Default | Range |
|---------|-------------|---------|--------|
| `enableDynamicPricing` | Enable automatic price adjustments | `false` | Boolean |
| `peakHoursSurcharge` | Peak hours price increase | `0%` | 0-200% |
| `weekendSurcharge` | Weekend price increase | `0%` | 0-200% |
| `emergencyBookingSurcharge` | Last-minute booking surcharge | `50%` | 0-200% |

## Integration Guide

### Step 1: Database Migration

Run the database migration to create the required tables:

```sql
-- Execute the complete schema from the database schema artifact
-- This will create all necessary tables and indexes
```

### Step 2: Install Dependencies  

Add required packages to your project:

```bash
npm install @prisma/client
npm install lucide-react  # For icons
npm install @types/node    # TypeScript support
```

### Step 3: Service Integration

Add the BookingSettingsService to your project:

```typescript
// src/services/booking-settings.service.ts
// Copy the complete service implementation from the service artifact
```

### Step 4: API Routes Setup

Create the API endpoints in your Next.js project:

```typescript
// src/app/api/admin/booking-settings/route.ts
// Copy all endpoint implementations from the API artifact
```

### Step 5: Frontend Component Integration

Add the settings panel to your admin dashboard:

```typescript
// src/pages/admin/booking-settings.tsx
import BookingSettingsPanel from '@/components/admin/BookingSettingsPanel';

const BookingSettingsPage = () => {
  return (
    <div className="admin-layout">
      <BookingSettingsPanel />
    </div>
  );
};

export default BookingSettingsPage;
```

### Step 6: Permission Setup

Configure role-based permissions in your auth system:

```typescript
// Add these permissions to your system
const BOOKING_SETTINGS_PERMISSIONS = [
  'BOOKING_SETTINGS_VIEW',
  'BOOKING_SETTINGS_EDIT', 
  'BOOKING_SETTINGS_EXPORT',
  'BOOKING_SETTINGS_IMPORT',
  'BOOKING_SETTINGS_RESET'
];

// Assign to appropriate roles
const ADMIN_PERMISSIONS = [...BOOKING_SETTINGS_PERMISSIONS];
const MANAGER_PERMISSIONS = ['BOOKING_SETTINGS_VIEW', 'BOOKING_SETTINGS_EDIT'];
```

### Step 7: Environment Configuration

Add required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/booking_system"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# External Services (optional)
SMS_PROVIDER_API_KEY="your-sms-api-key"
EMAIL_SERVICE_API_KEY="your-email-api-key"

# Payment Gateways (optional)  
STRIPE_SECRET_KEY="sk_test_..."
PAYFORT_MERCHANT_ID="your-merchant-id"
```

## Security Considerations

### Authentication & Authorization

1. **Session Validation**: All endpoints validate user sessions
2. **Permission Checking**: Granular permissions for different operations
3. **Organization Isolation**: Users can only access their organization's settings
4. **Audit Logging**: Complete change history with user attribution

### Data Validation

1. **Input Sanitization**: All inputs sanitized and validated
2. **Type Safety**: TypeScript ensures type correctness
3. **Business Rule Validation**: Complex business logic validation
4. **SQL Injection Prevention**: Parameterized queries via Prisma

### Security Best Practices

```typescript
// Example security middleware
const validateBookingSettingsAccess = async (req: NextRequest, requiredPermission: string) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (!hasPermission(session.user, requiredPermission)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  if (!session.user.organizationId) {
    throw new BadRequestError('Organization context required');
  }
  
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId
  };
};
```

### Rate Limiting

Implement rate limiting for settings endpoints:

```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  'booking-settings-update': { requests: 10, window: '1m' },
  'booking-settings-export': { requests: 5, window: '5m' },
  'booking-settings-import': { requests: 3, window: '10m' }
};
```

## Testing Strategy

### Unit Tests

Test individual components and services:

```typescript
// Example service test
describe('BookingSettingsService', () => {
  test('should validate payment settings correctly', async () => {
    const service = new BookingSettingsService(mockPrisma);
    
    const result = await service.validateSettingsUpdate('org-1', {
      paymentSettings: {
        paymentRequired: true,
        acceptCash: false,
        acceptCard: false
      }
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'NO_PAYMENT_METHOD_ENABLED'
      })
    );
  });
});
```

### Integration Tests

Test API endpoints with real database:

```typescript
// Example API test
describe('/api/admin/booking-settings', () => {
  test('PUT should update settings successfully', async () => {
    const response = await fetch('/api/admin/booking-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generalSettings: { bookingEnabled: false }
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.settings.bookingEnabled).toBe(false);
  });
});
```

### Frontend Tests

Test React components:

```typescript
// Example component test
describe('BookingSettingsPanel', () => {
  test('should render all setting categories', () => {
    render(<BookingSettingsPanel />);
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Booking Steps')).toBeInTheDocument();
  });
  
  test('should save changes when button clicked', async () => {
    render(<BookingSettingsPanel />);
    
    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);
    
    expect(mockApiCall).toHaveBeenCalledWith('/api/admin/booking-settings', expect.any(Object));
  });
});
```

### End-to-End Tests

Test complete workflows:

```typescript
// Example E2E test with Playwright
test('Admin can update booking settings', async ({ page }) => {
  await page.goto('/admin/booking-settings');
  
  // Toggle a setting
  await page.click('[data-testid="toggle-booking-enabled"]');
  
  // Save changes
  await page.click('[data-testid="save-settings"]');
  
  // Verify success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## Deployment

### Environment Setup

1. **Development Environment**
```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Seed default settings
npx prisma db seed

# Start development server
npm run dev
```

2. **Staging Environment**
```bash
# Build application
npm run build

# Run database migrations
npx prisma migrate deploy

# Start application
npm start
```

3. **Production Environment**
```bash
# Environment variables validation
npm run validate-env

# Build and optimize
npm run build

# Database migration
npx prisma migrate deploy

# Start with PM2
pm2 start npm --name "booking-settings" -- start
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Permissions configured correctly
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Error logging configured

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/booking_system
    depends_on:
      - db
      
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: booking_system
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Maintenance

### Regular Tasks

#### Daily
- Monitor error logs for configuration-related issues
- Check audit logs for suspicious changes
- Verify backup completion

#### Weekly  
- Review performance metrics
- Analyze configuration change patterns
- Update security patches

#### Monthly
- Export settings backups
- Review and update documentation
- Performance optimization review

### Monitoring Setup

```typescript
// Health check endpoint
// src/app/api/admin/booking-settings/health/route.ts
export async function GET() {
  try {
    // Check database connectivity
    await prisma.bookingSettings.findFirst();
    
    // Check external services
    const servicesStatus = await Promise.allSettled([
      checkEmailService(),
      checkSmsService(),
      checkPaymentGateways()
    ]);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: servicesStatus.map(service => ({
        name: service.status,
        healthy: service.status === 'fulfilled'
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_booking_settings_organization ON BookingSettings(organizationId);
CREATE INDEX idx_booking_settings_updated ON BookingSettings(updatedAt DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM BookingSettings WHERE organizationId = 'org-123';
```

#### Caching Strategy
```typescript
// Redis caching for frequently accessed settings
const getBookingSettingsWithCache = async (organizationId: string) => {
  const cacheKey = `booking-settings:${organizationId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const settings = await bookingSettingsService.getBookingSettings(organizationId);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(settings));
  
  return settings;
};
```

### Troubleshooting

#### Common Issues

1. **Settings Not Saving**
   - Check user permissions
   - Verify validation errors
   - Check database connectivity
   - Review audit logs

2. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Analyze memory usage
   - Review caching strategy

3. **Permission Errors**
   - Verify role assignments
   - Check permission middleware
   - Review session management
   - Validate organization context

#### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// Enable debug logging
const DEBUG_BOOKING_SETTINGS = process.env.DEBUG_BOOKING_SETTINGS === 'true';

const debugLog = (message: string, data?: any) => {
  if (DEBUG_BOOKING_SETTINGS) {
    console.log(`[BookingSettings] ${message}`, data);
  }
};
```

### Backup and Recovery

#### Automated Backups

```bash
#!/bin/bash
# backup-booking-settings.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/booking-settings"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export all organization settings
psql $DATABASE_URL -c "
  COPY (
    SELECT bs.*, bsc.*, bhc.*, pmc.*, nt.*
    FROM BookingSettings bs
    LEFT JOIN BookingStepConfig bsc ON bs.id = bsc.bookingSettingsId
    LEFT JOIN BusinessHoursConfig bhc ON bs.id = bhc.bookingSettingsId  
    LEFT JOIN PaymentMethodConfig pmc ON bs.id = pmc.bookingSettingsId
    LEFT JOIN NotificationTemplate nt ON bs.id = nt.bookingSettingsId
  ) TO '$BACKUP_DIR/booking_settings_$DATE.csv' WITH CSV HEADER;
"

# Compress backup
gzip $BACKUP_DIR/booking_settings_$DATE.csv

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

#### Recovery Process

```typescript
// Emergency settings recovery
const recoverBookingSettings = async (organizationId: string, backupData: any) => {
  try {
    // Validate backup data
    await validateBackupData(backupData);
    
    // Create transaction for recovery
    await prisma.$transaction(async (tx) => {
      // Delete current settings
      await tx.bookingSettings.delete({
        where: { organizationId }
      });
      
      // Restore from backup
      await tx.bookingSettings.create({
        data: backupData.settings
      });
      
      // Restore related data
      await tx.bookingStepConfig.createMany({
        data: backupData.steps
      });
      
      // ... restore other related tables
    });
    
    console.log(`Settings recovered for organization: ${organizationId}`);
  } catch (error) {
    console.error('Recovery failed:', error);
    throw error;
  }
};
```

## Conclusion

This comprehensive booking settings panel provides complete administrative control over your booking system. The implementation includes:

- **Full-featured settings management** with 40+ configurable options
- **Professional UI components** with real-time validation and feedback
- **Robust backend services** with comprehensive validation and audit trails
- **Secure API endpoints** with proper authentication and authorization
- **Complete type safety** with TypeScript throughout
- **Production-ready deployment** with monitoring and backup strategies

The system is designed to be maintainable, scalable, and secure while providing administrators with the flexibility to customize the booking experience exactly as needed for their organization.

### Key Benefits Delivered

1. **Granular Control**: Every aspect of the booking system can be configured
2. **Professional UX**: Intuitive interface with clear feedback and validation  
3. **Production Ready**: Comprehensive error handling, logging, and monitoring
4. **Type Safe**: Full TypeScript implementation prevents runtime errors
5. **Secure**: Role-based permissions and comprehensive audit trails
6. **Maintainable**: Clean architecture with separation of concerns
7. **Scalable**: Optimized database queries and caching strategies

The implementation follows best practices for enterprise-grade software development and provides a solid foundation for managing complex booking system configurations.