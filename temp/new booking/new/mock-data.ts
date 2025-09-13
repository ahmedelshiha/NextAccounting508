// utils/mock-data.ts
import { Client, Service, Staff, BookingDetail } from '@/types'

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+20123456789',
    company: 'Hassan Trading Co.',
    tier: 'smb',
    address: '123 Main St, Cairo, Egypt',
    totalBookings: 8,
    lastBooking: '2025-08-15',
    preferredTime: '10:00',
    isActive: true,
    totalSpent: 2400,
    averageRating: 4.8,
    riskLevel: 'low',
    tags: ['reliable', 'frequent', 'trading'],
    notes: 'Prefers morning appointments, always punctual'
  },
  {
    id: 'client-2',
    name: 'Sarah Mohamed',
    email: 'sarah.mohamed@techsolutions.com',
    phone: '+20987654321',
    company: 'Tech Solutions Ltd.',
    tier: 'enterprise',
    address: '456 Business District, New Cairo',
    totalBookings: 15,
    lastBooking: '2025-09-01',
    preferredTime: '14:00',
    isActive: true,
    totalSpent: 7500,
    averageRating: 4.9,
    riskLevel: 'low',
    tags: ['enterprise', 'tech', 'priority', 'complex'],
    notes: 'Large enterprise client, requires detailed reporting'
  },
  {
    id: 'client-3',
    name: 'Mohamed Ali',
    email: 'mohamed.ali@gmail.com',
    phone: '+20555666777',
    tier: 'individual',
    address: '789 Residential Area, Alexandria',
    totalBookings: 3,
    lastBooking: '2025-07-20',
    isActive: true,
    totalSpent: 450,
    averageRating: 4.5,
    riskLevel: 'medium',
    tags: ['new', 'individual', 'potential'],
    notes: 'New client, still building relationship'
  },
  {
    id: 'client-4',
    name: 'Fatma Ibrahim',
    email: 'fatma.ibrahim@consultancy.com',
    phone: '+20444555666',
    company: 'Ibrahim Consultancy',
    tier: 'smb',
    address: '321 Professional Plaza, Giza',
    totalBookings: 12,
    lastBooking: '2025-08-28',
    preferredTime: '11:00',
    isActive: true,
    totalSpent: 3600,
    averageRating: 4.7,
    riskLevel: 'low',
    tags: ['consultancy', 'regular', 'referrer'],
    notes: 'Excellent referral source, values quality service'
  },
  {
    id: 'client-5',
    name: 'Omar Khaled',
    email: 'omar@startupventure.com',
    phone: '+20333444555',
    company: 'StartupVenture Inc.',
    tier: 'smb',
    address: '654 Innovation Hub, Sheikh Zayed',
    totalBookings: 6,
    lastBooking: '2025-08-10',
    preferredTime: '15:30',
    isActive: true,
    totalSpent: 1800,
    averageRating: 4.6,
    riskLevel: 'medium',
    tags: ['startup', 'growing', 'tech'],
    notes: 'Fast-growing startup, needs scalable solutions'
  }
]

