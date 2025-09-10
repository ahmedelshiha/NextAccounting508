import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import NewsletterForm from '@/components/ui/newsletter-form'

import { useTranslations } from '@/lib/i18n'

const navigationBase = {
  services: [
    { name: 'Bookkeeping', href: '/services/bookkeeping' },
    { name: 'Tax Preparation', href: '/services/tax-preparation' },
    { name: 'Payroll Management', href: '/services/payroll' },
    { name: 'CFO Advisory', href: '/services/cfo-advisory' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Our Team', href: '/about#team' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ],
  resources: [
    { name: 'Blog', href: '/blog' },
    { name: 'Tax Calendar', href: '/resources/tax-calendar' },
    { name: 'Financial Tools', href: '/resources/tools' },
    { name: 'FAQ', href: '/faq' },
  ],
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
              {/* Newsletter form wired to /api/newsletter */}
              <div>
                <NewsletterForm />
              </div>
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
