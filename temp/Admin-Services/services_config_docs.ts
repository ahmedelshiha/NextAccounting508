// src/lib/permissions.ts - Enhanced Permissions System
export const PERMISSIONS = {
  // Existing permissions...
  
  // Services Management Permissions
  SERVICES_VIEW: 'SERVICES_VIEW',
  SERVICES_CREATE: 'SERVICES_CREATE', 
  SERVICES_EDIT: 'SERVICES_EDIT',
  SERVICES_DELETE: 'SERVICES_DELETE',
  SERVICES_BULK_EDIT: 'SERVICES_BULK_EDIT',
  SERVICES_EXPORT: 'SERVICES_EXPORT',
  SERVICES_ANALYTICS: 'SERVICES_ANALYTICS',
  SERVICES_MANAGE_FEATURED: 'SERVICES_MANAGE_FEATURED',
} as const;

// Role to permissions mapping
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // All existing permissions...
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_CREATE,
    PERMISSIONS.SERVICES_EDIT,
    PERMISSIONS.SERVICES_DELETE,
    PERMISSIONS.SERVICES_BULK_EDIT,
    PERMISSIONS.SERVICES_EXPORT,
    PERMISSIONS.SERVICES_ANALYTICS,
    PERMISSIONS.SERVICES_MANAGE_FEATURED,
  ],
  STAFF: [
    // Existing staff permissions...
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_EXPORT,
    PERMISSIONS.SERVICES_ANALYTICS,
  ],
  CLIENT: [
    // No services management permissions for clients
  ],
} as const;

// src/middleware.ts - Enhanced Route Protection
import { withAuth } from 'next-auth/middleware';
import { PERMISSIONS } from '@/lib/permissions';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Services admin routes protection
    if (pathname.startsWith('/admin/services')) {
      if (!token?.permissions?.includes(PERMISSIONS.SERVICES_VIEW)) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/admin/services')) {
      const method = req.method;
      const requiredPermissions = {
        GET: [PERMISSIONS.SERVICES_VIEW],
        POST: [PERMISSIONS.SERVICES_CREATE],
        PATCH: [PERMISSIONS.SERVICES_EDIT],
        PUT: [PERMISSIONS.SERVICES_EDIT],
        DELETE: [PERMISSIONS.SERVICES_DELETE],
      };

      const required = requiredPermissions[method as keyof typeof requiredPermissions] || [];
      if (!required.some(perm => token?.permissions?.includes(perm))) {
        return new Response('Insufficient permissions', { status: 403 });
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// src/lib/cache.service.ts - Professional Caching Service
import { Redis } from 'ioredis';

export class CacheService {
  private redis?: Redis;

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.redis) return;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }
}

// src/lib/notification.service.ts - Notification Service for Services
export class NotificationService {
  async notifyServiceCreated(service: any, createdBy: string): Promise<void> {
    // Implementation for service creation notifications
    // Send email to admin team, Slack notification, etc.
    console.log(`Service "${service.name}" created by ${createdBy}`);
  }

  async notifyServiceUpdated(service: any, changes: string[], updatedBy: string): Promise<void> {
    // Implementation for service update notifications
    console.log(`Service "${service.name}" updated by ${updatedBy}. Changes: ${changes.join(', ')}`);
  }

  async notifyServiceDeleted(service: any, deletedBy: string): Promise<void> {
    // Implementation for service deletion notifications
    console.log(`Service "${service.name}" deleted by ${deletedBy}`);
  }

  async notifyBulkAction(action: string, count: number, performedBy: string): Promise<void> {
    // Implementation for bulk action notifications
    console.log(`Bulk action "${action}" performed on ${count} services by ${performedBy}`);
  }
}

// Environment Variables Configuration
// Add these to your .env files:

/*
# Enhanced Services Module Configuration
REDIS_URL=redis://localhost:6379  # Optional - for caching
SERVICES_ANALYTICS_ENABLED=true
SERVICES_EXPORT_ENABLED=true
SERVICES_BULK_ACTIONS_ENABLED=true

# Rate Limiting
SERVICES_RATE_LIMIT_CREATE=10    # Max creates per minute
SERVICES_RATE_LIMIT_UPDATE=30    # Max updates per minute
SERVICES_RATE_LIMIT_LIST=100     # Max list requests per minute

# Notifications (Optional)
SLACK_WEBHOOK_URL=               # For service change notifications
ADMIN_EMAIL_NOTIFICATIONS=true  # Enable/disable email notifications
*/