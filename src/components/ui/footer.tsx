import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navTranslations: Record<string, any> = {
  EN: {
    companyTitle: 'Accounting Firm',
    description: 'Professional accounting services for growing businesses. We help you manage your finances so you can focus on what you do best.',
    stayUpdated: 'Stay Updated',
    newsletterText: 'Get the latest tax tips and financial insights delivered to your inbox.',
    subscribe: 'Subscribe',
    copyright: `© ${new Date().getFullYear()} Accounting Firm. All rights reserved.`,
    services: [
      { name: 'Bookkeeping', href: '/en/services/bookkeeping' },
      { name: 'Tax Preparation', href: '/en/services/tax-preparation' },
      { name: 'Payroll Management', href: '/en/services/payroll' },
      { name: 'CFO Advisory', href: '/en/services/cfo-advisory' },
    ],
    company: [
      { name: 'About Us', href: '/en/about' },
      { name: 'Our Team', href: '/en/about#team' },
      { name: 'Careers', href: '/en/careers' },
      { name: 'Contact', href: '/en/contact' },
    ],
    resources: [
      { name: 'Blog', href: '/en/blog' },
      { name: 'Tax Calendar', href: '/en/resources/tax-calendar' },
      { name: 'Financial Tools', href: '/en/resources/tools' },
      { name: 'FAQ', href: '/en/faq' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/en/privacy' },
      { name: 'Terms of Service', href: '/en/terms' },
      { name: 'Cookie Policy', href: '/en/cookies' },
    ],
  },
  AR: {
    companyTitle: 'شركة المحاسبة',
    description: 'خدمات محاسبية مهنية للشركات النامية. نحن نساعدك على إدارة أموالك حتى تتمكن من التركيز على ما تفعله بشكل أفضل.',
    stayUpdated: 'ابق محدثًا',
    newsletterText: 'احصل على أحدث نصائح الضرائب والرؤى المالية مباشرة في بريدك الإلكتروني.',
    subscribe: 'اشترك',
    copyright: `© ${new Date().getFullYear()} شركة المحاسبة. جميع الحقوق محفوظة.`,
    services: [
      { name: 'مسك الدفاتر', href: '/ar/services/bookkeeping' },
      { name: 'إعداد الضرائب', href: '/ar/services/tax-preparation' },
      { name: 'كشوف المرتبات', href: '/ar/services/payroll' },
      { name: 'استشارات المدير المالي', href: '/ar/services/cfo-advisory' },
    ],
    company: [
      { name: 'معلومات عنا', href: '/ar/about' },
      { name: 'فريقنا', href: '/ar/about#team' },
      { name: 'الوظائف', href: '/ar/careers' },
      { name: 'اتصل', href: '/ar/contact' },
    ],
    resources: [
      { name: 'المدونة', href: '/ar/blog' },
      { name: 'تقويم الضرائب', href: '/ar/resources/tax-calendar' },
      { name: 'أدوات مالية', href: '/ar/resources/tools' },
      { name: 'الأسئلة الشائعة', href: '/ar/faq' },
    ],
    legal: [
      { name: 'سياسة الخصوصية', href: '/ar/privacy' },
      { name: 'شروط الخدمة', href: '/ar/terms' },
      { name: 'سياسة ملفات تعريف الارتباط', href: '/ar/cookies' },
    ],
  },
  HI: {
    companyTitle: 'Accounting Firm',
    description: 'बढ़ते व्यवसायों के लिए पेशेवर ले���ांकन सेवाएँ। हम आपकी वित्तीय स्थिति को प्रबंधित करने में मदद करते हैं ताकि आप अपने काम पर ध्यान केंद्रित कर सकें।',
    stayUpdated: 'अपडेट रहें',
    newsletterText: 'अपना ईमेल दर्ज करें और नवीनतम कर सुझाव और वित्तीय अंतर्दृष्टि प्राप्त करें।',
    subscribe: 'सब्सक्राइब',
    copyright: `© ${new Date().getFullYear()} अकाउंटिंग फर्म। सभी अधिकार सुरक्षित।`,
    services: [
      { name: 'बुककीपिंग', href: '/hi/services/bookkeeping' },
      { name: 'कर तैयारी', href: '/hi/services/tax-preparation' },
      { name: 'पेरोल', href: '/hi/services/payroll' },
      { name: 'सीएफओ सलाहकार', href: '/hi/services/cfo-advisory' },
    ],
    company: [
      { name: 'हमारे बारे में', href: '/hi/about' },
      { name: 'हमारी टीम', href: '/hi/about#team' },
      { name: 'करियर', href: '/hi/careers' },
      { name: 'संपर्क', href: '/hi/contact' },
    ],
    resources: [
      { name: 'ब्लॉग', href: '/hi/blog' },
      { name: 'टैक्स कैलेंडर', href: '/hi/resources/tax-calendar' },
      { name: 'वित्तीय उपकरण', href: '/hi/resources/tools' },
      { name: 'सामान्य प्रश्न', href: '/hi/faq' },
    ],
    legal: [
      { name: 'गोपनीयता नीति', href: '/hi/privacy' },
      { name: 'सेवा की शर्तें', href: '/hi/terms' },
      { name: 'कूकी नीति', href: '/hi/cookies' },
    ],
  },
}

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/accountingfirm',
    icon: Facebook,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/accountingfirm',
    icon: Twitter,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/accountingfirm',
    icon: Linkedin,
  },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AF</span>
                </div>
                <span className="text-xl font-bold">Accounting Firm</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Professional accounting services for growing businesses. We help you
                manage your finances so you can focus on what you do best.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">
                    123 Business Street, Suite 100<br />
                    Business City, BC 12345
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">(555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">info@accountingfirm.com</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Services
              </h3>
              <ul className="space-y-3">
                {navigation.services.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="max-w-md">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-300 mb-4">
                Get the latest tax tips and financial insights delivered to your inbox.
              </p>
              <form className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Accounting Firm. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6">
              {navigation.legal.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
