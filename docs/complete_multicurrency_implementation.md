# Complete Multi-Currency Website Implementation Guide
**Builder.io Implementation for UAE & KSA Markets**

## Table of Contents
1. [Project Overview](#project-overview)
2. [Implementation Plan](#implementation-plan)
3. [Builder.io Data Models Setup](#builderio-data-models-setup)
4. [Custom Components Development](#custom-components-development)
5. [Page Integration Guide](#page-integration-guide)
6. [Payment Gateway Integration](#payment-gateway-integration)
7. [Legal & Compliance Setup](#legal--compliance-setup)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Deployment & Launch](#deployment--launch)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Budget & Timeline](#budget--timeline)

---

## Project Overview

### Objective
Transform your USD-based accounting website to support multiple currencies and localized pricing for UAE (AED) and Saudi Arabia (SAR) markets while maintaining USD for other regions.

### Key Features
- **Automatic country detection** based on IP geolocation
- **Manual currency switching** for user preference
- **Localized pricing** with proper VAT calculations (UAE: 5%, KSA: 15%)
- **Region-specific payment methods** integration
- **Compliance-ready** VAT and legal documentation

### Technical Stack
- **Builder.io** for visual development and hosting
- **IP Geolocation API** for country detection
- **Payment Gateways**: PayFort (UAE), HyperPay/MADA (KSA), Stripe (fallback)
- **Data Storage**: Builder.io Data Models

---

## Implementation Plan

### Phase 1: Planning & Setup (Week 1-2)
- [ ] Builder.io plan verification and upgrade if needed
- [ ] Data model design and creation
- [ ] Market research for pricing strategy
- [ ] Payment gateway account setup initiation

### Phase 2: Backend Development (Week 3-5)
- [ ] Data models creation and population
- [ ] Custom components development
- [ ] Currency detection logic implementation
- [ ] Pricing calculation engine

### Phase 3: Frontend Integration (Week 6-8)
- [ ] Component integration in pages
- [ ] UI/UX optimization for multi-currency
- [ ] Mobile responsiveness testing
- [ ] Regional content customization

### Phase 4: Payment Integration (Week 9-11)
- [ ] Payment gateway integration
- [ ] Checkout flow implementation
- [ ] Payment method routing logic
- [ ] Transaction testing

### Phase 5: Compliance & Legal (Week 12-13)
- [ ] VAT registration process
- [ ] Legal documentation updates
- [ ] Invoice generation compliance
- [ ] Terms of service localization

### Phase 6: Testing & QA (Week 14-15)
- [ ] Functional testing across regions
- [ ] Payment flow testing
- [ ] Performance optimization
- [ ] User acceptance testing

### Phase 7: Launch & Monitoring (Week 16-20)
- [ ] Soft launch with gradual rollout
- [ ] Performance monitoring setup
- [ ] Analytics and tracking implementation
- [ ] Post-launch optimization

---

## Builder.io Data Models Setup

### Step 1: CountrySettings Data Model

**Navigation**: Builder.io Dashboard → Models → + New Model

**Model Configuration**:
```json
{
  "name": "CountrySettings",
  "description": "Configuration for different countries including currency, VAT, and payment methods",
  "fields": [
    {
      "name": "countryCode",
      "type": "string",
      "required": true,
      "enum": ["UAE", "KSA", "USA"],
      "description": "Three-letter country identifier"
    },
    {
      "name": "countryName",
      "type": "string", 
      "required": true,
      "description": "Full country name for display"
    },
    {
      "name": "currencyCode",
      "type": "string",
      "required": true,
      "enum": ["AED", "SAR", "USD"],
      "description": "ISO currency code"
    },
    {
      "name": "currencySymbol",
      "type": "string",
      "required": true,
      "description": "Currency symbol for display"
    },
    {
      "name": "vatRate",
      "type": "number",
      "required": true,
      "min": 0,
      "max": 100,
      "description": "VAT percentage rate"
    },
    {
      "name": "paymentMethods",
      "type": "list",
      "subFields": [
        {
          "name": "methodName",
          "type": "string",
          "required": true
        },
        {
          "name": "provider",
          "type": "string",
          "required": true
        },
        {
          "name": "isActive",
          "type": "boolean",
          "defaultValue": true
        }
      ]
    }
  ]
}
```

**Data Entries to Create**:

**UAE Entry**:
```json
{
  "countryCode": "UAE",
  "countryName": "United Arab Emirates",
  "currencyCode": "AED", 
  "currencySymbol": "د.إ",
  "vatRate": 5,
  "paymentMethods": [
    {
      "methodName": "Credit Card",
      "provider": "PayFort",
      "isActive": true
    },
    {
      "methodName": "Debit Card", 
      "provider": "Network International",
      "isActive": true
    },
    {
      "methodName": "Bank Transfer",
      "provider": "Emirates NBD",
      "isActive": true
    }
  ]
}
```

**KSA Entry**:
```json
{
  "countryCode": "KSA",
  "countryName": "Saudi Arabia",
  "currencyCode": "SAR",
  "currencySymbol": "ر.س", 
  "vatRate": 15,
  "paymentMethods": [
    {
      "methodName": "MADA",
      "provider": "HyperPay",
      "isActive": true
    },
    {
      "methodName": "Credit Card",
      "provider": "HyperPay", 
      "isActive": true
    },
    {
      "methodName": "STC Pay",
      "provider": "STC",
      "isActive": true
    }
  ]
}
```

**USA Entry**:
```json
{
  "countryCode": "USA",
  "countryName": "United States",
  "currencyCode": "USD",
  "currencySymbol": "$",
  "vatRate": 0,
  "paymentMethods": [
    {
      "methodName": "Credit Card",
      "provider": "Stripe",
      "isActive": true
    },
    {
      "methodName": "PayPal", 
      "provider": "PayPal",
      "isActive": true
    }
  ]
}
```

### Step 2: ServicePricing Data Model

**Model Configuration**:
```json
{
  "name": "ServicePricing",
  "description": "Pricing information for services across different countries",
  "fields": [
    {
      "name": "serviceName",
      "type": "string",
      "required": true,
      "description": "Display name of the service"
    },
    {
      "name": "serviceId",
      "type": "string", 
      "required": true,
      "description": "Unique identifier (lowercase-with-dashes)"
    },
    {
      "name": "countryCode",
      "type": "string",
      "required": true,
      "enum": ["UAE", "KSA", "USA"]
    },
    {
      "name": "basePrice",
      "type": "number",
      "required": true,
      "min": 0,
      "description": "Price before VAT"
    },
    {
      "name": "currency",
      "type": "string",
      "required": true,
      "enum": ["AED", "SAR", "USD"]
    }
  ]
}
```

**Sample Data Entries**:

**Basic Accounting Service**:
```json
// UAE Pricing
{
  "serviceName": "Basic Accounting Package",
  "serviceId": "basic-accounting",
  "countryCode": "UAE",
  "basePrice": 750,
  "currency": "AED"
}

// KSA Pricing  
{
  "serviceName": "Basic Accounting Package",
  "serviceId": "basic-accounting", 
  "countryCode": "KSA",
  "basePrice": 750,
  "currency": "SAR"
}

// USA Pricing
{
  "serviceName": "Basic Accounting Package",
  "serviceId": "basic-accounting",
  "countryCode": "USA", 
  "basePrice": 200,
  "currency": "USD"
}
```

---

## Custom Components Development

### Component 1: CurrencyDetector

**Purpose**: Automatically detect user's country and set currency preference

**Builder.io Setup**: Components → + New Component → Name: "CurrencyDetector"

```javascript
import React, { useState, useEffect } from 'react';

export default function CurrencyDetector({ 
  onCountryDetected,
  showDetectedCountry = true,
  fallbackCountry = 'USA'
}) {
  const [userCountry, setUserCountry] = useState(fallbackCountry);
  const [isLoading, setIsLoading] = useState(true);
  const [detectionMethod, setDetectionMethod] = useState('');

  useEffect(() => {
    detectUserCountry();
  }, []);

  const detectUserCountry = async () => {
    try {
      // Check if user already has a saved preference
      const savedCountry = localStorage.getItem('userPreferredCountry');
      if (savedCountry && ['UAE', 'KSA', 'USA'].includes(savedCountry)) {
        setUserCountry(savedCountry);
        setDetectionMethod('saved preference');
        onCountryDetected?.(savedCountry);
        setIsLoading(false);
        return;
      }

      // Detect based on IP geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      let detectedCountry = fallbackCountry;
      
      // Map country codes to our supported countries
      switch(data.country_code) {
        case 'AE':
          detectedCountry = 'UAE';
          break;
        case 'SA':
          detectedCountry = 'KSA';
          break;
        default:
          detectedCountry = 'USA'; // Default for all other countries
      }
      
      setUserCountry(detectedCountry);
      setDetectionMethod('IP geolocation');
      
      // Store detection results
      localStorage.setItem('userDetectedCountry', detectedCountry);
      localStorage.setItem('userPreferredCountry', detectedCountry);
      localStorage.setItem('detectionTimestamp', new Date().toISOString());
      
      onCountryDetected?.(detectedCountry);
      
    } catch (error) {
      console.warn('Country detection failed, using fallback:', error);
      setUserCountry(fallbackCountry);
      setDetectionMethod('fallback');
      localStorage.setItem('userPreferredCountry', fallbackCountry);
      onCountryDetected?.(fallbackCountry);
    } finally {
      setIsLoading(false);
    }
  };

  const countryLabels = {
    'UAE': '🇦🇪 United Arab Emirates (AED)',
    'KSA': '🇸🇦 Saudi Arabia (SAR)', 
    'USA': '🇺🇸 United States (USD)'
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-300 rounded-full"></div>
          <span className="text-blue-600">Detecting your location...</span>
        </div>
      </div>
    );
  }

  if (!showDetectedCountry) {
    return null; // Hidden detector for background operation
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-green-600 font-medium">
            Showing prices for: {countryLabels[userCountry]}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          via {detectionMethod}
        </div>
      </div>
    </div>
  );
}
```

**Component Input Configuration**:
```javascript
{
  "onCountryDetected": {
    "type": "function",
    "description": "Callback function when country is detected"
  },
  "showDetectedCountry": {
    "type": "boolean", 
    "defaultValue": true,
    "description": "Display detected country to user"
  },
  "fallbackCountry": {
    "type": "string",
    "enum": ["UAE", "KSA", "USA"],
    "defaultValue": "USA",
    "description": "Default country if detection fails"
  }
}
```

### Component 2: CurrencySwitcher

**Purpose**: Allow users to manually change their currency preference

```javascript
import React, { useState, useEffect } from 'react';

export default function CurrencySwitcher({
  onCountryChange,
  showFlags = true,
  style = 'dropdown', // 'dropdown', 'buttons', 'tabs'
  size = 'medium' // 'small', 'medium', 'large'
}) {
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [isChanging, setIsChanging] = useState(false);

  const countries = [
    { 
      code: 'UAE', 
      name: 'UAE',
      fullName: 'United Arab Emirates',
      currency: 'AED',
      symbol: 'د.إ',
      flag: '🇦🇪' 
    },
    { 
      code: 'KSA', 
      name: 'KSA',
      fullName: 'Saudi Arabia', 
      currency: 'SAR',
      symbol: 'ر.س',
      flag: '🇸🇦' 
    },
    { 
      code: 'USA', 
      name: 'USA',
      fullName: 'United States',
      currency: 'USD',
      symbol: '$',
      flag: '🇺🇸' 
    }
  ];

  useEffect(() => {
    // Get current country preference
    const current = localStorage.getItem('userPreferredCountry') || 'USA';
    setSelectedCountry(current);
  }, []);

  const handleCountryChange = async (countryCode) => {
    if (countryCode === selectedCountry) return;
    
    setIsChanging(true);
    setSelectedCountry(countryCode);
    
    // Store user preference
    localStorage.setItem('userPreferredCountry', countryCode);
    localStorage.setItem('manualSelection', 'true');
    localStorage.setItem('selectionTimestamp', new Date().toISOString());
    
    // Notify parent component
    onCountryChange?.(countryCode);
    
    // Add small delay for better UX, then reload to update prices
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-2', 
    large: 'text-lg px-4 py-3'
  };

  if (style === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2">
        {countries.map(country => (
          <button
            key={country.code}
            onClick={() => handleCountryChange(country.code)}
            disabled={isChanging}
            className={`${sizeClasses[size]} rounded-lg border transition-all duration-200 ${
              selectedCountry === country.code 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            } ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {showFlags && country.flag} {country.name} ({country.currency})
          </button>
        ))}
      </div>
    );
  }

  if (style === 'tabs') {
    return (
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {countries.map(country => (
            <button
              key={country.code}
              onClick={() => handleCountryChange(country.code)}
              disabled={isChanging}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedCountry === country.code
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showFlags && country.flag} {country.fullName}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // Default dropdown style
  return (
    <div className="relative">
      <select 
        value={selectedCountry}
        onChange={(e) => handleCountryChange(e.target.value)}
        disabled={isChanging}
        className={`${sizeClasses[size]} border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {countries.map(country => (
          <option key={country.code} value={country.code}>
            {showFlags ? `${country.flag} ` : ''}{country.fullName} ({country.symbol})
          </option>
        ))}
      </select>
      
      {isChanging && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
```

**Component Input Configuration**:
```javascript
{
  "onCountryChange": {
    "type": "function",
    "description": "Called when country selection changes"
  },
  "showFlags": {
    "type": "boolean",
    "defaultValue": true,
    "description": "Display country flags"
  },
  "style": {
    "type": "string",
    "enum": ["dropdown", "buttons", "tabs"],
    "defaultValue": "dropdown",
    "description": "Visual style of the switcher"
  },
  "size": {
    "type": "string", 
    "enum": ["small", "medium", "large"],
    "defaultValue": "medium",
    "description": "Size of the component"
  }
}
```

### Component 3: SmartPriceDisplay

**Purpose**: Display prices with automatic currency conversion and VAT calculation

```javascript
import React, { useState, useEffect } from 'react';

export default function SmartPriceDisplay({
  serviceName = "Service",
  serviceId = "default",
  showVatBreakdown = true,
  buttonText = "Get Started",
  onButtonClick,
  size = "medium",
  highlightSavings = false,
  comparisonCountry = "USA"
}) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCountry, setUserCountry] = useState('USA');

  // Mock pricing data - replace with actual Builder.io API calls
  const mockPricingData = {
    'basic-accounting': {
      'UAE': { basePrice: 750, currency: 'AED', symbol: 'د.إ' },
      'KSA': { basePrice: 750, currency: 'SAR', symbol: 'ر.س' },
      'USA': { basePrice: 200, currency: 'USD', symbol: '$' }
    },
    'bookkeeping': {
      'UAE': { basePrice: 500, currency: 'AED', symbol: 'د.إ' },
      'KSA': { basePrice: 500, currency: 'SAR', symbol: 'ر.س' },
      'USA': { basePrice: 150, currency: 'USD', symbol: '$' }
    },
    'tax-preparation': {
      'UAE': { basePrice: 1000, currency: 'AED', symbol: 'د.إ' },
      'KSA': { basePrice: 1000, currency: 'SAR', symbol: 'ر.س' },
      'USA': { basePrice: 300, currency: 'USD', symbol: '$' }
    },
    'financial-consultation': {
      'UAE': { basePrice: 1500, currency: 'AED', symbol: 'د.إ' },
      'KSA': { basePrice: 1500, currency: 'SAR', symbol: 'ر.س' },
      'USA': { basePrice: 400, currency: 'USD', symbol: '$' }
    }
  };

  const vatRates = {
    'UAE': 5,
    'KSA': 15, 
    'USA': 0
  };

  useEffect(() => {
    const country = localStorage.getItem('userPreferredCountry') || 'USA';
    setUserCountry(country);
    loadPriceData(serviceId, country);
  }, [serviceId]);

  // Listen for country changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newCountry = localStorage.getItem('userPreferredCountry') || 'USA';
      if (newCountry !== userCountry) {
        setUserCountry(newCountry);
        loadPriceData(serviceId, newCountry);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [serviceId, userCountry]);

  const loadPriceData = async (serviceId, country) => {
    try {
      setLoading(true);
      setError(null);

      // In production, replace this with actual Builder.io API call:
      // const response = await fetch(`${builder.apiUrl}/content/${serviceId}?country=${country}`);
      
      const service = mockPricingData[serviceId] || mockPricingData['basic-accounting'];
      const pricing = service[country] || service['USA'];
      const vatRate = vatRates[country] || 0;
      
      const vatAmount = pricing.basePrice * (vatRate / 100);
      const totalPrice = pricing.basePrice + vatAmount;

      // Calculate savings if highlighting is enabled
      let savings = null;
      if (highlightSavings && country !== comparisonCountry) {
        const comparisonPricing = service[comparisonCountry];
        if (comparisonPricing) {
          const comparisonVat = comparisonPricing.basePrice * (vatRates[comparisonCountry] / 100);
          const comparisonTotal = comparisonPricing.basePrice + comparisonVat;
          savings = {
            amount: Math.abs(totalPrice - comparisonTotal),
            percentage: Math.round(((comparisonTotal - totalPrice) / comparisonTotal) * 100),
            isLower: totalPrice < comparisonTotal
          };
        }
      }

      setPriceData({
        ...pricing,
        vatRate,
        vatAmount,
        totalPrice,
        country,
        savings
      });
    } catch (err) {
      setError('Unable to load pricing information');
      console.error('Error loading price data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    // Track analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'price_button_click', {
        'service_id': serviceId,
        'country': userCountry,
        'price': priceData?.totalPrice,
        'currency': priceData?.currency
      });
    }
    
    onButtonClick?.(priceData);
  };

  const sizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-4 text-base', 
    large: 'p-6 text-lg'
  };

  const priceFontSize = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg ${sizeClasses[size]} flex flex-col items-center justify-center min-h-[200px]`}>
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-gray-500">Loading pricing...</span>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <div className={`border border-red-200 rounded-lg bg-red-50 ${sizeClasses[size]} text-center`}>
        <div className="text-red-600 mb-2">⚠️ Pricing Error</div>
        <span className="text-red-500 text-sm">{error || 'Unable to load pricing'}</span>
        <button 
          onClick={() => loadPriceData(serviceId, userCountry)}
          className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`smart-price-display border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${sizeClasses[size]} relative`}>
      {/* Savings Badge */}
      {priceData.savings && priceData.savings.isLower && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          Save {priceData.savings.percentage}%
        </div>
      )}
      
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 mb-3">
          {serviceName}
        </h3>
        
        <div className="price-breakdown mb-4">
          <div className={`font-bold text-blue-600 ${priceFontSize[size]} mb-2`}>
            {priceData.symbol}{priceData.totalPrice.toFixed(2)}
            <span className="text-lg font-normal text-gray-500 ml-2">
              {priceData.currency}
            </span>
          </div>
          
          {showVatBreakdown && priceData.vatRate > 0 && (
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <span>Base Price:</span>
                <span className="font-medium">{priceData.symbol}{priceData.basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>VAT ({priceData.vatRate}%):</span>
                <span className="font-medium">{priceData.symbol}{priceData.vatAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between items-center font-medium">
                <span>Total:</span>
                <span>{priceData.symbol}{priceData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {priceData.savings && (
            <div className="text-xs text-green-600 bg-green-50 rounded p-2 mb-3">
              💰 You save {priceData.symbol}{priceData.savings.amount.toFixed(2)} compared to {comparisonCountry} pricing
            </div>
          )}
        </div>
        
        <button 
          onClick={handleButtonClick}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {buttonText} - {priceData.symbol}{priceData.totalPrice.toFixed(2)}
        </button>
        
        <div className="mt-3 text-xs text-gray-500 flex items-center justify-center space-x-2">
          <span>🌍 Pricing for {priceData.country}</span>
          {priceData.vatRate > 0 && (
            <>
              <span>•</span>
              <span>VAT included</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Component Input Configuration**:
```javascript
{
  "serviceName": {
    "type": "string",
    "defaultValue": "Service",
    "description": "Display name of the service"
  },
  "serviceId": {
    "type": "string", 
    "defaultValue": "basic-accounting",
    "description": "Unique service identifier"
  },
  "showVatBreakdown": {
    "type": "boolean",
    "defaultValue": true,
    "description": "Show VAT calculation details"
  },
  "buttonText": {
    "type": "string",
    "defaultValue": "Get Started",
    "description": "Text for the CTA button"
  },
  "size": {
    "type": "string",
    "enum": ["small", "medium", "large"],
    "defaultValue": "medium"
  },
  "highlightSavings": {
    "type": "boolean",
    "defaultValue": false,
    "description": "Show savings comparison"
  },
  "comparisonCountry": {
    "type": "string",
    "enum": ["UAE", "KSA", "USA"],
    "defaultValue": "USA",
    "description": "Country to compare prices against"
  },
  "onButtonClick": {
    "type": "function"
  }
}
```

### Component 4: PaymentHandler

**Purpose**: Handle payment processing with region-specific gateways

```javascript
import React, { useState, useEffect } from 'react';

export default function PaymentHandler({ 
  amount,
  currency,
  serviceId,
  userCountry,
  customerEmail,
  onPaymentSuccess,
  onPaymentError
}) {
  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('');

  const paymentConfigs = {
    'UAE': {
      gateway: 'payfort',
      currency: 'AED',
      methods: [
        { id: 'visa', name: 'Visa', icon: '💳', provider: 'PayFort' },
        { id: 'mastercard', name: 'Mastercard', icon: '💳', provider: 'PayFort' },
        { id: 'emirates-nbd', name: 'Emirates NBD', icon: '🏦', provider: 'Network International' }
      ]
    },
    'KSA': {
      gateway: 'hyperpay', 
      currency: 'SAR',
      methods: [
        { id: 'mada', name: 'MADA', icon: '💳', provider: 'HyperPay' },
        { id: 'visa', name: 'Visa', icon: '💳', provider: 'HyperPay' },
        { id: 'mastercard', name: 'Mastercard', icon: '💳', provider: 'HyperPay' },
        { id: 'stc-pay', name: 'STC Pay', icon: '📱', provider: 'STC' }
      ]
    },
    'USA': {
      gateway: 'stripe',
      currency: 'USD', 
      methods: [
        { id: 'visa', name: 'Visa', icon: '💳', provider: 'Stripe' },
        { id: 'mastercard', name: 'Mastercard', icon: '💳', provider: 'Stripe' },
        { id: 'amex', name: 'American Express', icon: '💳', provider: 'Stripe' },
        { id: 'paypal', name: 'PayPal', icon: '🔵', provider: 'PayPal' }
      ]
    }
  };

  useEffect(() => {
    const config = paymentConfigs[userCountry] || paymentConfigs['USA'];
    setPaymentConfig(config);
    setSelectedMethod(config.methods[0]?.id || '');
  }, [userCountry]);

  const handlePayment = async () => {
    if (!selectedMethod || !paymentConfig) return;
    
    setLoading(true);
    
    try {
      // Track payment initiation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'begin_checkout', {
          currency: currency,
          value: amount,
          payment_method: selectedMethod,
          country: userCountry
        });
      }

      // Payment processing logic based on gateway
      let paymentResult;
      
      switch(paymentConfig.gateway) {
        case 'payfort':
          paymentResult = await processPayFortPayment();
          break;
        case 'hyperpay':
          paymentResult = await processHyperPayPayment();
          break;
        case 'stripe':
          paymentResult = await processStripePayment();
          break;
        default:
          throw new Error('Unsupported payment gateway');
      }
      
      if (paymentResult.success) {
        onPaymentSuccess?.(paymentResult);
        
        // Track successful payment
        if (typeof gtag !== 'undefined') {
          gtag('event', 'purchase', {
            transaction_id: paymentResult.transactionId,
            currency: currency,
            value: amount,
            country: userCountry
          });
        }
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError?.(error.message);
      
      // Track failed payment
      if (typeof gtag !== 'undefined') {
        gtag('event', 'payment_failed', {
          currency: currency,
          value: amount,
          error: error.message,
          country: userCountry
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // PayFort integration (UAE)
  const processPayFortPayment = async () => {
    // This is a mock implementation
    // Replace with actual PayFort API integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: 'PF_' + Date.now(),
          gateway: 'payfort'
        });
      }, 2000);
    });
  };

  // HyperPay integration (KSA)
  const processHyperPayPayment = async () => {
    // This is a mock implementation
    // Replace with actual HyperPay API integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: 'HP_' + Date.now(),
          gateway: 'hyperpay'
        });
      }, 2000);
    });
  };

  // Stripe integration (USA/fallback)
  const processStripePayment = async () => {
    // This is a mock implementation
    // Replace with actual Stripe API integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: 'ST_' + Date.now(),
          gateway: 'stripe'
        });
      }, 2000);
    });
  };

  if (!paymentConfig) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="text-center text-gray-500">Loading payment options...</div>
      </div>
    );
  }

  return (
    <div className="payment-handler bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Payment Options for {userCountry}</h3>
      
      {/* Payment Methods Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Payment Method:
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paymentConfig.methods.map(method => (
            <label
              key={method.id}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className="text-2xl mr-3">{method.icon}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {method.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    via {method.provider}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount:</span>
          <span className="text-lg font-bold text-blue-600">
            {paymentConfig.currency === 'AED' && 'د.إ'}
            {paymentConfig.currency === 'SAR' && 'ر.س'}
            {paymentConfig.currency === 'USD' && '}
            {amount.toFixed(2)} {paymentConfig.currency}
          </span>
        </div>
      </div>

      {/* Payment Button */}
      <button 
        onClick={handlePayment}
        disabled={loading || !selectedMethod}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing Payment...
          </>
        ) : (
          <>
            🔒 Pay Securely - {paymentConfig.currency === 'AED' && 'د.إ'}{paymentConfig.currency === 'SAR' && 'ر.س'}{paymentConfig.currency === 'USD' && '}{amount.toFixed(2)}
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="mt-4 text-center text-xs text-gray-500">
        🔐 Your payment is secured with 256-bit SSL encryption
      </div>
    </div>
  );
}
```

**Component Input Configuration**:
```javascript
{
  "amount": {
    "type": "number",
    "required": true,
    "description": "Payment amount"
  },
  "currency": {
    "type": "string",
    "required": true,
    "description": "Payment currency"
  },
  "serviceId": {
    "type": "string",
    "required": true,
    "description": "Service being purchased"
  },
  "userCountry": {
    "type": "string", 
    "required": true,
    "description": "User's country"
  },
  "customerEmail": {
    "type": "string",
    "description": "Customer email address"
  },
  "onPaymentSuccess": {
    "type": "function"
  },
  "onPaymentError": {
    "type": "function"
  }
}
```

---

## Page Integration Guide

### Step 1: Homepage Integration

**Navigate to**: Builder.io → Pages → Homepage → Edit

**Header Section Enhancement:**
1. **Add Currency Detection**
   - Drag `CurrencyDetector` component to header
   - Configuration:
     ```javascript
     {
       "showDetectedCountry": true,
       "fallbackCountry": "USA"
     }
     ```

2. **Add Currency Switcher**
   - Drag `CurrencySwitcher` component to header (top-right recommended)
   - Configuration:
     ```javascript
     {
       "style": "dropdown",
       "showFlags": true,
       "size": "medium"
     }
     ```

**Hero Section Customization:**
1. **Regional Hero Content**
   - Use Builder.io's targeting features
   - Create variations for UAE/KSA audiences
   - Include region-specific value propositions

**Pricing Section Replacement:**
1. **Remove Static Pricing**
   - Delete existing price displays
   - Remove hardcoded USD amounts

2. **Add Smart Price Components**
   - For each service, add `SmartPriceDisplay` component
   - Example configurations:
     ```javascript
     // Basic Accounting
     {
       "serviceName": "Basic Accounting Package",
       "serviceId": "basic-accounting",
       "size": "large",
       "showVatBreakdown": true,
       "buttonText": "Start Now"
     }
     
     // Bookkeeping
     {
       "serviceName": "Monthly Bookkeeping", 
       "serviceId": "bookkeeping",
       "size": "medium",
       "highlightSavings": true
     }
     
     // Tax Preparation
     {
       "serviceName": "Tax Preparation & Filing",
       "serviceId": "tax-preparation", 
       "size": "medium",
       "comparisonCountry": "USA"
     }
     ```

### Step 2: Service Pages Enhancement

**For each service page:**

**Pricing Section:**
```javascript
// Replace static pricing with:
<SmartPriceDisplay
  serviceName="[Service Name]"
  serviceId="[service-id]"
  size="large"
  showVatBreakdown={true}
  buttonText="Get This Service"
  onButtonClick={(priceData) => {
    // Redirect to checkout with pricing data
    window.location.href = `/checkout?service=${serviceId}&country=${priceData.country}&price=${priceData.totalPrice}`;
  }}
/>
```

**Regional Content Blocks:**
- Add country-specific testimonials
- Include local compliance badges
- Show relevant business registration numbers

### Step 3: Checkout Page Creation

**Create New Page**: `/checkout`

**Page Structure:**
```html
<!-- Customer Information Form -->
<section class="customer-details">
  <h2>Customer Information</h2>
  <!-- Form fields for customer data -->
</section>

<!-- Order Summary -->
<section class="order-summary">
  <h2>Order Summary</h2>
  <!-- Display selected service and pricing -->
  <SmartPriceDisplay 
    serviceId="[from URL params]"
    size="small"
    showVatBreakdown={true}
    buttonText=""
  />
</section>

<!-- Payment Section -->
<section class="payment-section">
  <PaymentHandler
    amount="[from URL params]"
    currency="[from country detection]"
    serviceId="[from URL params]"
    userCountry="[from detection]"
    onPaymentSuccess="[redirect to success]"
    onPaymentError="[show error message]"
  />
</section>
```

---

## Payment Gateway Integration

### UAE Payment Setup (PayFort/Amazon Payment Services)

**Merchant Account Setup:**
1. **Register with PayFort**
   - Visit: https://payfort.amazon.com
   - Complete business verification
   - Obtain merchant credentials

2. **Integration Configuration:**
```javascript
// PayFort Integration Code
const PayFortConfig = {
  merchant_identifier: "YOUR_MERCHANT_ID",
  service_command: "TOKENIZATION", 
  merchant_reference: "ORDER_" + Date.now(),
  language: "en",
  currency: "AED",
  return_url: "https://yoursite.com/payment-return"
};

const initializePayFort = (amount, customerData) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://checkout.payfort.com/FortAPI/paymentPage';
  
  Object.keys(PayFortConfig).forEach(key => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = PayFortConfig[key];
    form.appendChild(input);
  });
  
  // Add amount
  const amountInput = document.createElement('input');
  amountInput.type = 'hidden';
  amountInput.name = 'amount';
  amountInput.value = Math.round(amount * 100); // Convert to fils
  form.appendChild(amountInput);
  
  document.body.appendChild(form);
  form.submit();
};
```

### KSA Payment Setup (HyperPay + MADA)

**Merchant Account Setup:**
1. **Register with HyperPay**
   - Visit: https://www.hyperpay.com
   - Complete Saudi business verification
   - Enable MADA processing

2. **Integration Configuration:**
```javascript
// HyperPay Integration Code
const HyperPayConfig = {
  entityId: "YOUR_ENTITY_ID", 
  currency: "SAR",
  paymentType: "DB", // Debit transaction
  testMode: false // Set to true for testing
};

const initializeHyperPay = async (amount, customerData) => {
  // Step 1: Prepare checkout
  const checkoutResponse = await fetch('/api/hyperpay/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount.toFixed(2),
      currency: 'SAR',
      customer: customerData
    })
  });
  
  const checkoutData = await checkoutResponse.json();
  
  // Step 2: Initialize payment widget
  wpwlOptions = {
    style: "card",
    locale: "en"
  };
  
  const script = document.createElement('script');
  script.src = `https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutData.id}`;
  document.head.appendChild(script);
};
```

### USA Payment Setup (Stripe)

**Merchant Account Setup:**
1. **Register with Stripe**
   - Visit: https://stripe.com
   - Complete account verification
   - Obtain API keys

2. **Integration Configuration:**
```javascript
// Stripe Integration Code
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

const initializeStripe = async (amount, customerData) => {
  const stripe = await stripePromise;
  
  // Create payment intent
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerData
    })
  });
  
  const { client_secret } = await response.json();
  
  // Confirm payment
  const result = await stripe.confirmCardPayment(client_secret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: customerData.name,
        email: customerData.email
      }
    }
  });
  
  if (result.error) {
    console.error('Payment failed:', result.error);
  } else {
    console.log('Payment successful:', result.paymentIntent);
  }
};
```

---

## Legal & Compliance Setup

### UAE VAT Registration

**Requirements:**
- Annual turnover exceeds AED 375,000
- Business registered in UAE
- Valid trade license

**Registration Process:**
1. **Prepare Documents**
   - Trade license copy
   - Memorandum of Association
   - Bank statements (6 months)
   - Audited financial statements

2. **Online Registration**
   - Visit: https://tax.gov.ae
   - Create FTA account
   - Submit VAT registration application
   - Pay AED 300 registration fee

3. **Post-Registration**
   - Display TRN on invoices
   - File quarterly VAT returns
   - Maintain VAT records for 5 years

**Invoice Requirements:**
```javascript
// VAT Invoice Template
const generateUAEInvoice = (orderData) => {
  return {
    invoiceNumber: `UAE-INV-${Date.now()}`,
    issueDate: new Date().toISOString().split('T')[0],
    trn: "100123456700003", // Your TRN
    customerDetails: orderData.customer,
    services: orderData.services,
    subtotal: orderData.subtotal,
    vatAmount: orderData.subtotal * 0.05,
    total: orderData.subtotal * 1.05,
    vatNote: "Tax Invoice - VAT Registration Number: 100123456700003"
  };
};
```

### KSA VAT Registration

**Requirements:**
- Mandatory for most businesses
- Revenue threshold: SAR 375,000
- E-invoicing compliance required

**Registration Process:**
1. **ZATCA Registration**
   - Visit: https://zatca.gov.sa
   - Complete business registration
   - Obtain VAT certificate

2. **E-Invoicing Setup**
   - Phase 1: E-invoice generation
   - Phase 2: Integration with ZATCA
   - QR code requirement

**Invoice Requirements:**
```javascript
// KSA E-Invoice Template
const generateKSAInvoice = (orderData) => {
  const invoice = {
    invoiceNumber: `KSA-INV-${Date.now()}`,
    issueDate: new Date().toISOString(),
    vatNumber: "300123456700003", // Your VAT number
    customerDetails: orderData.customer,
    services: orderData.services,
    subtotal: orderData.subtotal,
    vatAmount: orderData.subtotal * 0.15,
    total: orderData.subtotal * 1.15,
    qrCode: generateQRCode(orderData) // ZATCA-compliant QR
  };
  
  // Generate QR code for ZATCA compliance
  const qrData = [
    invoice.supplierName,
    invoice.vatNumber, 
    invoice.issueDate,
    invoice.total,
    invoice.vatAmount
  ].join('|');
  
  return invoice;
};
```

### Terms of Service Updates

**UAE-Specific Terms:**
```markdown
## Terms of Service - UAE

### Jurisdiction
These terms are governed by UAE Federal Law and the laws of the Emirate where services are provided.

### VAT
All prices include 5% UAE VAT where applicable. VAT invoices will be issued in compliance with Federal Tax Authority requirements.

### Dispute Resolution
Disputes will be resolved through UAE courts or approved arbitration centers.

### Data Protection
Data handling complies with UAE Data Protection Law and international best practices.
```

**KSA-Specific Terms:**
```markdown
## Terms of Service - Kingdom of Saudi Arabia

### Jurisdiction  
These terms are governed by Saudi Arabian law and regulations.

### VAT
All prices include 15% Saudi VAT. E-invoices will be issued in compliance with ZATCA requirements.

### Dispute Resolution
Disputes will be resolved through Saudi courts or approved commercial arbitration.

### Data Localization
Data storage and processing comply with Saudi data localization requirements.
```

---

## Testing & Quality Assurance

### Automated Testing Setup

**Component Testing Script:**
```javascript
// tests/currency-components.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CurrencyDetector from '../components/CurrencyDetector';
import SmartPriceDisplay from '../components/SmartPriceDisplay';

describe('Currency Components', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  test('CurrencyDetector detects UAE IP', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ country_code: 'AE' })
    });

    const onCountryDetected = jest.fn();
    render(<CurrencyDetector onCountryDetected={onCountryDetected} />);

    await waitFor(() => {
      expect(onCountryDetected).toHaveBeenCalledWith('UAE');
    });
  });

  test('SmartPriceDisplay shows correct UAE pricing', () => {
    localStorage.setItem('userPreferredCountry', 'UAE');
    
    render(
      <SmartPriceDisplay 
        serviceId="basic-accounting"
        serviceName="Basic Accounting"
      />
    );

    expect(screen.getByText(/د\.إ/)).toBeInTheDocument();
    expect(screen.getByText(/AED/)).toBeInTheDocument();
  });

  test('Currency switcher changes country', async () => {
    render(<CurrencySwitcher />);
    
    const switcher = screen.getByRole('combobox');
    fireEvent.change(switcher, { target: { value: 'KSA' } });
    
    await waitFor(() => {
      expect(localStorage.getItem('userPreferredCountry')).toBe('KSA');
    });
  });
});
```

### Manual Testing Checklist

**Currency Detection Testing:**
- [ ] UAE IP addresses detect AED currency
- [ ] KSA IP addresses detect SAR currency
- [ ] Other countries default to USD
- [ ] Manual switcher overrides detection
- [ ] User preferences persist across sessions

**Pricing Accuracy Testing:**
- [ ] UAE prices show correct AED amounts
- [ ] KSA prices show correct SAR amounts
- [ ] USA prices show correct USD amounts
- [ ] VAT calculations are accurate (5% UAE, 15% KSA)
- [ ] Price consistency across all pages

**Payment Flow Testing:**
- [ ] UAE users see PayFort payment options
- [ ] KSA users see MADA and local options
- [ ] USA users see Stripe payment options
- [ ] Payment amounts match displayed prices
- [ ] Success/failure flows work correctly

**Mobile Responsiveness:**
- [ ] Currency switcher works on mobile devices
- [ ] Price displays are readable on small screens
- [ ] Payment forms are mobile-friendly
- [ ] Touch interactions work correctly

**Performance Testing:**
- [ ] Page load times under 3 seconds
- [ ] Currency detection doesn't block page rendering
- [ ] Price updates happen smoothly
- [ ] No JavaScript errors in console

### Browser Compatibility Testing

**Supported Browsers:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile Safari (iOS 13+)
- Chrome Mobile (Android 8+)

**Testing Matrix:**
```javascript
// Browser testing configuration
const testMatrix = [
  { browser: 'Chrome', version: '90+', os: 'Windows' },
  { browser: 'Firefox', version: '88+', os: 'Windows' },
  { browser: 'Safari', version: '14+', os: 'macOS' },
  { browser: 'Edge', version: '90+', os: 'Windows' },
  { browser: 'Chrome Mobile', version: '90+', os: 'Android' },
  { browser: 'Safari Mobile', version: '14+', os: 'iOS' }
];
```

---

## Deployment & Launch

### Pre-Launch Checklist

**Technical Readiness:**
- [ ] All components tested and working
- [ ] Data models populated with accurate pricing
- [ ] Payment gateways configured and tested
- [ ] SSL certificates installed
- [ ] CDN configured for Middle East regions

**Legal Compliance:**
- [ ] UAE VAT registration completed (if required)
- [ ] KSA VAT registration completed
- [ ] Terms of service updated for each region
- [ ] Privacy policy updated
- [ ] Invoice templates compliant

**Content Readiness:**
- [ ] Pricing reviewed and approved
- [ ] Regional content variations created
- [ ] Translation accuracy verified
- [ ] Contact information localized

### Deployment Strategy

**Phase 1: Soft Launch (Week 16)**
```javascript
// Feature flag configuration
const deploymentConfig = {
  multiCurrencyEnabled: true,
  trafficSplit: {
    'UAE': 25,  // 25% of UAE traffic
    'KSA': 25,  // 25% of KSA traffic  
    'USA': 100  // 100% of other traffic
  },
  fallbackMode: true, // Fallback to old system if errors
  monitoringEnabled: true
};
```

**Phase 2: Full Launch (Week 17)**
```javascript
const fullLaunchConfig = {
  multiCurrencyEnabled: true,
  trafficSplit: {
    'UAE': 100,
    'KSA': 100,
    'USA': 100
  },
  fallbackMode: false,
  monitoringEnabled: true
};
```

### Monitoring Setup

**Analytics Configuration:**
```javascript
// Google Analytics 4 Enhanced Ecommerce
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_parameter_1': 'user_country',
    'custom_parameter_2': 'selected_currency'
  }
});

// Track currency changes
const trackCurrencyChange = (fromCountry, toCountry) => {
  gtag('event', 'currency_change', {
    'from_country': fromCountry,
    'to_country': toCountry,
    'timestamp': new Date().toISOString()
  });
};

// Track pricing interactions
const trackPriceInteraction = (serviceId, country, price) => {
  gtag('event', 'view_item', {
    'currency': getCountryCurrency(country),
    'value': price,
    'items': [{
      'item_id': serviceId,
      'item_name': getServiceName(serviceId),
      'price': price,
      'quantity': 1
    }]
  });
};
```

**Error Monitoring:**
```javascript
// Error tracking setup
window.addEventListener('error', (event) => {
  if (event.error && event.error.stack) {
    gtag('event', 'exception', {
      'description': event.error.message,
      'fatal': false,
      'currency_system': 'multicurrency_v1'
    });
  }
});

// Currency system specific error tracking
const trackCurrencyError = (error, context) => {
  console.error('Currency System Error:', error);
  
  gtag('event', 'currency_error', {
    'error_message': error.message,
    'context': context,
    'user_country': localStorage.getItem('userPreferredCountry'),
    'timestamp': new Date().toISOString()
  });
};
```

**Performance Monitoring:**
```javascript
// Performance tracking
const trackPerformance = () => {
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    gtag('event', 'page_performance', {
      'page_load_time': Math.round(navigation.loadEventEnd - navigation.loadEventStart),
      'dom_ready_time': Math.round(navigation.domContentLoadedEventEnd - navigation.loadEventStart),
      'user_country': localStorage.getItem('userPreferredCountry')
    });
  }
};

// Track currency detection speed
const trackDetectionSpeed = (startTime, country, method) => {
  const detectionTime = Date.now() - startTime;
  
  gtag('event', 'currency_detection_speed', {
    'detection_time_ms': detectionTime,
    'detected_country': country,
    'detection_method': method
  });
};
```

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue 1: Currency Not Detected**
```
Symptoms: Page shows USD for all users
Possible Causes:
- IP geolocation API blocked
- JavaScript errors preventing detection
- localStorage not accessible

Solutions:
1. Check browser console for errors
2. Test with different IP addresses/VPNs
3. Verify third-party API access
4. Implement fallback detection methods
```

**Issue 2: Prices Not Updating**
```
Symptoms: Currency switches but prices remain the same
Possible Causes:
- Component state not updating
- localStorage not syncing
- Missing price data for country

Solutions:
1. Check localStorage values in DevTools
2. Verify data model entries exist
3. Add debugging logs to price components
4. Test page refresh after currency change
```

**Issue 3: Payment Gateway Errors**
```
Symptoms: Payment processing fails or redirects incorrectly
Possible Causes:
- Incorrect gateway configuration
- Missing merchant credentials
- Currency mismatch between display and payment
- SSL certificate issues

Solutions:
1. Verify merchant account credentials
2. Test in sandbox/staging environment
3. Check currency codes match gateway requirements
4. Ensure HTTPS is properly configured
```

**Issue 4: VAT Calculations Incorrect**
```
Symptoms: VAT amounts don't match expected values
Possible Causes:
- Wrong VAT rates in data model
- Rounding errors in calculations
- Currency conversion affecting VAT

Solutions:
1. Verify VAT rates: UAE 5%, KSA 15%, USA 0%
2. Use proper rounding (2 decimal places)
3. Test calculations manually
4. Check for floating-point precision issues
```

**Issue 5: Mobile Display Problems**
```
Symptoms: Components not responsive or cut off on mobile
Possible Causes:
- CSS classes not mobile-optimized
- Viewport meta tag missing
- Touch interactions not working

Solutions:
1. Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">
2. Test with Tailwind CSS responsive classes
3. Use Builder.io mobile preview extensively
4. Test on actual mobile devices
```

### Debug Mode Implementation

**Add Debug Component for Testing:**
```javascript
// DebugPanel Component (only for development)
import React, { useState, useEffect } from 'react';

export default function DebugPanel({ enabled = false }) {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setDebugInfo({
        userCountry: localStorage.getItem('userPreferredCountry'),
        detectedCountry: localStorage.getItem('userDetectedCountry'),
        detectionMethod: localStorage.getItem('detectionMethod'),
        timestamp: localStorage.getItem('detectionTimestamp'),
        manualSelection: localStorage.getItem('manualSelection'),
        userAgent: navigator.userAgent,
        currentURL: window.location.href
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [enabled]);
  
  if (!enabled) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">🐛 Debug Info</div>
      {Object.entries(debugInfo).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="text-gray-400">{key}:</span> {value || 'null'}
        </div>
      ))}
      <button 
        onClick={() => localStorage.clear()}
        className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs"
      >
        Clear Storage
      </button>
    </div>
  );
}
```

### Testing Utilities

**Currency Testing Helper:**
```javascript
// Add to browser console for testing
const CurrencyTester = {
  // Force set country
  setCountry: (country) => {
    localStorage.setItem('userPreferredCountry', country);
    localStorage.setItem('manualSelection', 'true');
    console.log(`Country set to: ${country}`);
    window.location.reload();
  },
  
  // Simulate different countries
  testUAE: () => CurrencyTester.setCountry('UAE'),
  testKSA: () => CurrencyTester.setCountry('KSA'), 
  testUSA: () => CurrencyTester.setCountry('USA'),
  
  // Check current state
  getState: () => {
    return {
      preferred: localStorage.getItem('userPreferredCountry'),
      detected: localStorage.getItem('userDetectedCountry'),
      manual: localStorage.getItem('manualSelection') === 'true'
    };
  },
  
  // Reset everything
  reset: () => {
    localStorage.clear();
    console.log('Currency state cleared');
    window.location.reload();
  }
};

// Make available globally for testing
window.CurrencyTester = CurrencyTester;
```

---

## Budget & Timeline

### Detailed Cost Breakdown

**Development Costs:**
```
Builder.io Subscription:
- Pro Plan: $49/month (minimum required)
- Team Plan: $149/month (recommended for multiple developers)
- Annual savings: ~20%

Custom Development:
- Data Model Setup: $500 - $1,000
- Component Development: $2,000 - $4,000
- Page Integration: $1,000 - $2,000
- Testing & QA: $1,000 - $1,500

Payment Gateway Setup:
- PayFort (UAE): $1,000 - $2,000 setup + transaction fees
- HyperPay (KSA): $1,500 - $3,000 setup + transaction fees  
- Stripe (USA): $0 setup + transaction fees

Legal & Compliance:
- UAE VAT Registration: AED 300 + consultant fees $500-1,000
- KSA VAT Registration: Mandatory + consultant fees $500-1,000
- Legal Document Updates: $1,000 - $2,000

Total Development: $8,300 - $16,800
Monthly Recurring: $49 - $149 (Builder.io) + transaction fees
```

**Transaction Fees by Region:**
```
UAE (PayFort):
- Credit/Debit Cards: 2.9% + AED 1
- Local Bank Transfers: 1.5% + AED 2

KSA (HyperPay):
- MADA Cards: 1.75% + SAR 1
- International Cards: 2.9% + SAR 1.50
- STC Pay: 2.5% flat

USA (Stripe):
- Credit Cards: 2.9% + $0.30
- ACH Transfers: 0.8% (capped at $5)
```

### Implementation Timeline

**Week-by-Week Breakdown:**

**Weeks 1-2: Foundation**
- [ ] Builder.io plan upgrade and setup
- [ ] Data models creation and population  
- [ ] Market research and pricing strategy
- [ ] Payment gateway account applications
- [ ] Legal consultation for compliance

**Weeks 3-5: Core Development**
- [ ] CurrencyDetector component development
- [ ] CurrencySwitcher component development
- [ ] SmartPriceDisplay component development
- [ ] Component testing and refinement
- [ ] Integration with Builder.io pages

**Weeks 6-8: Frontend Integration**
- [ ] Homepage integration and testing
- [ ] Service pages enhancement
- [ ] Checkout page creation
- [ ] Mobile responsiveness optimization
- [ ] Regional content customization

**Weeks 9-11: Payment Integration**
- [ ] PayFort integration (UAE)
- [ ] HyperPay/MADA integration (KSA)
- [ ] Stripe integration (USA)
- [ ] Payment flow testing
- [ ] Error handling implementation

**Weeks 12-13: Legal & Compliance**
- [ ] VAT registration completion
- [ ] Invoice template creation
- [ ] Terms of service updates
- [ ] Privacy policy updates
- [ ] Compliance verification

**Weeks 14-15: Testing & QA**
- [ ] Comprehensive functionality testing
- [ ] Cross-browser compatibility testing
- [ ] Performance optimization
- [ ] Security testing
- [ ] User acceptance testing

**Weeks 16-17: Launch Preparation**
- [ ] Staging environment deployment
- [ ] Analytics and monitoring setup
- [ ] Staff training and documentation
- [ ] Soft launch with limited traffic
- [ ] Performance monitoring and optimization

**Weeks 18-20: Full Launch & Optimization**
- [ ] Full traffic rollout
- [ ] Daily monitoring and adjustments
- [ ] User feedback collection and analysis
- [ ] Performance optimization
- [ ] Feature refinements

### Success Metrics & KPIs

**Primary Success Metrics:**
```
Revenue Growth:
- Target: 25% increase in UAE/KSA markets within 6 months
- Measurement: Monthly recurring revenue by region

Conversion Rate:
- Target: 15% improvement in regional conversion rates
- Measurement: Checkout completion rate by country

Payment Success Rate:
- Target: 95%+ successful payment processing
- Measurement: Payment completion vs. initiation ratio

Customer Satisfaction:
- Target: 4.5+ average rating in regional feedback
- Measurement: Post-purchase surveys and reviews
```

**Secondary Metrics:**
```
Technical Performance:
- Page load time: <3 seconds in all regions
- Currency detection accuracy: >95%
- Mobile conversion rate: Match or exceed desktop

User Experience:
- Currency switcher usage rate
- Price comparison interactions
- Support ticket reduction (payment-related)

Business Metrics:
- Customer acquisition cost by region
- Average order value by currency
- Customer lifetime value improvement
- Cross-selling opportunities
```

### Risk Assessment & Mitigation

**High-Risk Items:**
```
1. Payment Gateway Delays
   Risk: Account approval takes longer than expected
   Mitigation: Apply early, have backup providers ready
   
2. VAT Registration Delays  
   Risk: Government processes cause launch delays
   Mitigation: Start early, use local consultants
   
3. Currency Fluctuations
   Risk: Exchange rates affect pricing strategy
   Mitigation: Regular price reviews, buffer margins
   
4. Technical Integration Issues
   Risk: Payment gateways or Builder.io limitations
   Mitigation: Thorough testing, fallback solutions
```

**Medium-Risk Items:**
```
1. User Adoption Rate
   Risk: Users don't utilize currency switching
   Mitigation: User education, prominent placement
   
2. Mobile Performance
   Risk: Complex components slow mobile experience
   Mitigation: Performance testing, progressive enhancement
   
3. Compliance Changes
   Risk: Tax laws change during implementation
   Mitigation: Regular legal reviews, flexible architecture
```

### Post-Launch Support Plan

**Month 1-3: Intensive Monitoring**
- Daily performance monitoring
- Weekly user feedback review
- Bi-weekly optimization sprints
- Monthly financial performance analysis

**Month 4-6: Stabilization**
- Weekly performance checks
- Monthly feature enhancements
- Quarterly pricing strategy review
- User experience optimization

**Month 7+: Maintenance Mode**
- Monthly performance reviews
- Quarterly feature updates
- Annual compliance reviews
- Continuous security monitoring

### Scaling Considerations

**Future Market Expansion:**
```
Potential Markets:
- Qatar (QAR currency)
- Kuwait (KWD currency)
- Bahrain (BHD currency)
- Oman (OMR currency)

Technical Requirements:
- Additional payment gateways
- More currency data models
- Extended compliance frameworks
- Localized customer support
```

**Feature Enhancements:**
```
Phase 2 Features:
- Arabic language full support
- Advanced analytics dashboard
- Multi-currency subscription management
- Automated VAT reporting

Phase 3 Features:
- Mobile app with currency support
- API for third-party integrations
- Advanced pricing rules engine
- Customer portal with regional features
```

---

## Conclusion & Next Steps

### Implementation Readiness Checklist

**Before Starting Development:**
- [ ] Builder.io Pro plan active
- [ ] Payment gateway applications submitted
- [ ] Legal consultation completed
- [ ] Pricing strategy approved
- [ ] Development team briefed

**First Week Actions:**
1. **Day 1**: Create CountrySettings data model
2. **Day 2**: Create ServicePricing data model  
3. **Day 3**: Populate data models with initial entries
4. **Day 4**: Begin CurrencyDetector component development
5. **Day 5**: Test basic currency detection functionality

**Quick Wins (First 2 Weeks):**
- Basic currency detection working
- Simple price display variation by country
- Currency switcher functional
- Mobile-responsive components

### Long-term Success Factors

**Technical Excellence:**
- Clean, maintainable component architecture
- Comprehensive testing coverage
- Performance optimization
- Security best practices

**Business Success:**
- Competitive regional pricing
- Excellent user experience
- Regulatory compliance
- Strong customer support

**Continuous Improvement:**
- Regular performance monitoring
- User feedback integration
- Market trend adaptation
- Feature evolution

This comprehensive implementation guide provides everything needed to successfully launch your multi-currency accounting website for the UAE and KSA markets using Builder.io. The step-by-step approach ensures minimal risk while maximizing the potential for business growth in these important markets.

Remember to start small, test thoroughly, and scale gradually. With proper implementation, this multi-currency system will significantly enhance your market reach and customer experience in the Middle East region.