export const mockServices: Service[] = [
  {
    id: 'service-1',
    name: 'Individual Tax Consultation',
    description: 'Comprehensive personal tax planning and filing assistance with expert guidance on deductions and compliance.',
    category: 'tax',
    duration: 60,
    price: 150,
    estimatedHours: 1,
    requirements: [
      'Previous year tax returns',
      'Current year income statements',
      'Receipts for deductible expenses',
      'Valid government ID'
    ],
    deliverables: [
      'Complete tax return preparation',
      'Tax planning recommendations',
      'Deduction optimization analysis',
      'Filing confirmation receipt'
    ],
    prerequisites: ['Valid identification', 'Previous tax documents'],
    isPopular: true,
    complexity: 'basic',
    tags: ['personal', 'tax-filing', 'deductions', 'individual'],
    rating: 4.8,
    completedCount: 250
  },
  {
    id: 'service-2',
    name: 'Corporate Tax Planning',
    description: 'Strategic tax planning for businesses with comprehensive compliance review and optimization strategies.',
    category: 'tax',
    duration: 120,
    price: 350,
    estimatedHours: 2,
    requirements: [
      'Corporate financial statements',
      'Previous tax filings',
      'Business registration documents',
      'Expense records and receipts'
    ],
    deliverables: [
      'Comprehensive tax strategy document',
      'Compliance checklist and timeline',
      'Tax savings projections',
      'Implementation roadmap'
    ],
    prerequisites: ['Active business registration', 'Financial record access'],
    isPopular: true,
    complexity: 'advanced',
    tags: ['business', 'corporate', 'strategy', 'compliance'],
    rating: 4.9,
    completedCount: 180
  },
  {
    id: 'service-3',
    name: 'Quarterly Business Review',
    description: 'Comprehensive quarterly financial analysis with performance insights and strategic recommendations.',
    category: 'audit',
    duration: 180,
    price: 500,
    estimatedHours: 3,
    requirements: [
      'Quarterly financial statements',
      'Bank statements for the period',
      'Transaction records',
      'Previous quarter comparison data'
    ],
    deliverables: [
      'Detailed financial analysis report',
      'KPI performance dashboard',
      'Growth opportunity recommendations',
      'Risk assessment summary'
    ],
    prerequisites: ['Access to financial systems', 'Management team availability'],
    isPopular: false,
    complexity: 'advanced',
    tags: ['quarterly', 'analysis', 'kpi', 'performance'],
    rating: 4.7,
    completedCount: 95
  },
  {
    id: 'service-4',
    name: 'Bookkeeping Setup & Training',
    description: 'Complete bookkeeping system setup with comprehensive staff training and process documentation.',
    category: 'bookkeeping',
    duration: 90,
    price: 200,
    estimatedHours: 1.5,
    requirements: [
      'Business registration documents',
      'Bank account details and statements',
      'Sample transaction history',
      'Chart of accounts (if existing)'
    ],
    deliverables: [
      'Complete bookkeeping system setup',
      'Staff training sessions (2-3 hours)',
      'Process documentation and procedures',
      'Ongoing support guidelines'
    ],
    prerequisites: ['Administrative system access', 'Staff availability for training'],
    isPopular: true,
    complexity: 'intermediate',
    tags: ['setup', 'training', 'systems', 'bookkeeping'],
    rating: 4.6,
    completedCount: 120
  },
  {
    id: 'service-5',
    name: 'Financial Advisory Session',
    description: 'Strategic financial planning and investment advisory with personalized recommendations.',
    category: 'advisory',
    duration: 90,
    price: 275,
    estimatedHours: 1.5,
    requirements: [
      'Current financial statements',
      'Investment portfolio details',
      'Financial goals documentation',
      'Risk tolerance assessment'
    ],
    deliverables: [
      'Personalized financial strategy',
      'Investment recommendations',
      'Risk management plan',
      'Action timeline'
    ],
    prerequisites: ['Financial disclosure forms', 'Goal clarification meeting'],
    isPopular: true,
    complexity: 'intermediate',
    tags: ['advisory', 'planning', 'investment', 'strategy'],
    rating: 4.8,
    completedCount: 165
  },
  {
    id: 'service-6',
    name: 'Compliance Audit',
    description: 'Comprehensive regulatory compliance review with detailed findings and remediation plan.',
    category: 'audit',
    duration: 240,
    price: 750,
    estimatedHours: 4,
    requirements: [
      'Complete financial records',
      'Regulatory documentation',
      'Internal control procedures',
      'Previous audit reports'
    ],
    deliverables: [
      'Compliance audit report',
      'Findings and recommendations',
      'Remediation action plan',
      'Follow-up schedule'
    ],
    prerequisites: ['Management letter of engagement', 'Record access permissions'],
    isPopular: false,
    complexity: 'advanced',
    tags: ['audit', 'compliance', 'regulatory', 'review'],
    rating: 4.9,
    completedCount: 45
  }
]

