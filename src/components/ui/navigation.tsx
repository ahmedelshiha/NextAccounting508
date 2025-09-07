'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut, Settings, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

const navData: Record<string, { navigation: { name: string; href: string }[]; cta: string; signIn: string }> = {
  EN: {
    navigation: [
      { name: 'Home', href: '/en/' },
      { name: 'About', href: '/en/about' },
      { name: 'Services', href: '/en/services' },
      { name: 'Blog', href: '/en/blog' },
      { name: 'Contact', href: '/en/contact' },
    ],
    cta: 'Book Consultation',
    signIn: 'Sign In',
  },
  AR: {
    navigation: [
      { name: 'الرئيسية', href: '/ar/' },
      { name: 'حول', href: '/ar/about' },
      { name: 'الخدمات', href: '/ar/services' },
      { name: 'المدونة', href: '/ar/blog' },
      { name: 'اتصل بنا', href: '/ar/contact' },
    ],
    cta: 'احجز استشارة',
    signIn: 'تسجيل الدخول',
  },
  HI: {
    navigation: [
      { name: 'होम', href: '/hi/' },
      { name: 'हमारे बारे में', href: '/hi/about' },
      { name: 'सेवाएं', href: '/hi/services' },
      { name: 'ब्लॉग', href: '/hi/blog' },
      { name: 'संपर्क', href: '/hi/contact' },
    ],
    cta: 'परामर्श बुक करें',
    signIn: 'साइन इन',
  },
}

export function Navigation({ locale = 'EN' }: { locale?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname() || '/'
  const { data: session, status } = useSession()

  const data = navData[locale] || navData.EN

  const isActive = (href: string) => {
    if (href === '/en/' || href === '/ar/' || href === '/hi/') {
      return pathname === href || pathname === href.replace(/\/$/, '')
    }
    return pathname.startsWith(href.replace(/\/$/, ''))
  }

  const desktopNavClasses = locale === 'AR' ? 'hidden md:flex md:items-center md:space-x-8 md:flex-row-reverse' : 'hidden md:flex md:items-center md:space-x-8'
  const authGroupClasses = locale === 'AR' ? 'hidden md:flex md:items-center md:space-x-4 md:flex-row-reverse' : 'hidden md:flex md:items-center md:space-x-4'

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className={locale === 'AR' ? 'flex items-center space-x-0 md:flex-row-reverse' : 'flex items-center'}>
            <Link href={data.navigation[0].href} className={locale === 'AR' ? 'flex items-center space-x-2 md:flex-row-reverse' : 'flex items-center space-x-2'}>
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Accounting Firm
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className={desktopNavClasses}>
            {data.navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth & CTA */}
          <div className={authGroupClasses}>
            <LanguageSwitcher />
            {status === 'loading' ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <div className={locale === 'AR' ? 'flex items-center space-x-4 md:flex-row-reverse' : 'flex items-center space-x-4'}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{session?.user?.name || session?.user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale.toLowerCase()}/portal`} className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {locale === 'AR' ? 'حجوزاتي' : locale === 'HI' ? 'मेरी बुकिंग' : 'My Bookings'}
                      </Link>
                    </DropdownMenuItem>
                    {(session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') && (
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale.toLowerCase()}/admin`} className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          {locale === 'AR' ? 'لوحة المشرف' : locale === 'HI' ? 'एडमिन पैनल' : 'Admin Panel'}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="flex items-center text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {locale === 'AR' ? 'تسجيل الخروج' : locale === 'HI' ? 'साइन आउट' : 'Sign Out'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild>
                  <Link href={`/${locale.toLowerCase()}/booking`}>{data.cta}</Link>
                </Button>
              </div>
            ) : (
              <div className={locale === 'AR' ? 'flex items-center space-x-4 md:flex-row-reverse' : 'flex items-center space-x-4'}>
                <Button variant="ghost" asChild>
                  <Link href={`/${locale.toLowerCase()}/login`}>{data.signIn}</Link>
                </Button>
                <Button asChild>
                  <Link href={`/${locale.toLowerCase()}/booking`}>{data.cta}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {data.navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2">
                  <LanguageSwitcher />
                </div>
                {session ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {locale === 'AR' ? 'مسجل الدخول باسم ' : locale === 'HI' ? 'Signed in as ' : 'Signed in as '}{session?.user?.name || session?.user?.email}
                    </div>
                    <Link
                      href={`/${locale.toLowerCase()}/portal`}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {locale === 'AR' ? 'حجوزاتي' : locale === 'HI' ? '���ेरी बुकिंग' : 'My Bookings'}
                    </Link>
                    {(session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') && (
                      <Link
                        href={`/${locale.toLowerCase()}/admin`}
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {locale === 'AR' ? 'لوحة المشرف' : locale === 'HI' ? 'एडमिन पैनल' : 'Admin Panel'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                    >
                      {locale === 'AR' ? 'تسجيل الخروج' : locale === 'HI' ? 'साइन आउट' : 'Sign Out'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/${locale.toLowerCase()}/login`}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {data.signIn}
                    </Link>
                    <Link
                      href={`/${locale.toLowerCase()}/register`}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {locale === 'AR' ? 'اشتراك' : locale === 'HI' ? 'साइन अप' : 'Sign Up'}
                    </Link>
                  </div>
                )}
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/${locale.toLowerCase()}/booking`} onClick={() => setMobileMenuOpen(false)}>
                      {data.cta}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
