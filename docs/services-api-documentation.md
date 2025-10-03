# Services Management System - API Documentation

## Overview

This document provides comprehensive API specifications for the Enhanced Services Management System, including endpoints, request/response formats, error handling, and integration examples.

## Base Configuration

### API Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### Authentication
All admin endpoints require authentication via JWT tokens:
```typescript
headers: {
  'Authorization': 'Bearer <jwt-token>',
  'Content-Type': 'application/json'
}
```

### Rate Limiting
- **Admin Operations**: 100 requests per minute
- **Public Operations**: 500 requests per minute
- **File Uploads**: 20 requests per minute

## Core Service Operations

### Get All Services
Retrieve all services with optional filtering and pagination.

```http
GET /api/admin/services
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number for pagination | 1 |
| `limit` | number | Items per page (max 100) | 20 |
| `category` | string | Filter by service category | null |
| `currency` | string | Filter by currency code | null |
| `active` | boolean | Filter by active status | null |
| `featured` | boolean | Filter by featured status | null |
| `search` | string | Search in name and description | null |
| `sortBy` | string | Sort field (name, price, created) | 'name' |
| `sortOrder` | string | Sort direction (asc, desc) | 'asc' |
| `minPrice` | number | Minimum price filter | null |
| `maxPrice` | number | Maximum price filter | null |

#### Response
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service-uuid",
        "name": "Tax Consultation",
        "slug": "tax-consultation",
        "shortDesc": "Professional tax advice and planning",
        "description": "Comprehensive tax consultation including planning, compliance, and optimization strategies for individuals and businesses.",
        "price": 150.00,
        "currency": "USD",
        "duration": 60,
        "category": "Tax Services",
        "featured": true,
        "active": true,
        "image": "https://cdn.example.com/services/tax-consultation.jpg",
        "tags": ["tax", "consultation", "planning"],
        "bookingCount": 45,
        "revenue": 6750.00,
        "rating": 4.8,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87,
      "hasNext": true,
      "hasPrevious": false
    },
    "filters": {
      "appliedFilters": {
        "category": "Tax Services",
        "active": true
      },
      "availableCategories": ["Tax Services", "Audit", "Consulting"],
      "availableCurrencies": ["USD", "EUR", "GBP"],
      "priceRange": {
        "min": 50,
        "max": 2000
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-20T15:00:00Z",
    "requestId": "req-12345",
    "version": "1.0"
  }
}
```

### Get Single Service
Retrieve detailed information for a specific service.

```http
GET /api/admin/services/{serviceId}
```

#### Path Parameters
- `serviceId` (string, required): Service UUID or slug

