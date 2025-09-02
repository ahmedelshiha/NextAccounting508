# Accounting Firm - Professional Business Management Platform

A comprehensive, full-stack Next.js application designed for accounting firms to manage client relationships, bookings, services, and content. Built with modern technologies and best practices for scalability, security, and user experience.

## 🚀 Features

### Core Functionality
- **Client Portal**: Secure dashboard for clients to manage appointments and view services
- **Booking System**: Complete appointment scheduling with calendar integration
- **Service Management**: Dynamic service catalog with pricing and descriptions
- **Blog Platform**: Content management system with SEO optimization
- **Contact System**: Professional contact forms with email notifications
- **Newsletter**: Subscription management with automated email campaigns

### Administrative Features
- **Admin Dashboard**: Comprehensive analytics and system overview
- **User Management**: Role-based access control (Admin, Staff, Client)
- **Booking Management**: Full CRUD operations with bulk actions
- **Content Management**: Blog post creation and management
- **Email System**: Automated notifications and reminders
- **Analytics**: Revenue tracking, user statistics, and growth metrics

### Technical Features
- **Internationalization**: Multi-language support (English, Arabic RTL, Hindi)
- **Authentication**: Secure NextAuth.js implementation with role-based access
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Email Integration**: SendGrid integration with fallback logging
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **API Architecture**: RESTful APIs with comprehensive error handling
- **Scheduled Tasks**: Automated reminders and maintenance operations

## 🛠 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Lucide Icons**: Beautiful icon library

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Robust relational database
- **NextAuth.js**: Authentication and session management
- **bcryptjs**: Password hashing and security

### Services & Integrations
- **SendGrid**: Email delivery service
- **Vercel**: Deployment and hosting platform
- **Supabase**: Database hosting (alternative to PostgreSQL)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database (local or hosted)
- **Git** for version control

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd accounting-firm
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/accounting_firm"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Email Configuration (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Cron Job Security
CRON_SECRET="your-cron-secret-key"

# Optional: Supabase (alternative to PostgreSQL)
# DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
```

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database named `accounting_firm`
3. Update the `DATABASE_URL` in your `.env.local` file

#### Option B: Supabase (Recommended for deployment)

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Copy the database URL from your project settings
4. Update the `DATABASE_URL` in your `.env.local` file

### 5. Database Migration and Seeding

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with sample data
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🔐 Default Accounts

The seeding process creates the following demo accounts for testing:

### Admin Account
- **Email**: admin@accountingfirm.com
- **Password**: admin123
- **Role**: ADMIN

### Staff Account
- **Email**: staff@accountingfirm.com
- **Password**: staff123
- **Role**: STAFF

### Client Account
- **Email**: client@example.com
- **Password**: client123
- **Role**: CLIENT

## 📁 Project Structure

```
accounting-firm/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   ├── api/               # API routes
│   │   ├── blog/              # Blog pages
│   │   ├── booking/           # Booking system
│   │   ├── contact/           # Contact page
│   │   ├── login/             # Authentication pages
│   │   ├── portal/            # Client portal
│   │   └── services/          # Services pages
│   ├── components/            # Reusable React components
│   │   ├── home/              # Home page components
│   │   ├── providers/         # Context providers
│   │   └── ui/                # UI components (shadcn/ui)
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── email.ts           # Email utilities
│   │   ├── i18n.ts            # Internationalization
│   │   └── prisma.ts          # Database client
│   ├── locales/               # Translation files
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding script
├── public/                    # Static assets
└── package.json               # Project dependencies
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Prepare for Deployment**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Configure Environment Variables**
   
   In your Vercel dashboard, add the following environment variables:
   
   ```
   DATABASE_URL=your-production-database-url
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-production-secret
   SENDGRID_API_KEY=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com
   CRON_SECRET=your-production-cron-secret
   ```

4. **Database Migration**
   
   After deployment, run the database migration:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Manual Deployment

For other hosting providers:

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Set Environment Variables**
   Configure all required environment variables on your hosting platform

3. **Deploy Static Files**
   Upload the `.next` folder and other necessary files to your hosting provider

4. **Configure Database**
   Ensure your production database is accessible and run migrations

## 📧 Email Configuration

### SendGrid Setup

