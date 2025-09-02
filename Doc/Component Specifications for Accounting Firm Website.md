# Component Specifications for Accounting Firm Website

This document provides detailed specifications for all components and pages to be built in Builder.io. Each component includes HTML structure, Tailwind CSS classes, and functionality requirements.

## 1. Header Component

### Structure:
- Logo (left-aligned)
- Navigation menu (center)
- Language switcher (right)
- Primary CTA button (right)

### HTML Structure:
```html
<header class="bg-white shadow-sm sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex-shrink-0">
        <img class="h-8 w-auto" src="[LOGO_URL]" alt="Accounting Firm Logo">
      </div>
      
      <!-- Navigation -->
      <nav class="hidden md:flex space-x-8">
        <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Home</a>
        <a href="/about" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">About</a>
        <a href="/services" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Services</a>
        <a href="/blog" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Blog</a>
        <a href="/contact" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Contact</a>
        <a href="/booking" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Booking</a>
      </nav>
      
      <!-- Language Switcher & CTA -->
      <div class="flex items-center space-x-4">
        <div class="relative">
          <select class="bg-transparent text-sm text-gray-700 border-none focus:ring-0">
            <option value="en">EN</option>
            <option value="ar">العربية</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
        <a href="/booking" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Book a Consultation
        </a>
      </div>
      
      <!-- Mobile menu button -->
      <div class="md:hidden">
        <button class="text-gray-700 hover:text-blue-600">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>
```

## 2. Footer Component

### HTML Structure:
```html
<footer class="bg-gray-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Quick Links -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
        <ul class="space-y-2">
          <li><a href="/" class="text-gray-300 hover:text-white transition-colors">Home</a></li>
          <li><a href="/about" class="text-gray-300 hover:text-white transition-colors">About</a></li>
          <li><a href="/services" class="text-gray-300 hover:text-white transition-colors">Services</a></li>
          <li><a href="/blog" class="text-gray-300 hover:text-white transition-colors">Blog</a></li>
          <li><a href="/contact" class="text-gray-300 hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      
      <!-- Services -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Services</h3>
        <ul class="space-y-2">
          <li><a href="/services/bookkeeping" class="text-gray-300 hover:text-white transition-colors">Bookkeeping</a></li>
          <li><a href="/services/taxes" class="text-gray-300 hover:text-white transition-colors">Tax Preparation</a></li>
          <li><a href="/services/payroll" class="text-gray-300 hover:text-white transition-colors">Payroll</a></li>
          <li><a href="/services/cfo-advisory" class="text-gray-300 hover:text-white transition-colors">CFO Advisory</a></li>
        </ul>
      </div>
      
      <!-- Contact Info -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Contact</h3>
        <div class="space-y-2 text-gray-300">
          <p>123 Business Street<br>Suite 100<br>City, State 12345</p>
          <p>Phone: (555) 123-4567</p>
          <p>Email: info@accountingfirm.com</p>
        </div>
        <div class="flex space-x-4 mt-4">
          <a href="#" class="text-gray-300 hover:text-white transition-colors">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <!-- Facebook icon -->
            </svg>
          </a>
          <a href="#" class="text-gray-300 hover:text-white transition-colors">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <!-- Twitter icon -->
            </svg>
          </a>
          <a href="#" class="text-gray-300 hover:text-white transition-colors">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <!-- LinkedIn icon -->
            </svg>
          </a>
        </div>
      </div>
      
      <!-- Newsletter -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Newsletter</h3>
        <p class="text-gray-300 mb-4">Stay updated with our latest insights and tips.</p>
        <form class="space-y-2">
          <input type="email" placeholder="Your email" class="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Subscribe
          </button>
        </form>
      </div>
    </div>
    
    <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
      <p>&copy; 2024 Accounting Firm. All rights reserved.</p>
    </div>
  </div>
</footer>
```

## 3. Home Page Components

### 3.1 Hero Section
```html
<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-4xl lg:text-6xl font-bold mb-6">
          Stress-free accounting for growing businesses.
        </h1>
        <p class="text-xl mb-8 text-blue-100">
          Focus on what you do best while we handle your books, taxes, and financial strategy.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <a href="/booking" class="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors text-center">
            Book Free Consultation
          </a>
          <a href="/services" class="border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white hover:text-blue-600 transition-colors text-center">
            View Services
          </a>
        </div>
      </div>
      <div>
        <img src="[HERO_IMAGE_URL]" alt="Professional team" class="rounded-lg shadow-2xl">
      </div>
    </div>
  </div>
</section>
```

