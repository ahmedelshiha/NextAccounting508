# Comprehensive Admin Settings Panel

A powerful, multi-regional administrative settings management system built for enterprise accounting firms operating across UAE, KSA, and Egypt. This module extends the existing accounting platform with advanced configuration capabilities, role-based permissions, and region-specific business rules.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Regional Setup](#regional-setup)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Comprehensive Admin Settings Panel is a sophisticated configuration management system designed for accounting firms with multi-regional operations. It provides centralized control over business settings while maintaining the flexibility to customize configurations for different countries and regulatory environments.

### Key Capabilities

- **Multi-Regional Configuration**: Manage settings across UAE, KSA, and Egypt with country-specific business rules
- **Advanced Permission System**: Granular role-based access control with visual permission builder
- **Financial Management**: Multi-currency support, exchange rates, and regional pricing strategies
- **Business Intelligence**: Customizable analytics dashboards and automated reporting
- **Communication Hub**: Multi-channel communication with regional provider support
- **Integration Management**: Government APIs, banking systems, and third-party services
- **Security & Compliance**: Regional compliance monitoring and advanced audit logging
- **System Administration**: Performance monitoring, backup scheduling, and health alerts

## Features

### 🌍 Regional Configuration Management

```typescript
// Example: UAE business configuration
const uaeConfig = {
  country: 'UAE',
  baseCurrency: 'AED',
  businessHours: {
    sunday: { start: '09:00', end: '18:00' },
    monday: { start: '09:00', end: '18:00' },
    // ... other days
  },
  vatSettings: {
    enabled: true,
    defaultRate: 5.0,
    vatNumber: 'TRN-123456789'
  },
  complianceRequirements: [
    'MOHRE_REGISTRATION',
    'TRADE_LICENSE',
    'VAT_REGISTRATION'
  ]
}
```

### 🔐 Advanced Permission System

- **Visual Role Builder**: Drag-and-drop permission assignment
- **Permission Matrix**: Granular control over data access and actions
- **Regional Access Control**: Country-specific permission scoping
- **Time-based Permissions**: Temporary access with automatic expiry
- **Bulk User Management**: Efficient role assignment across teams

### 💰 Multi-Currency Financial Management

```typescript
// Currency configuration with real-time rates
interface CurrencyConfig {
  baseCurrency: string;
  supportedCurrencies: string[];
  exchangeRateProvider: 'exchangerate.host' | 'fixer.io';
  autoRefreshInterval: number;
  pricingStrategy: 'unified' | 'regional' | 'dynamic';
  regionalMargins: {
    UAE: number;
    KSA: number;
    EGY: number;
  };
}
```

### 📊 Business Intelligence & Analytics

- **Dashboard Builder**: Visual dashboard creation with drag-and-drop widgets
- **KPI Configuration**: Custom key performance indicator setup
- **Automated Reporting**: Scheduled report generation and distribution
- **Cross-Regional Analytics**: Performance comparison across countries
- **Data Export**: Multiple formats (CSV, Excel, PDF, JSON)

### 📧 Communication Hub

- **Multi-Channel Support**: Email, SMS, WhatsApp Business integration
- **Template Management**: Localized message templates with variables
- **Regional Providers**: Country-specific communication service providers
- **Delivery Tracking**: Message status monitoring and analytics
- **Automated Workflows**: Trigger-based communication sequences

### 🔗 Integration Management

- **Government APIs**: 
  - UAE: MOHRE, DED, FTA
  - KSA: ZATCA, GOSI, MOL
  - Egypt: Tax Authority, Ministry of Finance
- **Banking Integration**: Regional banking APIs and payment gateways
- **Webhook Management**: Event-driven integrations with external systems
- **API Monitoring**: Connection status and performance tracking

## Architecture

### Technology Stack

```
Frontend:
├── Next.js 15 (App Router)
├── React 19 with TypeScript
├── Tailwind CSS + shadcn/ui
├── React Query for state management
└── Chart.js for analytics visualization

Backend:
├── Next.js API Routes
├── Prisma ORM with PostgreSQL
├── NextAuth.js for authentication
├── Zod for validation
└── Node.js utilities

Infrastructure:
├── PostgreSQL (Primary database)
├── Redis (Caching layer)
├── SendGrid (Email service)
├── AWS S3 (File storage)
└── Vercel/Netlify (Hosting)
```

### Database Architecture

The system uses a hierarchical settings architecture with the following core tables:

- `settings`: General configuration storage
- `regional_settings`: Country-specific configurations
- `roles` & `user_roles`: Advanced permission management
- `integrations`: Third-party service configurations
- `webhooks`: Event-driven integration endpoints
- `analytics_dashboards`: Custom dashboard configurations
- `message_templates`: Communication templates

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 13+
- Redis (optional, for caching)
- Git

### Quick Start

1. **Clone and Install**

```bash
git clone <repository-url>
cd accounting-firm
npm install
```

2. **Environment Configuration**

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/accounting_firm"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email Service
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@yourfirm.com"

# Regional APIs (optional)
UAE_MOHRE_API_KEY="your-uae-api-key"
KSA_ZATCA_API_KEY="your-ksa-api-key"
EGYPT_TAX_API_KEY="your-egypt-api-key"

# Caching (optional)
REDIS_URL="redis://localhost:6379"

# Settings Security
SETTINGS_ENCRYPTION_KEY="your-encryption-key"
```

3. **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma db push

# Seed with default settings
npm run db:seed:settings
```

4. **Start Development Server**

```bash
npm run dev
```

Access the settings panel at: `http://localhost:3000/admin/settings`

## Configuration

### Default Settings Structure

The system initializes with sensible defaults for each region:

```json
{
  "general": {
    "companyName": "Your Accounting Firm",
    "theme": "professional",
    "timezone": "UTC",
    "defaultLanguage": "en"
  },
  "regional": {
    "UAE": {
      "active": true,
      "baseCurrency": "AED",
      "businessHours": "9:00-18:00",
      "vatRate": 5.0
    },
    "KSA": {
      "active": false,
      "baseCurrency": "SAR",
      "businessHours": "8:00-17:00",
      "vatRate": 15.0
    },
    "EGY": {
      "active": false,
      "baseCurrency": "EGP",
      "businessHours": "9:00-17:00",
      "vatRate": 14.0
    }
  }
}
```

### Permission Templates

Pre-configured role templates are available:

```typescript
// Admin role template
const adminRole = {
  name: "Administrator",
  permissions: {
    settings: { read: true, write: true, delete: true },
    users: { read: true, write: true, delete: true },
    financials: { read: true, write: true, export: true },
    analytics: { read: true, configure: true, export: true }
  },
  regionAccess: ["UAE", "KSA", "EGY"],
  systemAccess: true
};

// Regional Manager role template
const regionalManagerRole = {
  name: "Regional Manager",
  permissions: {
    settings: { read: true, write: false, delete: false },
    users: { read: true, write: true, delete: false },
    financials: { read: true, write: true, export: true },
    analytics: { read: true, configure: false, export: true }
  },
  regionAccess: ["UAE"], // Configurable per assignment
  systemAccess: false
};
```

## Regional Setup

### UAE Configuration

1. Navigate to `/admin/settings/regional/uae`
2. Configure business details:

```typescript
const uaeSettings = {
  // Business Information
  tradeLicense: "123456",
  vatNumber: "100123456700003",
  mohreNumber: "12345",
  
  // Operating Hours
  businessHours: {
    sunday: { start: "09:00", end: "18:00", closed: false },
    friday: { start: "14:00", end: "18:00", closed: false },
    saturday: { closed: true }
  },
  
  // Financial Configuration
  baseCurrency: "AED",
  acceptedCurrencies: ["AED", "USD", "EUR"],
  vatSettings: {
    enabled: true,
    defaultRate: 5.0,
    exemptServices: ["BASIC_BOOKKEEPING"]
  },
  
  // Compliance Settings
  dataRetentionPeriod: 7, // years
  auditRequirements: ["ANNUAL_AUDIT", "VAT_RETURNS"],
  reportingFrequency: "QUARTERLY"
};
```

### KSA Configuration (Future)

```typescript
const ksaSettings = {
  // Business Registration
  crNumber: "1234567890",
  vatNumber: "300123456700003",
  gosiNumber: "12345",
  
  // Zakat and Tax Configuration
  zakatRate: 2.5,
  vatRate: 15.0,
  withholdingTaxRates: {
    consultancy: 5.0,
    rent: 15.0
  },
  
  // ZATCA Integration
  zatcaConfig: {
    environment: "production",
    certificatePath: "/certs/zatca-prod.p12",
    invoiceTypes: ["STANDARD", "SIMPLIFIED"]
  }
};
```

### Egypt Configuration (Future)

```typescript
const egyptSettings = {
  // Tax Registration
  taxCardNumber: "123456789",
  vatNumber: "100123456",
  socialInsuranceNumber: "12345",
  
  // Tax Configuration
  vatRate: 14.0,
  incomeTaxRates: {
    corporate: 22.5,
    individual: 25.0
  },
  
  // Egyptian Tax Authority Integration
  etaConfig: {
    environment: "production",
    taxpayerPin: "12345678",
    branchId: "0"
  }
};
```

## API Reference

### Settings Management

```typescript
// Get settings by category
GET /api/admin/settings?category=regional&country=UAE

// Update settings
PATCH /api/admin/settings
{
  "category": "regional",
  "key": "business_hours",
  "value": { "sunday": { "start": "09:00", "end": "18:00" } },
  "countryCode": "UAE"
}

// Bulk settings update
POST /api/admin/settings/bulk
{
  "settings": [
    { "category": "financial", "key": "base_currency", "value": "AED" },
    { "category": "financial", "key": "vat_rate", "value": 5.0 }
  ],
  "countryCode": "UAE"
}
```

### Permission Management

```typescript
// Create custom role
POST /api/admin/settings/permissions/roles
{
  "name": "UAE Regional Manager",
  "permissions": {
    "bookings": { "read": true, "write": true, "delete": false },
    "clients": { "read": true, "write": true, "delete": false },
    "reports": { "read": true, "export": true }
  },
  "countryAccess": ["UAE"],
  "expiresAt": "2025-12-31T23:59:59Z"
}

// Assign role to user
POST /api/admin/settings/permissions/users/{userId}/roles
{
  "roleId": "uuid-of-role",
  "assignedBy": "current-admin-id"
}
```

### Currency Management

```typescript
// Refresh exchange rates
POST /api/admin/settings/financial/currencies/refresh

// Get current rates
GET /api/admin/settings/financial/currencies/rates
{
  "base": "USD",
  "targets": ["AED", "SAR", "EGP"]
}

// Set pricing override
POST /api/admin/settings/financial/currencies/overrides
{
  "serviceId": "uuid",
  "currency": "AED",
  "price": 1000.00,
  "effectiveFrom": "2024-01-01"
}
```

### Analytics Configuration

```typescript
// Create custom dashboard
POST /api/admin/settings/analytics/dashboards
{
  "name": "UAE Operations Dashboard",
  "widgets": [
    {
      "type": "revenue_chart",
      "config": { "period": "30d", "currency": "AED" },
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
    },
    {
      "type": "booking_stats",
      "config": { "country": "UAE" },
      "position": { "x": 6, "y": 0, "w": 6, "h": 4 }
    }
  ],
  "filters": { "country": "UAE" }
}
```

## Database Schema

### Core Settings Tables

```sql
-- Main settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  country_code VARCHAR(3),
  is_encrypted BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, key, country_code)
);

-- Regional configurations
CREATE TABLE regional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB NOT NULL,
  compliance_rules JSONB,
  business_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL,
  country_access TEXT[],
  is_system_role BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Settings indexes
CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_settings_country ON settings(country_code);
CREATE INDEX idx_settings_category_country ON settings(category, country_code);
CREATE INDEX idx_settings_key_lookup ON settings(category, key, country_code);

-- Regional settings indexes
CREATE INDEX idx_regional_active ON regional_settings(is_active);
CREATE INDEX idx_regional_country ON regional_settings(country_code);

-- Role-based access indexes
CREATE INDEX idx_roles_active ON roles WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_user_roles_active ON user_roles WHERE expires_at IS NULL OR expires_at > NOW();
```

## Security

### Authentication & Authorization

The settings panel implements multiple layers of security:

1. **Session-Based Authentication**: NextAuth.js integration with role validation
2. **Permission-Based Access**: Granular permissions checked on every request
3. **Regional Access Control**: Country-specific data access restrictions
4. **API Rate Limiting**: Prevents abuse of settings endpoints

### Data Protection

```typescript
// Sensitive settings encryption
interface EncryptedSetting {
  category: string;
  key: string;
  encryptedValue: string; // AES-256 encrypted
  iv: string; // Initialization vector
  countryCode?: string;
}

// Audit trail for all changes
interface SettingsAudit {
  settingId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  previousValue?: any;
  newValue?: any;
  changedBy: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

### Compliance Features

- **GDPR Compliance**: Data retention and deletion policies
- **Regional Data Laws**: UAE, KSA, and Egypt data protection compliance
- **Audit Logging**: Comprehensive change tracking
- **Access Monitoring**: Failed access attempt detection
- **Session Security**: Automatic timeout and concurrent session limits

## Development

### Development Workflow

1. **Feature Development**

```bash
# Create feature branch
git checkout -b feature/regional-compliance

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check
```

2. **Adding New Regional Settings**

```typescript
// 1. Define country configuration
// src/lib/settings/regional/countries/qatar.ts
export const qatarConfig: CountryConfig = {
  code: 'QAT',
  name: 'Qatar',
  baseCurrency: 'QAR',
  businessHours: {
    // ... configuration
  },
  complianceRules: {
    // ... Qatar-specific rules
  }
};

// 2. Add database seed
// prisma/seeds/regional/qatar-seed.ts
export const qatarSeed = {
  // ... seed data
};

// 3. Create UI components
// src/components/settings/regional/qatar-settings.tsx
export function QatarSettings() {
  // ... component implementation
}
```

3. **Testing Strategy**

```typescript
// Unit tests for settings logic
describe('RegionalSettingsManager', () => {
  test('should validate UAE business hours', () => {
    const manager = new RegionalSettingsManager();
    const result = manager.validateBusinessHours('UAE', uaeHours);
    expect(result.isValid).toBe(true);
  });
});

// Integration tests for API endpoints
describe('Settings API', () => {
  test('should update regional settings with proper auth', async () => {
    const response = await request(app)
      .patch('/api/admin/settings/regional/UAE')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatedSettings);
    
    expect(response.status).toBe(200);
  });
});
```

### Code Quality Standards

```typescript
// ESLint configuration
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}

