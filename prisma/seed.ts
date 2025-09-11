import { PrismaClient, UserRole, BookingStatus } from '@prisma/client'
import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Starting seed...')

  // Purge deprecated demo user Sarah Johnson and related bookings
  await prisma.booking.deleteMany({ where: { clientEmail: 'sarah@example.com' } })
  await prisma.user.deleteMany({ where: { email: 'sarah@example.com' } })

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@accountingfirm.com' },
    update: {},
    create: {
      email: 'admin@accountingfirm.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  })

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@accountingfirm.com' },
    update: {},
    create: {
      email: 'staff@accountingfirm.com',
      name: 'Staff Member',
      password: staffPassword,
      role: UserRole.STAFF,
      emailVerified: new Date(),
    },
  })

  // Create client users
  const clientPassword = await bcrypt.hash('client123', 12)
  const client1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Smith',
      password: clientPassword,
      role: UserRole.CLIENT,
      emailVerified: new Date(),
    },
  })


  console.log('✅ Users created')

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
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    })
  }

  console.log('✅ Services created')

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

  // Create sample bookings
  const bookingService = await prisma.service.findFirst({ where: { slug: 'bookkeeping' } })
  const taxService = await prisma.service.findFirst({ where: { slug: 'tax-preparation' } })

  if (bookingService && taxService) {
    const bookings = [
      {
        clientId: client1.id,
        serviceId: bookingService.id,
        status: BookingStatus.CONFIRMED,
        scheduledAt: new Date('2024-03-15T10:00:00Z'),
        duration: 60,
        clientName: client1.name!,
        clientEmail: client1.email,
        clientPhone: '+1-555-0123',
        notes: 'Initial consultation for bookkeeping services',
        confirmed: true,
      },
      {
        clientId: client1.id,
        serviceId: taxService.id,
        status: BookingStatus.COMPLETED,
        scheduledAt: new Date('2024-02-10T09:00:00Z'),
        duration: 90,
        clientName: client1.name!,
        clientEmail: client1.email,
        clientPhone: '+1-555-0123',
        notes: 'Completed tax consultation',
        confirmed: true,
      },
    ]

    for (const booking of bookings) {
      await prisma.booking.create({
        data: booking,
      })
    }
  }

  console.log('✅ Sample bookings created')

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

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('Admin: admin@accountingfirm.com / admin123')
  console.log('Staff: staff@accountingfirm.com / staff123')
  console.log('Client: john@example.com / client123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e: unknown) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
