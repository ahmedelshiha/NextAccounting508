import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function genPasswordFromEnv(envName: string) {
  const env = process.env[envName]
  if (env && env.trim().length > 0) return env
  const generated = crypto.randomBytes(6).toString('hex')
  console.warn(`Warning: ${envName} not set, generated temporary password: ${generated}`)
  return generated
}

async function main() {
  console.log('🌱 Starting seed...')

  const SEED_FAIL_FAST = process.env.SEED_FAIL_FAST === 'true'

  // Purge deprecated demo users and related bookings
  await prisma.booking.deleteMany({ where: { clientEmail: 'sarah@example.com' } })
  await prisma.user.deleteMany({ where: { email: 'sarah@example.com' } })
  await prisma.booking.deleteMany({ where: { clientEmail: 'john@example.com' } })
  await prisma.user.deleteMany({ where: { email: 'john@example.com' } })

  // Passwords: prefer environment variables, otherwise generate secure random values and log them
  const adminPlain = genPasswordFromEnv('SEED_ADMIN_PASSWORD')
  const staffPlain = genPasswordFromEnv('SEED_STAFF_PASSWORD')
  const clientPlain = genPasswordFromEnv('SEED_CLIENT_PASSWORD')
  const leadPlain = genPasswordFromEnv('SEED_LEAD_PASSWORD')

  const adminPassword = await bcrypt.hash(adminPlain, 12)
  const staffPassword = await bcrypt.hash(staffPlain, 12)
  const clientPassword = await bcrypt.hash(clientPlain, 12)
  const leadPassword = await bcrypt.hash(leadPlain, 12)

  // Create users inside a transaction to ensure consistency
  const [admin, staff, client1, client2, lead] = await prisma.$transaction(async (tx) => {
    const a = await tx.user.upsert({
      where: { email: 'admin@accountingfirm.com' },
      update: {},
      create: {
        email: 'admin@accountingfirm.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })

    const s = await tx.user.upsert({
      where: { email: 'staff@accountingfirm.com' },
      update: {},
      create: {
        email: 'staff@accountingfirm.com',
        name: 'Staff Member',
        password: staffPassword,
        role: 'TEAM_MEMBER',
        emailVerified: new Date(),
      },
    })

    const c1 = await tx.user.upsert({
      where: { email: 'client1@example.com' },
      update: {},
      create: {
        email: 'client1@example.com',
        name: 'Client One',
        password: clientPassword,
        role: 'CLIENT',
        emailVerified: new Date(),
      },
    })

    const c2 = await tx.user.upsert({
      where: { email: 'client2@example.com' },
      update: {},
      create: {
        email: 'client2@example.com',
        name: 'Client Two',
        password: clientPassword,
        role: 'CLIENT',
        emailVerified: new Date(),
      },
    })

    const l = await tx.user.upsert({
      where: { email: 'lead@accountingfirm.com' },
      update: {},
      create: {
        email: 'lead@accountingfirm.com',
        name: 'Team Lead',
        password: leadPassword,
        role: 'TEAM_LEAD',
        emailVerified: new Date(),
      },
    })

    return [a, s, c1, c2, l]
  })

  console.log('✅ Users created')

  // Create or ensure Team Members linked to staff/lead users
  let tmStaff = await prisma.teamMember.findFirst({ where: { userId: staff.id } })
  if (!tmStaff) {
    tmStaff = await prisma.teamMember.create({
      data: {
        name: staff.name || 'Staff Member',
        email: staff.email || 'staff@accountingfirm.com',
        userId: staff.id,
        title: 'Accountant',
        role: 'TEAM_MEMBER' as any,
        department: 'Operations',
        specialties: ['Bookkeeping','Payroll'],
        hourlyRate: 75,
        isAvailable: true,
        timeZone: 'UTC',
        maxConcurrentBookings: 3,
        bookingBuffer: 15,
        workingHours: {},
      },
    })
  }

  let tmLead = await prisma.teamMember.findFirst({ where: { userId: lead.id } })
  if (!tmLead) {
    tmLead = await prisma.teamMember.create({
      data: {
        name: lead.name || 'Team Lead',
        email: lead.email || 'lead@accountingfirm.com',
        userId: lead.id,
        title: 'Team Lead',
        role: 'TEAM_LEAD' as any,
        department: 'Advisory',
        specialties: ['Tax','CFO'],
        hourlyRate: 120,
        isAvailable: true,
        timeZone: 'UTC',
        maxConcurrentBookings: 5,
        bookingBuffer: 15,
        workingHours: {},
      },
    })
  }

  console.log('✅ Team members created')

  // Create services
  const services = [
    {
      name: 'Bookkeeping Services',
      slug: 'bookkeeping',
      description: `Our comprehensive bookkeeping services ensure your financial records are accurate, up-to-date, and compliant with regulations. We handle everything from daily transaction recording to monthly financial statements, giving you peace of mind and more time to focus on growing your business.

Our experienced bookkeepers use the latest accounting software and follow industry best practices to maintain your books. We provide detailed monthly reports, help with bank reconciliations, and ensure all your financial data is organized and accessible when you need it.`,
      shortDesc: 'Professional bookkeeping services to keep your financial records organized and up-to-date.',
      features: [
        'Daily transaction recording',
        'Monthly financial statements',
        'Bank reconciliation',
        'Accounts payable/receivable management',
        'Expense categorization',
        'QuickBooks setup and maintenance',
        'Monthly reporting and analysis',
        'Tax preparation support'
      ],
      price: 299.00,
      duration: 60,
      category: 'Bookkeeping',
      featured: true,
      active: true,
    },
    {
      name: 'Tax Preparation',
      slug: 'tax-preparation',
      description: `Maximize your tax savings with our expert tax preparation services. Our certified tax professionals stay current with the latest tax laws and regulations to ensure you receive every deduction and credit you're entitled to while remaining fully compliant.

We handle both individual and business tax returns, providing year-round tax planning advice to help minimize your tax liability. Our comprehensive approach includes tax strategy consultation, quarterly estimated tax payments, and representation in case of IRS inquiries.`,
      shortDesc: 'Expert tax preparation and planning to maximize your savings and ensure compliance.',
      features: [
        'Individual tax returns (1040)',
        'Business tax returns (1120, 1120S, 1065)',
        'Tax planning and strategy',
        'Quarterly estimated payments',
        'IRS representation',
        'Multi-state tax filing',
        'Tax amendment services',
        'Year-round tax consultation'
      ],
      price: 450.00,
      duration: 90,
      category: 'Tax',
      featured: true,
      active: true,
    },
    {
      name: 'Payroll Management',
      slug: 'payroll',
      description: `Streamline your payroll process with our comprehensive payroll management services. We handle everything from calculating wages and deductions to filing payroll taxes and providing detailed reporting, ensuring your employees are paid accurately and on time.

Our payroll services include compliance with federal, state, and local regulations, direct deposit setup, and integration with your existing accounting systems. We also provide year-end tax documents and support for payroll-related inquiries.`,
      shortDesc: 'Complete payroll management including tax filing, direct deposits, and compliance.',
      features: [
        'Bi-weekly/monthly payroll processing',
        'Direct deposit setup',
        'Payroll tax filing and payments',
        'W-2 and 1099 preparation',
        'Time tracking integration',
        'Benefits administration',
        'Compliance monitoring',
        'Employee self-service portal'
      ],
      price: 199.00,
      duration: 45,
      category: 'Payroll',
      featured: false,
      active: true,
    },
    {
      name: 'CFO Advisory Services',
      slug: 'cfo-advisory',
      description: `Get strategic financial guidance without the cost of a full-time CFO. Our advisory services provide you with expert financial leadership to help drive business growth, improve profitability, and make informed strategic decisions.

We work closely with business owners and management teams to develop financial strategies, create budgets and forecasts, analyze performance metrics, and identify opportunities for improvement. Our CFO services are scalable and can be customized to meet your specific business needs.`,
      shortDesc: 'Strategic financial guidance and CFO-level expertise for growing businesses.',
      features: [
        'Financial strategy development',
        'Budget and forecast creation',
        'Cash flow management',
        'KPI development and monitoring',
        'Financial analysis and reporting',
        'Investment and funding guidance',
        'Risk assessment and management',
        'Board presentation support'
      ],
      price: 750.00,
      duration: 120,
      category: 'Advisory',
      featured: true,
      active: true,
    },
    {
      name: 'Business Consultation',
      slug: 'business-consultation',
      description: `Get expert advice on various business and financial matters with our consultation services. Whether you're starting a new business, considering a major financial decision, or need guidance on accounting software selection, our experienced professionals are here to help.

Our consultation sessions are designed to provide you with actionable insights and recommendations tailored to your specific situation. We cover topics ranging from business structure optimization to financial process improvements.`,
      shortDesc: 'Expert business and financial consultation for specific needs and questions.',
      features: [
        'Business structure advice',
        'Accounting software selection',
        'Financial process optimization',
        'Compliance guidance',
        'Growth strategy consultation',
        'Cost reduction analysis',
        'System implementation support',
        'Custom financial solutions'
      ],
      price: 150.00,
      duration: 60,
      category: 'Consultation',
      featured: false,
      active: true,
    },
  ]

  for (const service of services) {
    // Prisma's composite unique where cannot accept null for optional fields; use findFirst instead
    const exists = await prisma.service.findFirst({ where: { slug: service.slug, tenantId: null }, select: { id: true } })
    if (!exists) {
      await prisma.service.create({ data: service as any })
    }
  }

  console.log('✅ Services created')

  // Seed sample service requests for demo clients
  const svcBookkeeping = await prisma.service.findFirst({ where: { slug: 'bookkeeping' }, select: { id: true, name: true } })
  const svcTax = await prisma.service.findFirst({ where: { slug: 'tax-preparation' }, select: { id: true, name: true } })
  if (svcBookkeeping && svcTax) {
    await prisma.serviceRequest.upsert({
      where: { id: 'sr_demo_1' },
      update: {},
      create: {
        id: 'sr_demo_1',
        clientId: client1.id,
        serviceId: svcBookkeeping.id,
        title: `${svcBookkeeping.name} request — ${client1.name}`,
        description: 'Initial bookkeeping setup and monthly processing.',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        budgetMin: 250,
        budgetMax: 500,
        deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 14),
        requirements: { serviceSnapshot: { id: svcBookkeeping.id, name: svcBookkeeping.name } },
      },
    })
    await prisma.serviceRequest.upsert({
      where: { id: 'sr_demo_2' },
      update: {},
      create: {
        id: 'sr_demo_2',
        clientId: client2.id,
        serviceId: svcTax.id,
        title: `${svcTax.name} request — ${client2.name}`,
        description: 'Corporate tax return preparation with multi-state filing.',
        priority: 'HIGH',
        status: 'IN_REVIEW',
        budgetMin: 400,
        budgetMax: 1200,
        deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
        requirements: { serviceSnapshot: { id: svcTax.id, name: svcTax.name } },
      },
    })
    console.log('✅ Sample service requests created')

    // Assign service requests and create linked demo bookings
    try {
      await prisma.serviceRequest.update({ where: { id: 'sr_demo_1' }, data: { assignedTeamMemberId: tmStaff.id, assignedBy: admin.id, assignedAt: new Date() } })
      await prisma.serviceRequest.update({ where: { id: 'sr_demo_2' }, data: { assignedTeamMemberId: tmLead.id, assignedBy: admin.id, assignedAt: new Date() } })
      const sr1 = await prisma.serviceRequest.findUnique({ where: { id: 'sr_demo_1' } })
      const sr2 = await prisma.serviceRequest.findUnique({ where: { id: 'sr_demo_2' } })

      if (svcBookkeeping && sr1) {
        const start1 = new Date(); start1.setDate(start1.getDate() + 3); start1.setHours(10,0,0,0)
        const svc1 = await prisma.service.findUnique({ where: { id: svcBookkeeping.id }, select: { duration: true } })
        await prisma.booking.upsert({
          where: { id: 'bk_demo_1' },
          update: {},
          create: {
            id: 'bk_demo_1',
            clientId: client1.id,
            serviceId: svcBookkeeping.id,
            status: 'PENDING' as any,
            scheduledAt: start1,
            duration: svc1?.duration ?? 60,
            clientName: client1.name || 'Client One',
            clientEmail: client1.email,
            assignedTeamMemberId: tmStaff.id,
            serviceRequestId: sr1.id,
            confirmed: false,
          },
        })
      }

      if (svcTax && sr2) {
        const start2 = new Date(); start2.setDate(start2.getDate() + 5); start2.setHours(14,0,0,0)
        const svc2 = await prisma.service.findUnique({ where: { id: svcTax.id }, select: { duration: true } })
        await prisma.booking.upsert({
          where: { id: 'bk_demo_2' },
          update: {},
          create: {
            id: 'bk_demo_2',
            clientId: client2.id,
            serviceId: svcTax.id,
            status: 'CONFIRMED' as any,
            scheduledAt: start2,
            duration: svc2?.duration ?? 90,
            clientName: client2.name || 'Client Two',
            clientEmail: client2.email,
            assignedTeamMemberId: tmLead.id,
            serviceRequestId: sr2.id,
            confirmed: true,
          },
        })
      }
      console.log('✅ Demo bookings created')
    } catch (e) {
      console.warn('Skipping assignments/bookings due to error:', (e as any)?.message)
      if (SEED_FAIL_FAST) {
        throw e
      }
    }
  }

  // Create blog posts
  const posts = [
    {
      title: '5 Tax Deductions Small Businesses Often Miss',
      slug: '5-tax-deductions-small-businesses-miss',
      content: `# 5 Tax Deductions Small Businesses Often Miss

Tax season can be stressful for small business owners, but it's also an opportunity to save money through legitimate deductions. Many businesses miss out on significant savings simply because they're unaware of all the deductions available to them.

## 1. Home Office Expenses

If you use part of your home exclusively for business, you may be able to deduct home office expenses. This includes a portion of your rent or mortgage, utilities, and home maintenance costs. The key word here is "exclusively" – the space must be used only for business purposes.

## 2. Business Meals

Business meals are generally 50% deductible, but during 2021 and 2022, business meals from restaurants were 100% deductible. Make sure you're taking advantage of this temporary benefit while it lasts.

## 3. Professional Development

Courses, conferences, books, and other educational materials that help you improve your business skills are deductible. This includes online courses, industry publications, and professional memberships.

## 4. Business Insurance

Most types of business insurance are deductible, including general liability, professional liability, and business property insurance. Don't forget about health insurance premiums if you're self-employed.

## 5. Equipment and Software

Computers, software, office furniture, and other business equipment can often be deducted in the year of purchase through Section 179 deduction or bonus depreciation.

Remember to keep detailed records and receipts for all business expenses. When in doubt, consult with a qualified tax professional to ensure you're maximizing your deductions while staying compliant with tax laws.`,
      excerpt: 'Discover commonly overlooked tax deductions that could save your small business money this tax season.',
      published: true,
      featured: true,
      tags: ['tax', 'deductions', 'small-business', 'savings'],
      readTime: 5,
      views: 1250,
      authorId: admin.id,
      seoTitle: '5 Tax Deductions Small Businesses Often Miss - Save Money This Tax Season',
      seoDescription: 'Learn about 5 commonly overlooked tax deductions that could save your small business thousands of dollars. Expert tips from certified accountants.',
      publishedAt: new Date('2024-01-15'),
    },
    {
      title: 'Why Every Small Business Needs Professional Bookkeeping',
      slug: 'why-small-business-needs-professional-bookkeeping',
      content: `# Why Every Small Business Needs Professional Bookkeeping

Many small business owners try to handle their own bookkeeping to save money, but this approach often costs more in the long run. Professional bookkeeping is an investment that pays dividends in accuracy, compliance, and peace of mind.

## Accuracy and Compliance

Professional bookkeepers are trained to maintain accurate records and stay current with changing regulations. They know how to properly categorize expenses, handle depreciation, and ensure your books are audit-ready.

## Time Savings

The time you spend on bookkeeping is time you're not spending on growing your business. Professional bookkeepers can handle your financial records efficiently, freeing you to focus on what you do best.

## Better Financial Insights

Professional bookkeepers don't just record transactions – they provide valuable insights into your business's financial health. Regular reports help you make informed decisions about cash flow, expenses, and growth opportunities.

## Tax Preparation Benefits

When tax season arrives, having professionally maintained books makes the process much smoother and often results in better tax outcomes. Your tax preparer will have clean, organized records to work with.

## Conclusion

Professional bookkeeping is not just an expense – it's an investment in your business's success. The accuracy, compliance, and insights provided by professional bookkeepers more than justify the cost.`,
      excerpt: 'Learn why professional bookkeeping is essential for small business success and growth.',
      published: true,
      featured: false,
      tags: ['bookkeeping', 'small-business', 'financial-management'],
      readTime: 4,
      views: 890,
      authorId: staff.id,
      seoTitle: 'Why Every Small Business Needs Professional Bookkeeping Services',
      seoDescription: 'Discover the benefits of professional bookkeeping for small businesses, including accuracy, compliance, and better financial insights.',
      publishedAt: new Date('2024-02-01'),
    },
    {
      title: 'Understanding Cash Flow Management for Small Businesses',
      slug: 'cash-flow-management-small-businesses',
      content: `# Understanding Cash Flow Management for Small Businesses

Cash flow is the lifeblood of any business, yet many small business owners struggle with managing it effectively. Understanding and controlling your cash flow is crucial for business survival and growth.

## What is Cash Flow?

Cash flow is the movement of money in and out of your business. Positive cash flow means more money is coming in than going out, while negative cash flow means the opposite.

## Common Cash Flow Challenges

- Seasonal fluctuations in revenue
- Late-paying customers
- Unexpected expenses
- Inventory management issues
- Rapid growth requiring increased working capital

## Strategies for Better Cash Flow Management

### 1. Improve Accounts Receivable
- Offer early payment discounts
- Implement stricter credit policies
- Follow up on overdue accounts promptly
- Consider factoring for immediate cash

### 2. Manage Accounts Payable
- Take advantage of payment terms
- Negotiate better terms with suppliers
- Prioritize payments strategically

### 3. Maintain Cash Reserves
- Keep 3-6 months of expenses in reserve
- Establish a line of credit before you need it
- Consider short-term financing options

## Conclusion

Effective cash flow management requires ongoing attention and planning. Regular monitoring, forecasting, and proactive management can help ensure your business has the cash it needs to operate and grow.`,
      excerpt: 'Master the fundamentals of cash flow management to keep your small business financially healthy.',
      published: true,
      featured: false,
      tags: ['cash-flow', 'financial-management', 'small-business'],
      readTime: 6,
      views: 675,
      authorId: admin.id,
      seoTitle: 'Cash Flow Management Guide for Small Businesses',
      seoDescription: 'Learn essential cash flow management strategies to keep your small business financially healthy and growing.',
      publishedAt: new Date('2024-02-15'),
    },
  ]

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    })
  }

  console.log('✅ Blog posts created')

  // Create default task templates
  const templates = [
    {
      id: 'tmpl_client_onboarding',
      name: 'Client Onboarding Checklist',
      content: 'Collect KYC documents; Set up client in CRM; Configure billing; Schedule kickoff call',
      description: 'Standard onboarding steps for new clients',
      category: 'Operations',
      defaultPriority: 'MEDIUM',
      defaultCategory: 'client',
      estimatedHours: 4,
      checklistItems: [
        'Collect KYC documents',
        'Set up client in CRM',
        'Configure billing & invoicing',
        'Schedule kickoff call'
      ],
      requiredSkills: ['Compliance','CRM'],
      defaultAssigneeRole: 'TEAM_MEMBER',
    },
    {
      id: 'tmpl_vat_return',
      name: 'Monthly VAT Return',
      content: 'Collect invoices; Reconcile transactions; Prepare VAT report; Submit return',
      description: 'Recurring VAT filing workflow',
      category: 'Compliance',
      defaultPriority: 'HIGH',
      defaultCategory: 'compliance',
      estimatedHours: 3,
      checklistItems: [
        'Collect invoices',
        'Reconcile transactions',
        'Prepare VAT report',
        'Submit return',
        'Archive documentation'
      ],
      requiredSkills: ['VAT','Bookkeeping'],
      defaultAssigneeRole: 'TEAM_MEMBER',
    },
    {
      id: 'tmpl_quarterly_audit',
      name: 'Quarterly Audit Review',
      content: 'Plan audit; Sample transactions; Draft findings; Review with client',
      description: 'Quarterly audit review steps',
      category: 'Audit',
      defaultPriority: 'MEDIUM',
      defaultCategory: 'finance',
      estimatedHours: 8,
      checklistItems: [
        'Plan audit scope',
        'Sample transactions',
        'Draft findings',
        'Review with client'
      ],
      requiredSkills: ['Audit','Risk Assessment'],
      defaultAssigneeRole: 'TEAM_LEAD',
    }
  ]

  for (const t of templates) {
    await prisma.taskTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: t as any,
    })
  }

  console.log('✅ Default task templates created')

  // Create contact submissions
  const contactSubmissions = [
    {
      name: 'Mike Wilson',
      email: 'mike@example.com',
      phone: '+1-555-0789',
      company: 'Wilson Consulting',
      subject: 'Bookkeeping Services Inquiry',
      message: 'Hi, I\'m interested in your bookkeeping services for my consulting business. Could you provide more information about pricing and what\'s included?',
      source: 'website',
      responded: false,
    },
    {
      name: 'Lisa Chen',
      email: 'lisa@techstartup.com',
      phone: '+1-555-0321',
      company: 'Tech Startup Inc',
      subject: 'CFO Advisory Services',
      message: 'We\'re a growing tech startup and need strategic financial guidance. Can we schedule a consultation to discuss your CFO advisory services?',
      source: 'google',
      responded: true,
    },
  ]

  for (const submission of contactSubmissions) {
    await prisma.contactSubmission.create({
      data: submission,
    })
  }

  console.log('✅ Contact submissions created')

  // Create newsletter subscribers
  const newsletterSubscribers = [
    {
      email: 'subscriber1@example.com',
      name: 'Alex Thompson',
      source: 'website',
    },
    {
      email: 'subscriber2@example.com',
      name: 'Maria Garcia',
      source: 'blog',
    },
    {
      email: 'subscriber3@example.com',
      source: 'social-media',
    },
  ]

  for (const subscriber of newsletterSubscribers) {
    await prisma.newsletter.upsert({
      where: { email: subscriber.email },
      update: {
        subscribed: true,
        name: subscriber.name ?? undefined,
        source: subscriber.source,
        updatedAt: new Date(),
      },
      create: {
        email: subscriber.email,
        name: subscriber.name ?? null,
        source: subscriber.source,
        subscribed: true,
      },
    })
  }

  console.log('✅ Newsletter subscribers created')

  // Seed default currencies
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, active: true, isDefault: true },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2, active: false, isDefault: false },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimals: 2, active: false, isDefault: false },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', decimals: 2, active: false, isDefault: false },
  ]

  for (const cur of currencies) {
    await prisma.currency.upsert({
      where: { code: cur.code },
      update: {
        name: cur.name,
        symbol: cur.symbol,
        decimals: cur.decimals,
        active: cur.active,
        isDefault: cur.isDefault,
        updatedAt: new Date(),
      },
      create: { code: cur.code, name: cur.name, symbol: cur.symbol ?? null, decimals: cur.decimals, active: cur.active, isDefault: cur.isDefault },
    })
  }

  // Insert a baseline USD->USD exchange rate
  await prisma.exchangeRate.upsert({
    where: { id: 1 },
    update: { rate: 1.0, source: 'seed', fetchedAt: new Date(), ttlSeconds: 86400 },
    create: { base: 'USD', target: 'USD', rate: 1.0, source: 'seed', ttlSeconds: 86400 },
  })

  console.log('✅ Currencies & baseline exchange rates created')

  // Create sample tasks with compliance requirements
  const now = new Date()
  const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
  const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7) // in 7 days

  const t1 = await prisma.task.upsert({
    where: { id: 'task_c1' },
    update: {},
    create: {
      id: 'task_c1',
      title: 'File Quarterly Compliance Report',
      description: 'Prepare and file the quarterly compliance report for client X',
      dueAt: past.toISOString(),
      priority: 'HIGH',
      status: 'OPEN',
      complianceRequired: true,
      complianceDeadline: past,
    },
  })

  const t2 = await prisma.task.upsert({
    where: { id: 'task_c2' },
    update: {},
    create: {
      id: 'task_c2',
      title: 'Submit AML Documentation',
      description: 'Collect and submit AML documents for onboarding',
      dueAt: future.toISOString(),
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      complianceRequired: true,
      complianceDeadline: future,
    },
  })

  const t3 = await prisma.task.upsert({
    where: { id: 'task_c3' },
    update: {},
    create: {
      id: 'task_c3',
      title: 'Annual Tax Compliance Review',
      description: 'Review annual tax compliance and close items',
      dueAt: future.toISOString(),
      priority: 'MEDIUM',
      status: 'OPEN',
      complianceRequired: false,
    },
  })

  // Create ComplianceRecords for tasks
  await prisma.complianceRecord.upsert({
    where: { id: 'cr_1' },
    update: {},
    create: {
      id: 'cr_1',
      taskId: t1.id,
      type: 'REPORTING',
      status: 'COMPLETED',
      dueAt: past,
      completedAt: new Date(past.getTime() + 1000 * 60 * 60 * 24 * 2), // completed 2 days after created
      riskScore: 3,
      notes: 'Filed successfully',
    },
  })

  await prisma.complianceRecord.upsert({
    where: { id: 'cr_2' },
    update: {},
    create: {
      id: 'cr_2',
      taskId: t2.id,
      type: 'KYC',
      status: 'PENDING',
      dueAt: future,
      completedAt: null,
      riskScore: 5,
      notes: 'Waiting for client documents',
    },
  })

  // Assign tasks to users and link to service requests
  try {
    await prisma.task.update({ where: { id: t1.id }, data: { assigneeId: staff.id } })
    await prisma.task.update({ where: { id: t2.id }, data: { assigneeId: staff.id } })
    await prisma.task.update({ where: { id: t3.id }, data: { assigneeId: admin.id } })

    await prisma.requestTask.upsert({ where: { unique_request_task: { serviceRequestId: 'sr_demo_1', taskId: t1.id } }, update: {}, create: { serviceRequestId: 'sr_demo_1', taskId: t1.id } })
    await prisma.requestTask.upsert({ where: { unique_request_task: { serviceRequestId: 'sr_demo_1', taskId: t2.id } }, update: {}, create: { serviceRequestId: 'sr_demo_1', taskId: t2.id } })
    await prisma.requestTask.upsert({ where: { unique_request_task: { serviceRequestId: 'sr_demo_2', taskId: t3.id } }, update: {}, create: { serviceRequestId: 'sr_demo_2', taskId: t3.id } })
  } catch {}

  console.log('✅ Sample tasks and compliance records created')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('Admin: admin@accountingfirm.com / admin123')
  console.log('Staff: staff@accountingfirm.com / staff123')
  console.log('Client 1: client1@example.com / client123')
  console.log('Client 2: client2@example.com / client123')
}

// Exported function for smoke tests
export async function runSeed() {
  return main()
}

if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e: unknown) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