1. **Create SendGrid Account**
   - Sign up at [SendGrid](https://sendgrid.com)
   - Verify your account and domain

2. **Generate API Key**
   - Go to Settings > API Keys
   - Create a new API key with full access
   - Copy the API key to your environment variables

3. **Configure Sender Identity**
   - Set up sender authentication
   - Verify your sending domain or email address

### Email Features

The application includes the following email functionalities:

- **Booking Confirmations**: Automatic emails with calendar attachments
- **Booking Reminders**: 24-hour advance reminders
- **Newsletter Subscriptions**: Welcome emails and unsubscribe handling
- **Contact Form**: Confirmation and notification emails
- **Admin Notifications**: System alerts and reports

## 🔄 Scheduled Tasks

The application includes automated tasks for maintenance and user engagement:

### Cron Jobs

Set up the following cron jobs on your hosting platform:

```bash
# Daily at 9 AM - Send booking reminders
0 9 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron -d '{"task":"booking-reminders"}'

# Daily at midnight - Update booking statuses
0 0 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron -d '{"task":"booking-statuses"}'

# Weekly on Sundays - Cleanup old data
0 0 * * 0 curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron -d '{"task":"cleanup"}'

# Monthly on 1st - Generate reports
0 0 1 * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron -d '{"task":"monthly-report"}'
```

### Vercel Cron Jobs

For Vercel deployments, you can use Vercel Cron Jobs:

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 🌍 Internationalization

The application supports multiple languages with proper RTL support:

### Supported Languages
- **English** (en) - Default language
- **Arabic** (ar) - Right-to-left support
- **Hindi** (hi) - Devanagari script support

### Adding New Languages

1. **Create Translation File**
   ```bash
   # Create new locale file
   touch src/locales/fr.json
   ```

2. **Add Translations**
   Copy the structure from `en.json` and translate all keys

3. **Update Configuration**
   Add the new locale to `src/lib/i18n.ts`:
   ```typescript
   export const locales = ['en', 'ar', 'hi', 'fr'] as const
   ```

4. **Configure Locale Settings**
   Add locale configuration in the `localeConfig` object

## 🔒 Security Features

### Authentication & Authorization
- **Role-based Access Control**: Admin, Staff, and Client roles
- **Secure Password Hashing**: bcrypt implementation
- **Session Management**: NextAuth.js with secure cookies
- **Protected Routes**: Middleware-based route protection

### Data Security
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **CSRF Protection**: Built-in Next.js protection
- **Environment Variables**: Secure configuration management

### API Security
- **Rate Limiting**: Built-in protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Error Handling**: Secure error messages without data leakage
- **Authentication Tokens**: Secure API access control

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── __mocks__/             # Mock implementations
├── api/                   # API endpoint tests
├── components/            # Component tests
├── pages/                 # Page tests
└── utils/                 # Utility function tests
```

## 📊 Monitoring & Analytics

### Built-in Analytics
- **User Registration Trends**: Track new user signups
- **Booking Analytics**: Revenue and appointment metrics
- **Content Performance**: Blog post engagement
- **System Health**: Database and service monitoring

### External Integrations
- **Google Analytics**: Add GA4 tracking code
- **Sentry**: Error monitoring and performance tracking
- **Vercel Analytics**: Built-in performance monitoring

## 🔧 Customization

### Branding
1. **Logo**: Replace logo files in `public/` directory
2. **Colors**: Update Tailwind configuration in `tailwind.config.js`
3. **Typography**: Modify font settings in the configuration
4. **Content**: Update text content in translation files

### Services
1. **Add New Services**: Use the admin panel or directly modify the database
2. **Pricing**: Configure service pricing through the admin interface
3. **Categories**: Extend the service model to include categories

### Email Templates
1. **Customize Templates**: Modify email templates in `src/lib/email.ts`
2. **Branding**: Add your company branding to email templates
3. **Content**: Update email content for your business needs

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Email Not Sending
1. Verify SendGrid API key is correct
2. Check sender authentication setup
3. Review email logs in the application

#### Authentication Issues
1. Verify NEXTAUTH_SECRET is set
2. Check NEXTAUTH_URL matches your domain
3. Clear browser cookies and try again

### Getting Help

1. **Documentation**: Check this README and inline code comments
2. **Issues**: Create an issue in the repository
3. **Community**: Join our Discord community for support
4. **Professional Support**: Contact us for enterprise support

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

### Development Workflow

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📞 Support

For support and questions:

- **Email**: support@accountingfirm.com
- **Documentation**: [docs.accountingfirm.com](https://docs.accountingfirm.com)
- **Community**: [Discord Server](https://discord.gg/accountingfirm)
- **Issues**: [GitHub Issues](https://github.com/your-repo/accounting-firm/issues)

---

**Built with ❤️ by the Accounting Firm Team**

*Professional accounting software for modern businesses*