export const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'John Smith',
    role: 'Senior Tax Advisor',
    email: 'john.smith@firm.com',
    avatar: '/avatars/john-smith.jpg',
    specialties: ['Corporate Tax', 'International Tax', 'Tax Planning', 'Compliance'],
    isAvailable: true,
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    department: 'tax',
    rating: 4.9,
    completedBookings: 340,
    expertise: ['Advanced Tax Planning', 'International Compliance', 'Corporate Restructuring'],
    hourlyRate: 250,
    languages: ['English', 'Arabic', 'French']
  },
  {
    id: 'staff-2',
    name: 'Jane Doe',
    role: 'Audit Manager',
    email: 'jane.doe@firm.com',
    avatar: '/avatars/jane-doe.jpg',
    specialties: ['Financial Audit', 'Compliance Review', 'Risk Assessment', 'Internal Controls'],
    isAvailable: true,
    workingHours: {
      start: '08:30',
      end: '16:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    department: 'audit',
    rating: 4.8,
    completedBookings: 280,
    expertise: ['SOX Compliance', 'Financial Analysis', 'Risk Management'],
    hourlyRate: 200,
    languages: ['English', 'French', 'Spanish']
  },
  {
    id: 'staff-3',
    name: 'Robert Johnson',
    role: 'Business Consultant',
    email: 'robert.johnson@firm.com',
    avatar: '/avatars/robert-johnson.jpg',
    specialties: ['Business Strategy', 'Financial Planning', 'Growth Advisory', 'Market Analysis'],
    isAvailable: false,
    workingHours: {
      start: '10:00',
      end: '18:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    department: 'consulting',
    rating: 4.7,
    completedBookings: 195,
    expertise: ['Strategic Planning', 'Market Analysis', 'Business Development'],
    hourlyRate: 300,
    languages: ['English', 'Spanish', 'German']
  },
  {
    id: 'staff-4',
    name: 'Lisa Rodriguez',
    role: 'Financial Advisor',
    email: 'lisa.rodriguez@firm.com',
    avatar: '/avatars/lisa-rodriguez.jpg',
    specialties: ['Investment Planning', 'Portfolio Management', 'Retirement Planning', 'Risk Management'],
    isAvailable: true,
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    department: 'advisory',
    rating: 4.8,
    completedBookings: 220,
    expertise: ['Investment Strategy', 'Portfolio Optimization', 'Wealth Management'],
    hourlyRate: 275,
    languages: ['English', 'Spanish', 'Portuguese']
  },
  {
    id: 'staff-5',
    name: 'Mike Chen',
    role: 'Bookkeeping Specialist',
    email: 'mike.chen@firm.com',
    avatar: '/avatars/mike-chen.jpg',
    specialties: ['QuickBooks', 'Payroll Processing', 'Accounts Reconciliation', 'Financial Reporting'],
    isAvailable: true,
    workingHours: {
      start: '08:00',
      end: '16:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    department: 'bookkeeping',
    rating: 4.6,
    completedBookings: 310,
    expertise: ['System Implementation', 'Process Automation', 'Data Analysis'],
    hourlyRate: 150,
    languages: ['English', 'Mandarin', 'Cantonese']
  }
]

export const mockBookings: BookingDetail[] = [
  {
    id: 'booking-1',
    clientId: 'client-1',
    serviceId: 'service-1',
    status: 'CONFIRMED',
    scheduledAt: '2025-01-15T10:00:00Z',
    duration: 60,
    notes: 'Client requested morning appointment, needs help with personal tax planning',
    adminNotes: JSON.stringify([
      {
        id: 1,
        text: 'Initial booking created, client is returning customer',
        createdAt: '2025-01-10T09:00:00Z',
        createdBy: 'admin@company.com',
        userName: 'Admin User',
        category: 'general',
        priority: 'normal'
      },
      {
        id: 2,
        text: 'Client confirmed availability, all documents ready',
        createdAt: '2025-01-12T14:30:00Z',
        createdBy: 'john.smith@firm.com',
        userName: 'John Smith',
        category: 'follow-up',
        priority: 'normal'
      }
    ]),
    clientName: 'Ahmed Hassan',
    clientEmail: 'ahmed.hassan@email.com',
    clientPhone: '+20123456789',
    confirmed: true,
    reminderSent: true,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-12T14:30:00Z',
    assignedTeamMember: {
      id: 'staff-1',
      name: 'John Smith',
      email: 'john.smith@firm.com'
    },
    service: {
      id: 'service-1',
      name: 'Individual Tax Consultation',
      price: 150,
      duration: 60,
      category: 'tax',
      slug: 'individual-tax-consultation'
    },
    client: {
      id: 'client-1',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      phone: '+20123456789',
      _count: { bookings: 8 }
    },
    location: 'office',
    priority: 'normal',
    paymentStatus: 'paid',
    projectCode: 'TAX-2025-001',
    department: 'tax',
    billingCode: 'TC-150'
  },
  {
    id: 'booking-2',
    clientId: 'client-2',
    serviceId: 'service-2',
    status: 'PENDING',
    scheduledAt: '2025-01-18T14:00:00Z',
    duration: 120,
    notes: 'Enterprise client needs comprehensive corporate tax strategy review',
    adminNotes: JSON.stringify([
      {
        id: 3,
        text: 'High-value enterprise client, ensure senior staff assignment',
        createdAt: '2025-01-11T11:00:00Z',
        createdBy: 'manager@company.com',
        userName: 'Operations Manager',
        category: 'general',
        priority: 'high'
      }
    ]),
    clientName: 'Sarah Mohamed',
    clientEmail: 'sarah.mohamed@techsolutions.com',
    clientPhone: '+20987654321',
    confirmed: false,
    reminderSent: false,
    createdAt: '2025-01-11T11:00:00Z',
    updatedAt: '2025-01-11T11:00:00Z',
    assignedTeamMember: {
      id: 'staff-1',
      name: 'John Smith',
      email: 'john.smith@firm.com'
    },
    service: {
      id: 'service-2',
      name: 'Corporate Tax Planning',
      price: 350,
      duration: 120,
      category: 'tax',
      slug: 'corporate-tax-planning'
    },
    client: {
      id: 'client-2',
      name: 'Sarah Mohamed',
      email: 'sarah.mohamed@techsolutions.com',
      phone: '+20987654321',
      _count: { bookings: 15 }
    },
    location: 'remote',
    meetingLink: 'https://zoom.us/j/123456789',
    priority: 'high',
    paymentStatus: 'pending',
    projectCode: 'TAX-2025-002',
    department: 'tax',
    billingCode: 'CTP-350'
  },
  {
    id: 'booking-3',
    clientId: 'client-3',
    serviceId: 'service-4',
    status: 'COMPLETED',
    scheduledAt: '2025-01-12T11:00:00Z',
    duration: 90,
    notes: 'New client needs bookkeeping system setup for small business',
    adminNotes: JSON.stringify([
      {
        id: 4,
        text: 'Successful setup completed, client very satisfied',
        createdAt: '2025-01-12T13:00:00Z',
        createdBy: 'mike.chen@firm.com',
        userName: 'Mike Chen',
        category: 'general',
        priority: 'normal'
      },
      {
        id: 5,
        text: 'Follow-up training session scheduled for next week',
        createdAt: '2025-01-12T13:15:00Z',
        createdBy: 'mike.chen@firm.com',
        userName: 'Mike Chen',
        category: 'follow-up',
        priority: 'normal'
      }
    ]),
    clientName: 'Mohamed Ali',
    clientEmail: 'mohamed.ali@gmail.com',
    clientPhone: '+20555666777',
    confirmed: true,
    reminderSent: true,
    createdAt: '2025-01-08T16:00:00Z',
    updatedAt: '2025-01-12T13:15:00Z',
    assignedTeamMember: {
      id: 'staff-5',
      name: 'Mike Chen',
      email: 'mike.chen@firm.com'
    },
    service: {
      id: 'service-4',
      name: 'Bookkeeping Setup & Training',
      price: 200,
      duration: 90,
      category: 'bookkeeping',
      slug: 'bookkeeping-setup-training'
    },
    client: {
      id: 'client-3',
      name: 'Mohamed Ali',
      email: 'mohamed.ali@gmail.com',
      phone: '+20555666777',
      _count: { bookings: 3 }
    },
    location: 'client_site',
    onSiteAddress: '789 Residential Area, Alexandria, Egypt',
    priority: 'normal',
    paymentStatus: 'paid',
    projectCode: 'BK-2025-001',
    department: 'bookkeeping',
    billingCode: 'BST-200',
    recurringInfo: {
      isRecurring: true,
      pattern: 'monthly',
      nextBookingDate: '2025-02-12T11:00:00Z'
    }
  }
]