"use client"
import Link from 'next/link'
import { Phone, Mail, Linkedin, Facebook, Twitter } from 'lucide-react'

type LegalLinks = { terms?: string; privacy?: string; refund?: string }

import { useOrgSettings } from '@/components/providers/SettingsProvider'

export function OptimizedFooter({ orgName = 'Accounting Firm', orgLogoUrl, contactEmail, contactPhone, legalLinks }: { orgName?: string; orgLogoUrl?: string; contactEmail?: string; contactPhone?: string; legalLinks?: LegalLinks }) {
  // prefer centralized settings when provider present
  const ctx = useOrgSettings()
  orgName = (ctx?.settings?.name as string | undefined) ?? orgName
  orgLogoUrl = (ctx?.settings?.logoUrl as string | undefined) ?? orgLogoUrl
  contactEmail = (ctx?.settings?.contactEmail as string | undefined) ?? contactEmail
  contactPhone = (ctx?.settings?.contactPhone as string | undefined) ?? contactPhone
  legalLinks = (ctx?.settings?.legalLinks as LegalLinks | undefined) ?? legalLinks

  const initials = (orgName || 'A').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const termsHref = legalLinks?.terms || '/terms'
  const privacyHref = legalLinks?.privacy || '/privacy'
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                {orgLogoUrl ? (
                   
                  <img src={orgLogoUrl} alt={`${orgName} logo`} className="h-8 w-8 object-cover" />
                ) : (
                  <span className="text-white font-bold">{initials}</span>
                )}
              </div>
              <span className="text-xl font-bold">{orgName}</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4 max-w-sm">Professional accounting services for growing businesses since 2009. CPA certified • BBB A+ rated • 500+ happy clients.</p>
            <div className="space-y-1 text-sm">
              <a href={contactPhone ? `tel:${contactPhone}` : 'tel:+15551234567'} className="flex items-center text-gray-300 hover:text-white"><Phone className="h-4 w-4 mr-2"/>{contactPhone || '(555) 123-4567'}</a>
              <a href={contactEmail ? `mailto:${contactEmail}` : 'mailto:info@accountingfirm.com'} className="flex items-center text-gray-300 hover:text-white"><Mail className="h-4 w-4 mr-2"/>{contactEmail || 'info@accountingfirm.com'}</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services/bookkeeping" className="text-gray-400 hover:text-white transition-colors">Bookkeeping</Link></li>
              <li><Link href="/services/tax" className="text-gray-400 hover:text-white transition-colors">Tax Services</Link></li>
              <li><Link href="/services/payroll" className="text-gray-400 hover:text-white transition-colors">Payroll</Link></li>
              <li><Link href="/services/cfo" className="text-gray-400 hover:text-white transition-colors">CFO Advisory</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Stay Updated</h4>
            <form className="mb-4">
              <div className="flex">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:border-blue-500 text-white placeholder-gray-400" />
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r text-sm font-medium transition-colors">Join</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Tax tips & business insights</p>
            </form>
            <div className="flex space-x-3">
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"><Linkedin className="h-4 w-4"/></a>
              <a href="#" aria-label="Facebook" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"><Facebook className="h-4 w-4"/></a>
              <a href="#" aria-label="Twitter" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"><Twitter className="h-4 w-4"/></a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Accounting Firm. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <Link href={privacyHref} className="hover:text-white">Privacy</Link>
              <Link href={termsHref} className="hover:text-white">Terms</Link>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs">CPA Licensed in NY, CA, TX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