#### Response
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "service-uuid",
      "name": "Tax Consultation",
      // ... all service fields
      "analytics": {
        "bookingsThisMonth": 12,
        "revenueThisMonth": 1800.00,
        "averageRating": 4.8,
        "totalBookings": 45,
        "conversionRate": 0.85
      },
      "history": [
        {
          "action": "updated",
          "field": "price",
          "oldValue": 140.00,
          "newValue": 150.00,
          "updatedBy": "admin-user-id",
          "updatedAt": "2024-01-20T14:45:00Z"
        }
      ]
    }
  }
}
```

### Create Service
Create a new service in the system.

```http
POST /api/services
```

#### Request Body
```json
{
  "name": "New Service Name",
  "slug": "new-service-name", // Optional: auto-generated if not provided
  "shortDesc": "Brief service description",
  "description": "Comprehensive service description with details about what's included, process, and benefits.",
  "price": 200.00,
  "currency": "USD",
  "duration": 90,
  "category": "Business Advisory",
  "featured": false,
  "image": "base64-encoded-image-data", // Optional
  "tags": ["business", "advisory", "consultation"],
  "metadata": {
    "minBookingNotice": 24, // hours
    "maxAdvanceBooking": 90, // days
    "requiresApproval": false,
    "availableOnline": true,
    "prerequisites": ["Basic financial documents"],
    "deliverables": ["Written report", "Action plan"]
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "new-service-uuid",
      "name": "New Service Name",
      "slug": "new-service-name",
      // ... all fields from request
      "active": true,
      "bookingCount": 0,
      "revenue": 0.00,
      "rating": 0,
      "createdAt": "2024-01-20T15:30:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  },
  "meta": {
    "message": "Service created successfully"
  }
}
```

### Update Service
Update an existing service.

```http
PUT /api/services/{serviceSlug}
```

#### Path Parameters
- `serviceSlug` (string, required): Service URL slug

#### Request Body
```json
{
  "name": "Updated Service Name",
  "shortDesc": "Updated brief description",
  "description": "Updated comprehensive description",
  "price": 175.00,
  "currency": "USD",
  "duration": 75,
  "category": "Tax Services",
  "featured": true,
  "active": true,
  "image": "updated-base64-image-data",
  "tags": ["tax", "updated", "consultation"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "service": {
      // Updated service object
      "updatedAt": "2024-01-20T16:00:00Z"
    }
  },
  "meta": {
    "message": "Service updated successfully",
    "changedFields": ["name", "price", "featured"]
  }
}
```

### Delete Service
Soft delete a service (marks as inactive and archived).

```http
DELETE /api/services/{serviceSlug}
```

#### Query Parameters
- `permanent` (boolean): Permanently delete instead of soft delete (default: false)

#### Response
```json
{
  "success": true,
  "data": {
    "deletedService": {
      "id": "service-uuid",
      "name": "Deleted Service",
      "deletedAt": "2024-01-20T16:30:00Z"
    }
  },
  "meta": {
    "message": "Service deleted successfully",
    "recoverable": true
  }
}
```

## Bulk Operations

### Bulk Update Services
Perform bulk operations on multiple services.

```http
POST /api/admin/services/bulk
```

#### Request Body
```json
{
  "action": "update_status", // update_status, update_featured, delete, duplicate
  "serviceIds": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "active": true, // for update_status
    "featured": false // for update_featured
  }
}
```

#### Available Actions
- `update_status`: Activate/deactivate services
- `update_featured`: Set/unset featured status
- `update_category`: Change category for multiple services
- `update_currency`: Convert currency for multiple services
- `delete`: Soft delete multiple services
- `duplicate`: Create copies of services

#### Response
```json
{
  "success": true,
  "data": {
    "processed": 3,
    "failed": 0,
    "results": [
      {
        "id": "uuid1",
        "status": "updated",
        "message": "Service status updated successfully"
      }
    ]
  },
  "meta": {
    "operation": "bulk_update_status",
    "timestamp": "2024-01-20T17:00:00Z"
  }
}
```

## Analytics & Statistics

### Service Statistics
Get comprehensive statistics about services.

```http
GET /api/admin/services/statistics
```

#### Query Parameters
- `period` (string): Time period (day, week, month, year, all)
- `category` (string): Filter by category
- `currency` (string): Filter by currency

#### Response
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalServices": 25,
      "activeServices": 22,
      "featuredServices": 8,
      "totalRevenue": 125000.00,
      "averagePrice": 225.50,
      "totalBookings": 456
    },
    "performance": {
      "topPerformingServices": [
        {
          "id": "service-uuid",
          "name": "Premium Tax Consultation",
          "bookings": 67,
          "revenue": 13400.00,
          "rating": 4.9
        }
      ],
      "revenueByCategory": [
        {
          "category": "Tax Services",
          "revenue": 45000.00,
          "percentage": 36.0,
          "serviceCount": 8
        }
      ],
      "currencyDistribution": [
        {
          "currency": "USD",
          "revenue": 95000.00,
          "serviceCount": 18,
          "percentage": 76.0
        }
      ]
    },
    "trends": {
      "monthlyRevenue": [
        {
          "month": "2024-01",
          "revenue": 15000.00,
          "bookings": 45,
          "newServices": 2
        }
      ],
      "popularityTrends": [
        {
          "serviceId": "uuid",
          "name": "Service Name",
          "trendDirection": "up",
          "changePercentage": 15.5
        }
      ]
    }
  }
}
```

### Service Performance Analytics
Get detailed performance analytics for a specific service.

```http
GET /api/admin/services/{serviceId}/analytics
```

#### Query Parameters
- `period` (string): Analysis period (7d, 30d, 90d, 1y)
- `metrics` (array): Specific metrics to include