### 3.2 Service Cards Section
```html
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        Our Services
      </h2>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Comprehensive accounting solutions tailored to your business needs.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- Bookkeeping Card -->
      <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
          <img src="[BOOKKEEPING_ICON_URL]" alt="Bookkeeping" class="w-8 h-8">
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Bookkeeping</h3>
        <p class="text-gray-600 mb-6">
          Keep your financial records organized and up-to-date with our professional bookkeeping services.
        </p>
        <a href="/services/bookkeeping" class="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
          Learn More →
        </a>
      </div>
      
      <!-- Tax Preparation Card -->
      <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
          <img src="[TAXES_ICON_URL]" alt="Tax Preparation" class="w-8 h-8">
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Tax Preparation</h3>
        <p class="text-gray-600 mb-6">
          Maximize your deductions and ensure compliance with our expert tax preparation services.
        </p>
        <a href="/services/taxes" class="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
          Learn More →
        </a>
      </div>
      
      <!-- Payroll Card -->
      <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
          <img src="[PAYROLL_ICON_URL]" alt="Payroll" class="w-8 h-8">
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Payroll</h3>
        <p class="text-gray-600 mb-6">
          Streamline your payroll process and ensure accurate, timely payments to your employees.
        </p>
        <a href="/services/payroll" class="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
          Learn More →
        </a>
      </div>
      
      <!-- CFO Advisory Card -->
      <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
          <img src="[CFO_ICON_URL]" alt="CFO Advisory" class="w-8 h-8">
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">CFO Advisory</h3>
        <p class="text-gray-600 mb-6">
          Strategic financial guidance to help your business grow and make informed decisions.
        </p>
        <a href="/services/cfo-advisory" class="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
          Learn More →
        </a>
      </div>
    </div>
  </div>
</section>
```

### 3.3 Trust Badges Section
```html
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">Trusted by Businesses</h2>
      <p class="text-xl text-gray-600">Over 15 years of experience serving clients</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
      <div>
        <div class="text-4xl font-bold text-blue-600 mb-2">500+</div>
        <div class="text-gray-600">Clients Served</div>
      </div>
      <div>
        <div class="text-4xl font-bold text-blue-600 mb-2">15+</div>
        <div class="text-gray-600">Years Experience</div>
      </div>
      <div>
        <div class="text-4xl font-bold text-blue-600 mb-2">CPA</div>
        <div class="text-gray-600">Certified</div>
      </div>
    </div>
  </div>
</section>
```

### 3.4 Testimonials Carousel
```html
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        What Our Clients Say
      </h2>
    </div>
    
    <div class="relative">
      <!-- Testimonial 1 -->
      <div class="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <div class="flex items-center mb-6">
          <img src="[TESTIMONIAL_IMAGE_URL]" alt="Client" class="w-16 h-16 rounded-full mr-4">
          <div>
            <h4 class="font-semibold text-gray-900">Sarah Johnson</h4>
            <p class="text-gray-600">CEO, Tech Startup</p>
          </div>
        </div>
        <blockquote class="text-lg text-gray-700 italic">
          "Working with this accounting firm has been a game-changer for our business. They've helped us streamline our finances and focus on growth."
        </blockquote>
        <div class="flex text-yellow-400 mt-4">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <!-- Repeat for 5 stars -->
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3.5 Latest Blog Posts Section
```html
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        Latest Insights
      </h2>
      <p class="text-xl text-gray-600">
        Stay informed with our latest tips and industry insights.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Blog Post 1 -->
      <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <img src="[BLOG_IMAGE_URL]" alt="Blog post" class="w-full h-48 object-cover">
        <div class="p-6">
          <div class="text-sm text-blue-600 mb-2">Tax Tips</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            5 Tax Deductions Small Businesses Often Miss
          </h3>
          <p class="text-gray-600 mb-4">
            Discover commonly overlooked tax deductions that could save your business money.
          </p>
          <a href="/blog/tax-deductions-small-business" class="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Read More →
          </a>
        </div>
      </article>
      
      <!-- Repeat for 2 more blog posts -->
    </div>
    
    <div class="text-center mt-12">
      <a href="/blog" class="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
        View All Posts
      </a>
    </div>
  </div>
