# Enhanced Service Portal Implementation Guide
*Aligned with Accounting Firm Platform Architecture*

## Table of Contents
1. [Project Context & Alignment](#project-context--alignment)
2. [Enhanced Database Schema](#enhanced-database-schema)
3. [Extended API Architecture](#extended-api-architecture)
4. [Admin Dashboard Integration](#admin-dashboard-integration)
5. [Enhanced User Management](#enhanced-user-management)
6. [Service Request Workflow](#service-request-workflow)
7. [Task Management System](#task-management-system)
8. [Real-time Features](#real-time-features)
9. [Security & Permissions](#security--permissions)
10. [Implementation Strategy](#implementation-strategy)
11. [Migration from Existing System](#migration-from-existing-system)

---

## Project Context & Alignment

### Current Platform Overview
The existing accounting firm platform provides a solid foundation with:
- **Next.js 14 App Router** with TypeScript
- **Prisma ORM** with PostgreSQL database
- **NextAuth.js** authentication with role-based access
- **Comprehensive admin dashboard** at `/admin/*`
- **Established API patterns** at `/api/admin/*`
- **Multi-language support** (EN/AR/HI)

### Enhancement Scope
We'll extend the existing platform to support:
- **Service catalog management** beyond current basic services
- **Advanced request workflows** with team assignment
- **Task management system** with real-time updates
- **Enhanced user roles** (Client, Team Member, Team Lead, Admin)
- **Multi-tenant capabilities** for different accounting services

---

## Enhanced Database Schema

### Extending Existing Models

```sql
-- Extend existing User model with new roles and fields
-- Note: This builds on the existing users table structure
ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN department VARCHAR(100);
ALTER TABLE users ADD COLUMN position VARCHAR(100);
ALTER TABLE users ADD COLUMN skills JSON;
ALTER TABLE users ADD COLUMN expertise_level ENUM('junior', 'mid', 'senior', 'lead', 'expert') DEFAULT 'junior';
ALTER TABLE users ADD COLUMN hourly_rate DECIMAL(10,2);
ALTER TABLE users ADD COLUMN availability_status ENUM('available', 'busy', 'offline', 'on_leave') DEFAULT 'available';
ALTER TABLE users ADD COLUMN max_concurrent_projects INT DEFAULT 3;
ALTER TABLE users ADD COLUMN hire_date DATE;
ALTER TABLE users ADD COLUMN manager_id BIGINT;
ALTER TABLE users ADD FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Extend existing services table
ALTER TABLE services ADD COLUMN category VARCHAR(100);
ALTER TABLE services ADD COLUMN base_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN estimated_duration_hours INT;
ALTER TABLE services ADD COLUMN required_skills JSON;
ALTER TABLE services ADD COLUMN status ENUM('active', 'inactive', 'deprecated') DEFAULT 'active';

-- New tables for enhanced functionality
CREATE TABLE service_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    client_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('draft', 'submitted', 'in_review', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    deadline DATE,
    requirements JSON,
    attachments JSON,
    assigned_team_member_id BIGINT,
    assigned_at TIMESTAMP NULL,
    assigned_by BIGINT,
    completed_at TIMESTAMP NULL,
    client_approval_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_team_member_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_client_id (client_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned_team_member (assigned_team_member_id),
    INDEX idx_deadline (deadline)
);

-- Enhanced task management (extending existing task system)
CREATE TABLE task_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    default_assignee_role ENUM('team_member', 'team_lead', 'admin'),
    estimated_hours INT,
    checklist_items JSON,
    required_skills JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Task comments and attachments (if not already existing)
CREATE TABLE task_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_created_at (created_at)
);

-- Service request to task relationships
CREATE TABLE request_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_request_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request_task (service_request_id, task_id)
);

-- Enhanced permissions system
CREATE TABLE user_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_type VARCHAR(100) NOT NULL,
    resource_id BIGINT NULL,
    granted_by BIGINT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_permission (user_id, permission_type),
    INDEX idx_resource (resource_id)
);
```

### Prisma Schema Updates

```prisma
// prisma/schema.prisma updates
model User {
  // Existing fields...
  employeeId            String?           @unique @map("employee_id")
  department           String?
  position             String?
  skills               Json?
  expertiseLevel       ExpertiseLevel?   @default(junior) @map("expertise_level")
  hourlyRate           Decimal?          @map("hourly_rate") @db.Decimal(10,2)
  availabilityStatus   AvailabilityStatus @default(available) @map("availability_status")
  maxConcurrentProjects Int?             @default(3) @map("max_concurrent_projects")
  hireDate            DateTime?         @map("hire_date") @db.Date
  managerId           BigInt?           @map("manager_id")
  manager             User?             @relation("ManagerEmployee", fields: [managerId], references: [id])
  employees           User[]            @relation("ManagerEmployee")
  
  // Relations
  assignedRequests    ServiceRequest[]  @relation("AssignedTeamMember")
  assignedByRequests  ServiceRequest[]  @relation("AssignedBy")
  clientRequests      ServiceRequest[]  @relation("ClientRequests")
  taskComments        TaskComment[]
  grantedPermissions  UserPermission[]  @relation("GrantedBy")
  userPermissions     UserPermission[]  @relation("UserPermissions")
  
  @@map("users")
}

model Service {
  // Existing fields...
  category              String?
  basePrice            Decimal?          @map("base_price") @db.Decimal(10,2)
  estimatedDurationHours Int?            @map("estimated_duration_hours")
  requiredSkills       Json?             @map("required_skills")
  status               ServiceStatus     @default(active)
  
  serviceRequests      ServiceRequest[]
  
  @@map("services")
}

model ServiceRequest {
  id                    BigInt            @id @default(autoincrement())
  uuid                 String            @unique @default(uuid())
  clientId             BigInt            @map("client_id")
  serviceId            BigInt            @map("service_id")
  title                String            @db.VarChar(300)
  description          String?           @db.Text
  priority             Priority          @default(medium)
  status               RequestStatus     @default(draft)
  budgetMin            Decimal?          @map("budget_min") @db.Decimal(10,2)
  budgetMax            Decimal?          @map("budget_max") @db.Decimal(10,2)
  deadline             DateTime?         @db.Date
  requirements         Json?
  attachments          Json?
  assignedTeamMemberId BigInt?           @map("assigned_team_member_id")
  assignedAt           DateTime?         @map("assigned_at")
  assignedBy           BigInt?           @map("assigned_by")
  completedAt          DateTime?         @map("completed_at")
  clientApprovalAt     DateTime?         @map("client_approval_at")
  createdAt            DateTime          @default(now()) @map("created_at")
  updatedAt            DateTime          @updatedAt @map("updated_at")
  
  client               User              @relation("ClientRequests", fields: [clientId], references: [id])
  service              Service           @relation(fields: [serviceId], references: [id])
  assignedTeamMember   User?             @relation("AssignedTeamMember", fields: [assignedTeamMemberId], references: [id])
  assignedByUser       User?             @relation("AssignedBy", fields: [assignedBy], references: [id])
  requestTasks         RequestTask[]
  
  @@map("service_requests")
}

model RequestTask {
  id               BigInt         @id @default(autoincrement())
  serviceRequestId BigInt         @map("service_request_id")
  taskId           BigInt         @map("task_id")
  createdAt        DateTime       @default(now()) @map("created_at")
  
  serviceRequest   ServiceRequest @relation(fields: [serviceRequestId], references: [id], onDelete: Cascade)
  
  @@unique([serviceRequestId, taskId], name: "unique_request_task")
  @@map("request_tasks")
}

model TaskTemplate {
  id                  Int              @id @default(autoincrement())
  name               String           @db.VarChar(200)
  description        String?          @db.Text
  category           String?          @db.VarChar(100)
  defaultAssigneeRole DefaultRole?    @map("default_assignee_role")
  estimatedHours     Int?             @map("estimated_hours")
  checklistItems     Json?            @map("checklist_items")
  requiredSkills     Json?            @map("required_skills")
  createdAt          DateTime         @default(now()) @map("created_at")
  updatedAt          DateTime         @updatedAt @map("updated_at")
  
  @@map("task_templates")
}

model TaskComment {
  id          BigInt   @id @default(autoincrement())
  taskId      BigInt   @map("task_id")
  userId      BigInt   @map("user_id")
  content     String   @db.Text
  attachments Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("task_comments")
}

model UserPermission {
  id             BigInt    @id @default(autoincrement())
  userId         BigInt    @map("user_id")
  permissionType String    @map("permission_type") @db.VarChar(100)
  resourceId     BigInt?   @map("resource_id")
  grantedBy      BigInt?   @map("granted_by")
  grantedAt      DateTime  @default(now()) @map("granted_at")
  expiresAt      DateTime? @map("expires_at")
  
  user           User      @relation("UserPermissions", fields: [userId], references: [id], onDelete: Cascade)
  grantedByUser  User?     @relation("GrantedBy", fields: [grantedBy], references: [id])
  
  @@index([userId, permissionType], name: "idx_user_permission")
  @@map("user_permissions")
}

enum ExpertiseLevel {
  junior
  mid
  senior
  lead
  expert
}

enum AvailabilityStatus {
  available
  busy
  offline
  on_leave
}

enum ServiceStatus {
  active
  inactive
  deprecated
}

enum Priority {
  low
  medium
  high
  urgent
}

enum RequestStatus {
  draft
  submitted
  in_review
  approved
  assigned
  in_progress
  completed
  cancelled
}

enum DefaultRole {
  team_member
  team_lead
  admin
}
```

---

## Extended API Architecture

### New API Endpoints Structure

```
src/app/api/admin/
├── service-requests/
│   ├── route.ts                    # GET list, POST create
│   ├── [id]/route.ts               # GET, PATCH, DELETE
│   ├── [id]/assign/route.ts        # POST assign to team member
│   ├── [id]/tasks/route.ts         # GET related tasks, POST create task
│   ├── [id]/comments/route.ts      # GET comments, POST comment
│   ├── [id]/status/route.ts        # PATCH status update
│   ├── bulk/route.ts               # POST bulk operations
│   ├── export/route.ts             # GET CSV export
│   └── analytics/route.ts          # GET analytics data

├── team-management/
│   ├── availability/route.ts       # GET/PATCH team availability
│   ├── skills/route.ts             # GET/POST skill management
│   ├── workload/route.ts           # GET team workload analytics
│   └── assignments/route.ts        # GET assignment history

├── task-templates/
│   ├── route.ts                    # GET list, POST create
│   ├── [id]/route.ts               # GET, PATCH, DELETE
│   └── categories/route.ts         # GET template categories

├── permissions/
│   ├── route.ts                    # GET permissions list
│   ├── [userId]/route.ts           # GET user permissions, POST grant
│   └── roles/route.ts              # GET role definitions
```

### Enhanced API Implementation Examples

#### Service Requests API
```typescript
// src/app/api/admin/service-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateServiceRequestSchema = z.object({
  clientId: z.string(),
  serviceId: z.string(),
  title: z.string().min(5).max(300),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const assignedTo = searchParams.get('assignedTo')
  
  const where = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedTo && { assignedTeamMemberId: assignedTo })
  }

  try {
    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, name: true, category: true } },
          assignedTeamMember: { select: { id: true, name: true, email: true } },
          requestTasks: { include: { task: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.serviceRequest.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Service requests fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = CreateServiceRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ...parsed.data,
        clientId: BigInt(parsed.data.clientId),
        serviceId: BigInt(parsed.data.serviceId),
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, category: true } }
      }
    })

    // Auto-assign based on service requirements and team availability
    await autoAssignRequest(serviceRequest.id)

    return NextResponse.json({
      success: true,
      data: serviceRequest
    }, { status: 201 })
  } catch (error) {
    console.error('Service request creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    )
  }
}

async function autoAssignRequest(requestId: bigint) {
  // Implementation for automatic assignment logic
  // Based on team member skills, availability, and workload
}
```

#### Team Management API
```typescript
// src/app/api/admin/team-management/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const teamMembers = await prisma.user.findMany({
      where: {
        role: { in: ['STAFF', 'TEAM_MEMBER'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        availabilityStatus: true,
        maxConcurrentProjects: true,
        assignedRequests: {
          where: {
            status: { in: ['assigned', 'in_progress'] }
          },
          select: { id: true, title: true, priority: true }
        }
      }
    })

    const teamAvailability = teamMembers.map(member => ({
      ...member,
      currentWorkload: member.assignedRequests.length,
      availabilityPercentage: Math.max(0, 
        ((member.maxConcurrentProjects || 3) - member.assignedRequests.length) / 
        (member.maxConcurrentProjects || 3) * 100
      )
    }))

    return NextResponse.json({
      success: true,
      data: teamAvailability
    })
  } catch (error) {
    console.error('Team availability fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team availability' },
      { status: 500 }
    )
  }
}
```

---

## Admin Dashboard Integration

### Enhanced Dashboard Components

```typescript
// src/app/admin/page.tsx - Updated to include service portal metrics
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceRequestsOverview } from '@/components/admin/service-requests-overview'
import { TeamWorkloadChart } from '@/components/admin/team-workload-chart'
import { RequestStatusDistribution } from '@/components/admin/request-status-distribution'

export default async function AdminDashboard() {
  // Fetch enhanced analytics including service portal data
  const [
    dashboardStats,
    serviceRequestStats,
    teamPerformance
  ] = await Promise.all([
    fetch('/api/admin/analytics'),
    fetch('/api/admin/service-requests/analytics'),
    fetch('/api/admin/team-management/workload')
  ]).then(responses => Promise.all(responses.map(r => r.json())))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceRequestStats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">
              +{serviceRequestStats.newThisWeek} from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance.utilization}%</div>
            <p className="text-xs text-muted-foreground">
              Across {teamPerformance.activeMembers} team members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceRequestStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${serviceRequestStats.pipelineValue}</div>
            <p className="text-xs text-muted-foreground">
              From pending requests
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ServiceRequestsOverview data={serviceRequestStats} />
        <TeamWorkloadChart data={teamPerformance} />
      </div>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <RequestStatusDistribution data={serviceRequestStats.statusDistribution} />
        {/* Other existing dashboard components */}
      </div>
    </div>
  )
}
```

### Service Requests Management Page

```typescript
// src/app/admin/service-requests/page.tsx
import React from 'react'
import { ServiceRequestsTable } from '@/components/admin/service-requests/table'
import { ServiceRequestsFilters } from '@/components/admin/service-requests/filters'
import { ServiceRequestsBulkActions } from '@/components/admin/service-requests/bulk-actions'

export default function ServiceRequestsPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          Create Request
        </Button>
      </div>
      
      <ServiceRequestsFilters />
      <ServiceRequestsBulkActions />
      <ServiceRequestsTable />
    </div>
  )
}
```

---

## Enhanced User Management

### Extended User Management Component

```typescript
// src/app/admin/users/page.tsx - Enhanced for service portal roles
import React from 'react'
import { useUsers } from '@/hooks/useUsers'
import { UserRoleManager } from '@/components/admin/users/role-manager'
import { TeamMemberProfile } from '@/components/admin/users/team-member-profile'

export default function UsersPage() {
  const { users, updateUser, loading } = useUsers()

  const handleRoleUpdate = async (userId: string, updates: any) => {
    await updateUser(userId, updates)
  }

  const handleSkillsUpdate = async (userId: string, skills: string[]) => {
    await updateUser(userId, { skills })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {users.map(user => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.department} - {user.position}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <UserRoleManager 
                    user={user} 
                    onUpdate={handleRoleUpdate} 
                  />
                  {['STAFF', 'TEAM_MEMBER'].includes(user.role) && (
                    <TeamMemberProfile 
                      user={user}
                      onSkillsUpdate={handleSkillsUpdate}
                    />
                  )}
                </div>
              </div>
              
              {user.role === 'STAFF' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Availability:</span>
                      <span className="ml-2">{user.availabilityStatus}</span>
                    </div>
                    <div>
                      <span className="font-medium">Active Projects:</span>
                      <span className="ml-2">{user.assignedRequests?.length || 0}</span>
                    </div>
                    <div>
                      <span className="font-medium">Skills:</span>
                      <div className="mt-1">
                        {user.skills?.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="mr-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Hourly Rate:</span>
                      <span className="ml-2">${user.hourlyRate}/hr</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Permission Management System

```typescript
// src/lib/permissions.ts - Enhanced permission system
export const PERMISSIONS = {
  // Service Request Permissions
  SERVICE_REQUESTS_CREATE: 'service_requests.create',
  SERVICE_REQUESTS_READ_ALL: 'service_requests.read.all',
  SERVICE_REQUESTS_READ_OWN: 'service_requests.read.own',
  SERVICE_REQUESTS_UPDATE: 'service_requests.update',
  SERVICE_REQUESTS_DELETE: 'service_requests.delete',
  SERVICE_REQUESTS_ASSIGN: 'service_requests.assign',
  
  // Task Permissions
  TASKS_CREATE: 'tasks.create',
  TASKS_READ_ALL: 'tasks.read.all',
  TASKS_READ_ASSIGNED: 'tasks.read.assigned',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',
  
  // Team Management
  TEAM_MANAGE: 'team.manage',
  TEAM_VIEW: 'team.view',
  
  // User Management
  USERS_MANAGE: 'users.manage',
  USERS_VIEW: 'users.view',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export'
} as const

export const ROLE_PERMISSIONS = {
  CLIENT: [
    PERMISSIONS.SERVICE_REQUESTS_CREATE,
    PERMISSIONS.SERVICE_REQUESTS_READ_OWN,
    PERMISSIONS.TASKS_READ_ASSIGNED
  ],
  STAFF: [
    PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
    PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_READ_ALL,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  ADMIN: [
    ...Object.values(PERMISSIONS) // Full access
  ]
}

export function hasPermission(userRole: string, permission: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]
  return rolePerms?.includes(permission as any) || false
}

export function checkPermissions(userRole: string, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, permission))
}
```

---

## Task Management System

### Enhanced Task Integration

```typescript
// src/app/admin/tasks/components/ServiceRequestTaskCreator.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTaskTemplates } from '@/hooks/useTaskTemplates'
import { useTeamMembers } from '@/hooks/useTeamMembers'

interface ServiceRequestTaskCreatorProps {
  serviceRequestId: string
  onTaskCreated: (task: any) => void
}

export function ServiceRequestTaskCreator({ serviceRequestId, onTaskCreated }: ServiceRequestTaskCreatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { templates, loading: templatesLoading } = useTaskTemplates()
  const { teamMembers, loading: teamLoading } = useTeamMembers()
  
  const handleCreateFromTemplate = async (templateId: string, assigneeId?: string) => {
    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          serviceRequestId,
          assigneeId
        })
      })
      
      if (response.ok) {
        const task = await response.json()
        onTaskCreated(task.data)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to create task from template:', error)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create Task from Template</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Task from Template</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4">
            {templates.map(template => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        ~{template.estimatedHours}h
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Select onValueChange={(assigneeId) => 
                      handleCreateFromTemplate(template.id, assigneeId)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers
                          .filter(member => 
                            !template.requiredSkills || 
                            template.requiredSkills.some(skill => 
                              member.skills?.includes(skill)
                            )
                          )
                          .map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Task-Service Request Integration

```typescript
// src/hooks/useServiceRequestTasks.ts
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export function useServiceRequestTasks(serviceRequestId: string) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/service-requests/${serviceRequestId}/tasks`)
      setTasks(response.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: any) => {
    try {
      const response = await apiFetch(`/api/admin/service-requests/${serviceRequestId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      })
      
      setTasks(prev => [...prev, response.data])
      return response.data
    } catch (err) {
      throw err
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await apiFetch(`/api/admin/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    if (serviceRequestId) {
      fetchTasks()
    }
  }, [serviceRequestId])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTaskStatus,
    refresh: fetchTasks
  }
}
```

---

## Real-time Features

### Enhanced Real-time System

```typescript
// src/lib/realtime-enhanced.ts
import { EventEmitter } from 'events'

interface RealtimeEvent {
  type: string
  data: any
  userId?: string
  timestamp: Date
}

class EnhancedRealtimeService extends EventEmitter {
  private connections = new Map<string, Set<ReadableStreamDefaultController>>()
  private userSubscriptions = new Map<string, Set<string>>() // userId -> event types

  subscribeToEvents(controller: ReadableStreamDefaultController, userId: string, eventTypes: string[]) {
    const connectionId = Math.random().toString(36)
    
    // Store connection
    if (!this.connections.has(connectionId)) {
      this.connections.set(connectionId, new Set())
    }
    this.connections.get(connectionId)!.add(controller)
    
    // Store user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set())
    }
    eventTypes.forEach(type => this.userSubscriptions.get(userId)!.add(type))

    return connectionId
  }

  broadcast(event: RealtimeEvent) {
    this.connections.forEach((controllers, connectionId) => {
      controllers.forEach(controller => {
        try {
          const message = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
        } catch (error) {
          console.error('Failed to send realtime event:', error)
          controllers.delete(controller)
        }
      })
    })
  }

  broadcastToUser(userId: string, event: RealtimeEvent) {
    // Implementation for user-specific broadcasts
    this.broadcast({ ...event, userId })
  }

  broadcastServiceRequestUpdate(serviceRequestId: string, data: any) {
    this.broadcast({
      type: 'service-request-updated',
      data: { serviceRequestId, ...data },
      timestamp: new Date()
    })
  }

  broadcastTaskUpdate(taskId: string, data: any) {
    this.broadcast({
      type: 'task-updated',
      data: { taskId, ...data },
      timestamp: new Date()
    })
  }

  broadcastTeamAssignment(assignmentData: any) {
    this.broadcast({
      type: 'team-assignment',
      data: assignmentData,
      timestamp: new Date()
    })
  }

  cleanup(connectionId: string) {
    this.connections.delete(connectionId)
  }
}

export const realtimeService = new EnhancedRealtimeService()
```

### Real-time API Endpoint

```typescript
// src/app/api/admin/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { realtimeService } from '@/lib/realtime-enhanced'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const eventTypes = searchParams.get('events')?.split(',') || ['all']

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`)
      )

      // Subscribe to events
      const connectionId = realtimeService.subscribeToEvents(
        controller, 
        session.user.id, 
        eventTypes
      )

      // Handle connection cleanup
      request.signal.addEventListener('abort', () => {
        realtimeService.cleanup(connectionId)
        try {
          controller.close()
        } catch (error) {
          // Connection already closed
        }
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### Client-side Real-time Hook

```typescript
// src/hooks/useRealtime.ts
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
}

export function useRealtime(eventTypes: string[] = ['all']) {
  const { data: session } = useSession()
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!session?.user) return

    const eventSource = new EventSource(
      `/api/admin/realtime?events=${eventTypes.join(',')}`
    )

    eventSource.onopen = () => {
      setConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const parsedEvent = JSON.parse(event.data)
        setEvents(prev => [...prev.slice(-99), parsedEvent]) // Keep last 100 events
      } catch (error) {
        console.error('Failed to parse realtime event:', error)
      }
    }

    eventSource.onerror = () => {
      setConnected(false)
    }

    eventSourceRef.current = eventSource

    return () => {
      eventSource.close()
      setConnected(false)
    }
  }, [session?.user, eventTypes.join(',')])

  const getEventsByType = (type: string) => {
    return events.filter(event => event.type === type)
  }

  const getLatestEvent = (type: string) => {
    const typeEvents = getEventsByType(type)
    return typeEvents[typeEvents.length - 1] || null
  }

  return {
    events,
    connected,
    getEventsByType,
    getLatestEvent
  }
}
```

---

## Security & Permissions

### Enhanced Middleware

```typescript
// middleware.ts - Enhanced for service portal
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || !['ADMIN', 'STAFF'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Service portal specific admin routes
      if (pathname.startsWith('/admin/service-requests')) {
        const hasPermission = hasServiceRequestPermission(token.role as string, 'read')
        if (!hasPermission) {
          return NextResponse.redirect(new URL('/admin', req.url))
        }
      }

      if (pathname.startsWith('/admin/team-management')) {
        const hasPermission = hasTeamManagementPermission(token.role as string)
        if (!hasPermission) {
          return NextResponse.redirect(new URL('/admin', req.url))
        }
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/admin')) {
      if (!token || !['ADMIN', 'STAFF'].includes(token.role as string)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Client portal routes
    if (pathname.startsWith('/portal')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Service requests - clients can only access their own
      if (pathname.startsWith('/portal/service-requests')) {
        // Additional client-specific validation can be added here
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public routes
        const { pathname } = req.nextUrl
        const publicRoutes = ['/', '/login', '/register', '/services', '/blog', '/contact']
        
        if (publicRoutes.some(route => pathname === route || pathname.startsWith('/api/auth'))) {
          return true
        }

        return !!token
      }
    }
  }
)

function hasServiceRequestPermission(role: string, action: string): boolean {
  const permissions = {
    ADMIN: ['read', 'create', 'update', 'delete', 'assign'],
    STAFF: ['read', 'create', 'update', 'assign'],
    CLIENT: ['read_own', 'create']
  }
  
  return permissions[role as keyof typeof permissions]?.includes(action) || false
}

function hasTeamManagementPermission(role: string): boolean {
  return ['ADMIN', 'STAFF'].includes(role)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
    '/api/admin/:path*',
    '/api/portal/:path*'
  ]
}
```

### Permission-based Component Rendering

```typescript
// src/components/PermissionGate.tsx
import React from 'react'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/permissions'

interface PermissionGateProps {
  permission: string | string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return <>{fallback}</>
  }

  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasRequiredPermission = permissions.some(p => 
    hasPermission(session.user.role, p)
  )

  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>
}

// Usage example
export function ServiceRequestActions({ requestId }: { requestId: string }) {
  return (
    <div className="flex gap-2">
      <PermissionGate permission="service_requests.update">
        <Button variant="outline">Edit</Button>
      </PermissionGate>
      
      <PermissionGate permission="service_requests.assign">
        <Button variant="outline">Assign</Button>
      </PermissionGate>
      
      <PermissionGate permission="service_requests.delete">
        <Button variant="destructive">Delete</Button>
      </PermissionGate>
    </div>
  )
}
```

---

## Implementation Strategy

### Phase 1: Database & API Foundation (Week 1-2)

```bash
# Step 1: Database Schema Migration
npx prisma migrate dev --name "add_service_portal_tables"

# Step 2: Seed Enhanced Data
npm run db:seed:service-portal

# Step 3: Create Core API Endpoints
# - /api/admin/service-requests/*
# - /api/admin/team-management/*
# - /api/admin/task-templates/*
```

#### Migration Script Example

```typescript
// prisma/migrations/add_service_portal_tables/migration.sql
-- CreateEnum for new enums
CREATE TYPE "ExpertiseLevel" AS ENUM ('junior', 'mid', 'senior', 'lead', 'expert');
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'busy', 'offline', 'on_leave');
CREATE TYPE "RequestStatus" AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- Add new columns to existing users table
ALTER TABLE "users" ADD COLUMN "employee_id" TEXT;
ALTER TABLE "users" ADD COLUMN "department" TEXT;
ALTER TABLE "users" ADD COLUMN "position" TEXT;
ALTER TABLE "users" ADD COLUMN "skills" JSONB;
ALTER TABLE "users" ADD COLUMN "expertise_level" "ExpertiseLevel" DEFAULT 'junior';
ALTER TABLE "users" ADD COLUMN "hourly_rate" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN "availability_status" "AvailabilityStatus" DEFAULT 'available';
ALTER TABLE "users" ADD COLUMN "max_concurrent_projects" INTEGER DEFAULT 3;
ALTER TABLE "users" ADD COLUMN "hire_date" DATE;
ALTER TABLE "users" ADD COLUMN "manager_id" BIGINT;

-- Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create unique index on employee_id
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- Create new tables
CREATE TABLE "service_requests" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "service_id" BIGINT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "status" "RequestStatus" NOT NULL DEFAULT 'draft',
    "budget_min" DECIMAL(10,2),
    "budget_max" DECIMAL(10,2),
    "deadline" DATE,
    "requirements" JSONB,
    "attachments" JSONB,
    "assigned_team_member_id" BIGINT,
    "assigned_at" TIMESTAMP(3),
    "assigned_by" BIGINT,
    "completed_at" TIMESTAMP(3),
    "client_approval_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- Create indexes for service_requests
CREATE UNIQUE INDEX "service_requests_uuid_key" ON "service_requests"("uuid");
CREATE INDEX "service_requests_client_id_idx" ON "service_requests"("client_id");
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");
CREATE INDEX "service_requests_assigned_team_member_id_idx" ON "service_requests"("assigned_team_member_id");

-- Add foreign key constraints
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_team_member_id_fkey" FOREIGN KEY ("assigned_team_member_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Phase 2: Admin Dashboard Integration (Week 2-3)

```typescript
// Enhanced admin dashboard pages structure
src/app/admin/
├── service-requests/
│   ├── page.tsx                    # Main service requests management
│   ├── [id]/
│   │   ├── page.tsx               # Service request details
│   │   └── edit/page.tsx          # Edit service request
│   └── new/page.tsx               # Create new service request
├── team-management/
│   ├── page.tsx                   # Team overview and management
│   ├── availability/page.tsx      # Team availability calendar
│   ├── skills/page.tsx            # Skills management
│   └── workload/page.tsx          # Workload distribution
└── task-templates/
    ├── page.tsx                   # Template management
    └── [id]/page.tsx              # Template editor
```

### Phase 3: Real-time Features & Client Portal (Week 3-4)

```typescript
// Client portal structure
src/app/portal/
├── page.tsx                       # Client dashboard
├── service-requests/
│   ├── page.tsx                   # Client's service requests
│   ├── new/page.tsx               # Create new request
│   └── [id]/page.tsx              # Request details and tracking
└── tasks/
    └── page.tsx                   # Assigned tasks view (if client has tasks)
```

### Phase 4: Testing & Optimization (Week 4)

```typescript
// Testing structure
src/tests/
├── api/
│   ├── admin/
│   │   ├── service-requests.test.ts
│   │   ├── team-management.test.ts
│   │   └── task-templates.test.ts
│   └── portal/
│       └── service-requests.test.ts
├── components/
│   ├── admin/
│   │   ├── ServiceRequestsTable.test.tsx
│   │   ├── TeamWorkloadChart.test.tsx
│   │   └── TaskTemplateEditor.test.tsx
│   └── portal/
│       └── RequestTracker.test.tsx
└── hooks/
    ├── useServiceRequests.test.ts
    ├── useTeamManagement.test.ts
    └── useRealtime.test.ts
```

---

## Migration from Existing System

### Data Migration Strategy

```typescript
// scripts/migrate-existing-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExistingData() {
  console.log('Starting data migration...')
  
  try {
    // 1. Update existing users with new service portal roles
    await migrateUserRoles()
    
    // 2. Convert existing bookings to service requests where applicable
    await migrateBookingsToServiceRequests()
    
    // 3. Create default task templates
    await createDefaultTaskTemplates()
    
    // 4. Set up default team structure
    await setupDefaultTeamStructure()
    
    console.log('Data migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

async function migrateUserRoles() {
  // Update STAFF users to have team member capabilities
  await prisma.user.updateMany({
    where: { role: 'STAFF' },
    data: {
      availabilityStatus: 'available',
      maxConcurrentProjects: 5,
      expertiseLevel: 'mid'
    }
  })
  
  console.log('✅ User roles migrated')
}

async function migrateBookingsToServiceRequests() {
  // Convert complex bookings to service requests
  const complexBookings = await prisma.booking.findMany({
    where: {
      // Criteria for bookings that should become service requests
      OR: [
        { notes: { not: null } },
        { status: 'PENDING' }
      ]
    },
    include: { user: true, service: true }
  })
  
  for (const booking of complexBookings) {
    await prisma.serviceRequest.create({
      data: {
        clientId: booking.userId,
        serviceId: booking.serviceId,
        title: `${booking.service.name} - ${booking.user.name}`,
        description: booking.notes || '',
        status: booking.status === 'CONFIRMED' ? 'approved' : 'submitted',
        deadline: booking.date,
        priority: 'medium'
      }
    })
  }
  
  console.log(`✅ Migrated ${complexBookings.length} bookings to service requests`)
}

async function createDefaultTaskTemplates() {
  const templates = [
    {
      name: 'Tax Return Preparation',
      description: 'Complete tax return preparation for individual client',
      category: 'Tax Services',
      defaultAssigneeRole: 'team_member',
      estimatedHours: 4,
      requiredSkills: ['Tax Preparation', 'QuickBooks'],
      checklistItems: [
        'Gather client documents',
        'Enter data into tax software',
        'Review for accuracy',
        'Client review and approval',
        'File return'
      ]
    },
    {
      name: 'Bookkeeping Setup',
      description: 'Set up bookkeeping system for new business client',
      category: 'Bookkeeping',
      defaultAssigneeRole: 'team_member',
      estimatedHours: 6,
      requiredSkills: ['QuickBooks', 'Bookkeeping'],
      checklistItems: [
        'Chart of accounts setup',
        'Bank account connection',
        'Initial data entry',
        'Client training session'
      ]
    },
    {
      name: 'Financial Statement Review',
      description: 'Review and prepare financial statements',
      category: 'Financial Services',
      defaultAssigneeRole: 'team_lead',
      estimatedHours: 8,
      requiredSkills: ['Financial Analysis', 'GAAP'],
      checklistItems: [
        'Review trial balance',
        'Prepare statements',
        'Partner review',
        'Client presentation'
      ]
    }
  ]
  
  for (const template of templates) {
    await prisma.taskTemplate.create({ data: template })
  }
  
  console.log(`✅ Created ${templates.length} default task templates`)
}

async function setupDefaultTeamStructure() {
  // Set up manager relationships
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  })
  
  const staffUsers = await prisma.user.findMany({
    where: { role: 'STAFF' }
  })
  
  if (adminUsers.length > 0 && staffUsers.length > 0) {
    // Assign first admin as manager for staff
    await prisma.user.updateMany({
      where: { role: 'STAFF' },
      data: { managerId: adminUsers[0].id }
    })
    
    console.log('✅ Default team structure established')
  }
}

// Run migration
if (require.main === module) {
  migrateExistingData()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
```

### Deployment Checklist

```markdown
## Pre-deployment Checklist

### Database
- [ ] Run database migrations in staging
- [ ] Test data migration script
- [ ] Verify existing data integrity
- [ ] Create database backups

### API Testing
- [ ] Test all new API endpoints
- [ ] Verify permission systems
- [ ] Load test real-time features
- [ ] Test error handling

### UI/UX
- [ ] Test admin dashboard integration
- [ ] Verify responsive design
- [ ] Test accessibility features
- [ ] Browser compatibility testing

### Security
- [ ] Review permission implementations
- [ ] Test authentication flows
- [ ] Validate input sanitization
- [ ] Security audit of new endpoints

### Performance
- [ ] Database query optimization
- [ ] Real-time connection limits
- [ ] Caching strategy verification
- [ ] CDN configuration for assets

### Monitoring
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Real-time connection monitoring
- [ ] Database performance tracking
```

---

the service portal seamlessly with the existing accounting firm platform architecture. By leveraging the established Next.js 14 App Router structure, Prisma ORM patterns, and NextAuth.js authentication system, this enhancement extends the current platform's capabilities while maintaining consistency and security standards.

### Key Integration Benefits

**Architectural Consistency**: The service portal follows the same patterns established in the existing admin dashboard, using similar API structures at `/api/admin/*`, consistent component organization, and the same state management approaches.

**Database Evolution**: Rather than creating a separate system, the enhanced schema extends existing models (users, services) and adds complementary tables that integrate naturally with current booking and user management systems.

**Security Continuity**: The enhanced permission system builds upon the existing role-based access control, extending it with granular service portal permissions while maintaining the same authentication flow.

**UI/UX Harmony**: New admin pages follow the established design patterns using the same shadcn/ui components, maintaining visual consistency while adding powerful new functionality.

### Implementation Advantages

**Minimal Disruption**: The phased approach allows for gradual rollout without affecting existing functionality. Current users and workflows remain unchanged while new capabilities are added.

**Data Migration**: Existing bookings can be seamlessly converted to service requests where appropriate, preserving historical data and client relationships.

**Team Onboarding**: Staff familiar with the current admin interface will find the new service portal features intuitive, reducing training time.

**Scalability**: The enhanced architecture supports growth from simple task assignment to complex project management while maintaining performance.

### Technical Highlights

**Real-time Capabilities**: Server-sent events integration provides live updates for service requests and task assignments without requiring external services.

**Enhanced Task Management**: Building on the existing task system with templates, bulk operations, and service request integration creates a comprehensive workflow management solution.

**Advanced Analytics**: New dashboard metrics complement existing analytics, providing deeper insights into team performance and service delivery.

**Multi-tenant Ready**: The permission system and data structure support multiple client workspaces and team hierarchies.

This implementation represents a natural evolution of the existing platform, transforming a solid accounting firm management system into a comprehensive professional services portal. The careful alignment with existing patterns ensures maintainability while the enhanced features provide significant business value through improved workflow management, team collaboration, and client service delivery.

The guide provides a complete roadmap for implementation, from database migrations to deployment strategies, ensuring a smooth transition that enhances rather than disrupts the current successful platform.