// Prettier configuration
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Deployment

### Production Deployment

1. **Environment Variables**

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:password@prod-db:5432/accounting_firm
NEXTAUTH_SECRET=production-secret-key
REDIS_URL=redis://prod-redis:6379
SETTINGS_ENCRYPTION_KEY=production-encryption-key

# Regional API keys
UAE_MOHRE_API_KEY=prod-uae-key
KSA_ZATCA_API_KEY=prod-ksa-key
EGYPT_TAX_API_KEY=prod-egypt-key
```

2. **Database Migration**

```bash
# Production database setup
npx prisma migrate deploy
npx prisma generate
npm run db:seed:production
```

3. **Vercel Deployment**

```bash
# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
# Set up custom domain and SSL
```

4. **Health Monitoring**

```typescript
// Health check endpoint
GET /api/admin/settings/health
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "externalAPIs": {
    "sendgrid": "operational",
    "exchangeRates": "operational"
  },
  "regions": {
    "UAE": "active",
    "KSA": "inactive",
    "EGY": "inactive"
  },
  "lastUpdate": "2024-01-15T10:30:00Z"
}
```

### Backup Strategy

```bash
# Automated database backups
0 2 * * * pg_dump $DATABASE_URL | gzip > backups/settings_$(date +%Y%m%d_%H%M%S).sql.gz