</section>
```

## 4. Services Page Components

### 4.1 Services Grid
```html
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
        Our Services
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Comprehensive accounting solutions designed to help your business thrive.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Service cards with modal triggers -->
      <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onclick="openServiceModal('bookkeeping')">
        <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
          <img src="[BOOKKEEPING_ICON_URL]" alt="Bookkeeping" class="w-8 h-8">
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Bookkeeping</h3>
        <p class="text-gray-600 mb-6">
          Professional bookkeeping services to keep your financial records accurate and organized.
        </p>
        <div class="text-blue-600 font-semibold">Starting at $299/month</div>
      </div>
      
      <!-- Repeat for other services -->
    </div>
  </div>
</section>
```

### 4.2 Service Detail Modal/Drawer
```html
<div id="serviceModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
  <div class="flex items-center justify-center min-h-screen p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-900">Bookkeeping Services</h2>
          <button onclick="closeServiceModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <div class="mb-8">
              <h3 class="text-xl font-semibold mb-4">Overview</h3>
              <p class="text-gray-600">
                Our professional bookkeeping services ensure your financial records are accurate, up-to-date, and compliant with regulations.
              </p>
            </div>
            
            <div class="mb-8">
              <h3 class="text-xl font-semibold mb-4">What's Included</h3>
              <ul class="space-y-2">
                <li class="flex items-center">
                  <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Monthly financial statements
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Transaction categorization
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Bank reconciliation
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Accounts payable/receivable management
                </li>
              </ul>
            </div>
            
            <div class="mb-8">
              <h3 class="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-900">How often will you update my books?</h4>
                  <p class="text-gray-600 mt-1">We update your books monthly, with real-time access through our client portal.</p>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">What software do you use?</h4>
                  <p class="text-gray-600 mt-1">We work with QuickBooks, Xero, and other popular accounting software platforms.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div class="bg-gray-50 p-6 rounded-lg">
              <div class="text-3xl font-bold text-gray-900 mb-2">$299</div>
              <div class="text-gray-600 mb-6">per month</div>
              
              <div class="space-y-4">
                <a href="/booking?service=bookkeeping" class="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
                  Book This Service
                </a>
                <a href="/contact?service=bookkeeping" class="block w-full border border-gray-300 text-gray-700 text-center px-6 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors">
                  Ask a Question
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 5. Contact Page Components

### 5.1 Contact Form
```html
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 class="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h1>
        <p class="text-xl text-gray-600 mb-8">
          Ready to streamline your accounting? Contact us for a free consultation.
        </p>
        
        <form class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input type="text" id="name" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input type="email" id="email" name="email" required class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input type="tel" id="phone" name="phone" class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label for="company" class="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input type="text" id="company" name="company" class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
          </div>
          
          <div>
            <label for="services" class="block text-sm font-medium text-gray-700 mb-2">Services of Interest</label>
            <select multiple id="services" name="services" class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="bookkeeping">Bookkeeping</option>
              <option value="taxes">Tax Preparation</option>
              <option value="payroll">Payroll</option>
              <option value="cfo-advisory">CFO Advisory</option>
            </select>
          </div>
          
          <div>
            <label for="message" class="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea id="message" name="message" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
          </div>
          
          <button type="submit" class="w-full bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
            Send Message
          </button>
        </form>
      </div>
      
      <div>
        <div class="bg-gray-50 p-8 rounded-lg">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
          
          <div class="space-y-4">
            <div class="flex items-start">
              <svg class="w-6 h-6 text-blue-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <div>
                <h4 class="font-semibold text-gray-900">Address</h4>
                <p class="text-gray-600">123 Business Street<br>Suite 100<br>City, State 12345</p>
              </div>
            </div>
            
            <div class="flex items-start">
              <svg class="w-6 h-6 text-blue-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <div>
                <h4 class="font-semibold text-gray-900">Phone</h4>
                <p class="text-gray-600">(555) 123-4567</p>
              </div>
            </div>
            
            <div class="flex items-start">
              <svg class="w-6 h-6 text-blue-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <div>
                <h4 class="font-semibold text-gray-900">Email</h4>
                <p class="text-gray-600">info@accountingfirm.com</p>
              </div>
            </div>
            
            <div class="flex items-start">
              <svg class="w-6 h-6 text-blue-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 class="font-semibold text-gray-900">Office Hours</h4>
                <p class="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM<br>Saturday: 10:00 AM - 2:00 PM<br>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Embedded Google Map -->
        <div class="mt-8">
          <div class="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
            <p class="text-gray-500">[Embedded Google Map]</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

## 6. Blog Components

### 6.1 Blog Listing Page
```html
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
        Insights & Tips
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Stay informed with our latest accounting insights, tax tips, and business advice.
      </p>
    </div>
    
    <!-- Search and Filter -->
    <div class="mb-12">
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="relative flex-1 max-w-md">
          <input type="text" placeholder="Search articles..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">All</button>
          <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">Tax Tips</button>
          <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">Small Business</button>
          <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">Bookkeeping</button>
        </div>
      </div>
    </div>
    
    <!-- Blog Posts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Blog Post Card -->
      <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <img src="[BLOG_IMAGE_URL]" alt="Blog post" class="w-full h-48 object-cover">
        <div class="p-6">
          <div class="flex items-center mb-3">
            <span class="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">Tax Tips</span>
            <span class="text-sm text-gray-500 ml-3">March 15, 2024</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            5 Tax Deductions Small Businesses Often Miss
          </h3>
          <p class="text-gray-600 mb-4">
            Discover commonly overlooked tax deductions that could save your business money this tax season.
          </p>
          <div class="flex items-center justify-between">
            <a href="/blog/tax-deductions-small-business" class="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Read More →
            </a>
            <span class="text-sm text-gray-500">5 min read</span>
          </div>
        </div>
      </article>
      
      <!-- Repeat for more blog posts -->
    </div>
    
    <!-- Pagination -->
    <div class="mt-12 flex justify-center">
      <nav class="flex space-x-2">
        <button class="px-3 py-2 text-gray-500 hover:text-gray-700">Previous</button>
        <button class="px-3 py-2 bg-blue-600 text-white rounded">1</button>
        <button class="px-3 py-2 text-gray-700 hover:text-gray-900">2</button>
        <button class="px-3 py-2 text-gray-700 hover:text-gray-900">3</button>
        <button class="px-3 py-2 text-gray-500 hover:text-gray-700">Next</button>
      </nav>
    </div>
  </div>