#### Response
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "service-uuid",
      "name": "Service Name"
    },
    "metrics": {
      "bookings": {
        "total": 45,
        "thisMonth": 12,
        "lastMonth": 8,
        "changePercentage": 50.0,
        "trend": "increasing"
      },
      "revenue": {
        "total": 6750.00,
        "thisMonth": 1800.00,
        "lastMonth": 1200.00,
        "changePercentage": 50.0,
        "trend": "increasing"
      },
      "satisfaction": {
        "averageRating": 4.8,
        "totalRatings": 42,
        "ratingDistribution": {
          "5": 30,
          "4": 10,
          "3": 2,
          "2": 0,
          "1": 0
        }
      }
    },
    "timeline": [
      {
        "date": "2024-01-01",
        "bookings": 3,
        "revenue": 450.00,
        "avgRating": 4.7
      }
    ]
  }
}
```

## Currency Management

### Get Exchange Rates
Retrieve current exchange rates for currency conversion.

```http
GET /api/admin/services/exchange-rates
```

#### Query Parameters
- `base` (string): Base currency code (default: USD)
- `target` (array): Target currency codes

#### Response
```json
{
  "success": true,
  "data": {
    "baseCurrency": "USD",
    "rates": {
      "EUR": 0.85,
      "GBP": 0.73,
      "CAD": 1.35,
      "AUD": 1.45,
      "EGP": 30.50,
      "SAR": 3.75,
      "AED": 3.67
    },
    "lastUpdated": "2024-01-20T12:00:00Z",
    "source": "exchangerate-api.com"
  }
}
```

### Convert Service Prices
Convert all services from one currency to another.

```http
POST /api/admin/services/convert-currency
```

#### Request Body
```json
{
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "exchangeRate": 0.85, // Optional: use custom rate
  "serviceIds": ["uuid1", "uuid2"], // Optional: specific services only
  "dryRun": false // Optional: preview changes without applying
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "conversionSummary": {
      "servicesAffected": 15,
      "fromCurrency": "USD",
      "toCurrency": "EUR",
      "exchangeRate": 0.85,
      "totalOriginalValue": 3375.00,
      "totalConvertedValue": 2868.75
    },
    "convertedServices": [
      {
        "id": "uuid1",
        "name": "Service Name",
        "originalPrice": 150.00,
        "convertedPrice": 127.50,
        "currency": "EUR"
      }
    ]
  },
  "meta": {
    "conversionTimestamp": "2024-01-20T18:00:00Z",
    "reversible": true
  }
}
```

## File Management

### Upload Service Image
Upload an image for a service.

```http
POST /api/admin/services/{serviceId}/image
Content-Type: multipart/form-data
```

#### Request Body (Multipart)
- `image` (file): Image file (PNG, JPG, WEBP)
- `alt` (string): Alternative text for accessibility
- `optimize` (boolean): Whether to optimize the image

#### File Requirements
- **Maximum Size**: 2MB
- **Supported Formats**: PNG, JPG, JPEG, WEBP
- **Recommended Dimensions**: 800x600px
- **Aspect Ratio**: 4:3 or 16:9

#### Response
```json
{
  "success": true,
  "data": {
    "image": {
      "id": "image-uuid",
      "url": "https://cdn.example.com/services/optimized-image.webp",
      "originalUrl": "https://cdn.example.com/services/original-image.jpg",
      "thumbnailUrl": "https://cdn.example.com/services/thumb-image.webp",
      "alt": "Professional tax consultation service",
      "size": 156789,
      "dimensions": {
        "width": 800,
        "height": 600
      },
      "format": "webp",
      "uploadedAt": "2024-01-20T18:30:00Z"
    }
  }
}
```

### Delete Service Image
Remove an image from a service.

```http
DELETE /api/admin/services/{serviceId}/image
```

#### Response
```json
{
  "success": true,
  "data": {
    "message": "Service image deleted successfully",
    "deletedAt": "2024-01-20T19:00:00Z"
  }
}
```

## Data Import/Export

### Export Services
Export service data in various formats.

```http
GET /api/admin/services/export
```

#### Query Parameters
- `format` (string): Export format (json, csv, xlsx)
- `filters` (object): Apply same filters as service list
- `include` (array): Specific fields to include

#### Response Headers
```
Content-Type: application/json | text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="services-export-2024-01-20.json"
```

### Import Services
Import services from uploaded file.

```http
POST /api/admin/services/import
Content-Type: multipart/form-data
```

#### Request Body (Multipart)
- `file` (file): JSON or CSV file with service data
- `options` (json): Import options

#### Import Options
```json
{
  "overwriteExisting": false,
  "skipDuplicates": true,
  "validateOnly": false,
  "defaultCategory": "General",
  "defaultCurrency": "USD"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "importSummary": {
      "totalRecords": 10,
      "imported": 8,
      "skipped": 2,
      "errors": 0
    },
    "importedServices": [
      {
        "id": "new-uuid",
        "name": "Imported Service",
        "status": "created"
      }
    ],
    "skippedRecords": [
      {
        "row": 3,
        "reason": "Duplicate slug",
        "data": { "name": "Existing Service" }
      }
    ]
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid service data provided",
    "details": {
      "field": "price",
      "issue": "Price must be a positive number",
      "received": -50
    }
  },
  "meta": {
    "requestId": "req-12345",
    "timestamp": "2024-01-20T20:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `SERVICE_NOT_FOUND` | 404 | Service doesn't exist |
| `DUPLICATE_SLUG` | 409 | Service slug already exists |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RATE_LIMITED` | 429 | Too many requests |
| `FILE_TOO_LARGE` | 413 | Uploaded file exceeds size limit |
| `INVALID_CURRENCY` | 400 | Currency code not supported |
| `CONVERSION_FAILED` | 500 | Currency conversion error |
| `EXPORT_FAILED` | 500 | Data export error |
| `IMPORT_FAILED` | 500 | Data import error |

### Validation Errors
Detailed validation errors for form fields:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Multiple validation errors",
    "details": {
      "fieldErrors": {
        "name": "Service name is required",
        "description": "Description must be at least 20 characters",
        "price