# Settings export for disaster recovery
0 3 * * * curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://yourapp.com/api/admin/settings/export > backups/settings_config_$(date +%Y%m%d).json
```

## Troubleshooting

### Common Issues

#### 1. Settings Not Loading

```bash
# Check database connection
npx prisma studio

# Verify settings table exists
SELECT * FROM settings LIMIT 5;

# Check for missing seeds
npm run db:seed:settings
```

#### 2. Permission Denied Errors

```typescript
// Debug user permissions
const debugPermissions = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });
  
  console.log('User roles:', user?.userRoles);
  return user;
};
```

#### 3. Regional Configuration Issues

```bash
# Validate regional settings
curl -X POST /api/admin/settings/regional/validate \
  -H "Content-Type: application/json" \
  -d '{"country": "UAE", "config": {...}}'

# Check business rules
npm run validate:regional-config
```

#### 4. Integration Connection Failures

```typescript
// Test external API connections
const testIntegrations = async () => {
  const results = await Promise.allSettled([
    testUAEMOHREConnection(),
    testSendGridConnection(),
    testExchangeRateAPI()
  ]);
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Integration ${index} failed:`, result.reason);
    }
  });
};
```

### Performance Monitoring

```typescript
// Settings performance metrics
interface SettingsMetrics {
  loadTime: number;
  cacheHitRatio: number;
  apiResponseTimes: Record<string, number>;
  databaseQueryTimes: Record<string, number>;
  errorRates: Record<string, number>;
}

// Monitor settings access patterns
const trackSettingsAccess = (category: string, key: string, userId: string) => {
  // Analytics tracking implementation
};
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=settings:* npm run dev

# View audit logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://yourapp.com/api/admin/settings/audit?category=regional&limit=50"
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

### Coding Standards

- Follow TypeScript strict mode
- Write comprehensive tests (minimum 80% coverage)
- Document all public APIs
- Follow the existing code style
- Add proper error handling

### Pull Request Process

1. Ensure all tests pass
2. Add tests for new features
3. Update documentation
4. Follow semantic versioning for breaking changes

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Support

For technical support and questions:

- **Documentation**: [Settings Panel Documentation](docs/settings/)
- **API Reference**: [API Documentation](docs/api-reference.md)
- **Community**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Enterprise Support**: Contact enterprise@yourfirm.com

**Built for modern accounting firms expanding across the Middle East and North Africa region.**