</section>
```

### 6.2 Single Blog Post Template
```html
<article class="py-20 bg-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <header class="mb-12">
      <div class="flex items-center mb-4">
        <span class="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">Tax Tips</span>
        <span class="text-sm text-gray-500 ml-3">March 15, 2024</span>
        <span class="text-sm text-gray-500 ml-3">•</span>
        <span class="text-sm text-gray-500 ml-3">5 min read</span>
      </div>
      <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
        5 Tax Deductions Small Businesses Often Miss
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Discover commonly overlooked tax deductions that could save your business money this tax season.
      </p>
      <img src="[BLOG_HERO_IMAGE_URL]" alt="Blog post hero" class="w-full h-64 object-cover rounded-lg">
    </header>
    
    <!-- Content -->
    <div class="prose prose-lg max-w-none">
      <p>Tax season can be stressful for small business owners, but it's also an opportunity to save money through legitimate deductions. Many businesses miss out on significant savings simply because they're unaware of all the deductions available to them.</p>
      
      <h2>1. Home Office Expenses</h2>
      <p>If you use part of your home exclusively for business, you may be able to deduct home office expenses. This includes a portion of your rent or mortgage, utilities, and home maintenance costs.</p>
      
      <h2>2. Business Meals</h2>
      <p>Business meals are generally 50% deductible, but during 2021 and 2022, business meals from restaurants were 100% deductible. Make sure you're taking advantage of this temporary benefit.</p>
      
      <!-- Continue with more content -->
    </div>
    
    <!-- Author Box -->
    <div class="mt-12 p-6 bg-gray-50 rounded-lg">
      <div class="flex items-center">
        <img src="[AUTHOR_IMAGE_URL]" alt="Author" class="w-16 h-16 rounded-full mr-4">
        <div>
          <h4 class="font-semibold text-gray-900">John Smith, CPA</h4>
          <p class="text-gray-600">Senior Tax Advisor with over 15 years of experience helping small businesses navigate complex tax regulations.</p>
        </div>
      </div>
    </div>
    
    <!-- Related Posts -->
    <div class="mt-16">
      <h3 class="text-2xl font-bold text-gray-900 mb-8">Related Articles</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Related post cards -->
      </div>
    </div>
  </div>
</article>
```

This comprehensive specification provides the foundation for building all the required components and pages in Builder.io. Each component includes proper Tailwind CSS classes for responsive design and accessibility considerations.

