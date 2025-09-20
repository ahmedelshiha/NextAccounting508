# Comprehensive Booking System Enhancement Plan

## Executive Summary

This implementation plan outlines the transformation of your existing accounting firm booking system into a comprehensive ServiceMarket-style platform with advanced booking capabilities, service request management, and unified client portal experience.

## Current State Analysis

Based on your audit documentation, your current system includes:
- Basic booking functionality
- Admin dashboard with task management
- Client portal with service requests
- Basic authentication and user management
- File upload capabilities with AV scanning

## Target Enhancement: ServiceMarket-Style Booking System

### Key Features to Implement:
1. **Unified Booking & Service Request Management**
2. **Advanced Scheduling & Availability**
3. **Multi-Service Booking Wizard**
4. **Dynamic Pricing Engine**
5. **Real-time Availability & Notifications**
6. **Enhanced Client Experience**

## Phase 1: Foundation & Data Model Enhancement (Weeks 1-2)

### 1.1 Database Schema Extensions

```sql
-- Enhanced Service Model
ALTER TABLE Service ADD COLUMN IF NOT EXISTS bookingEnabled BOOLEAN DEFAULT true;
ALTER TABLE Service ADD COLUMN IF NOT EXISTS advanceBookingDays INTEGER DEFAULT 30;
ALTER TABLE Service ADD COLUMN IF NOT EXISTS minAdvanceHours INTEGER DEFAULT 24;
ALTER TABLE Service ADD COLUMN IF NOT EXISTS maxDailyBookings INTEGER DEFAULT 10;
ALTER TABLE Service ADD COLUMN IF NOT EXISTS bufferTime INTEGER DEFAULT 30; -- minutes
ALTER TABLE Service ADD COLUMN IF NOT EXISTS businessHours JSON;
ALTER TABLE Service ADD COLUMN IF NOT EXISTS blackoutDates JSON;

-- Unified ServiceRequest Enhancement
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS isBooking BOOLEAN DEFAULT false;
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS scheduledAt TIMESTAMP;
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS duration INTEGER; -- minutes
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS clientName VARCHAR(255);
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS clientEmail VARCHAR(255);
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS clientPhone VARCHAR(20);
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS reminderSent BOOLEAN DEFAULT false;
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS bookingType VARCHAR(50);
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS recurringPattern JSON;
ALTER TABLE ServiceRequest ADD COLUMN IF NOT EXISTS parentBookingId VARCHAR(255);

-- New Models
CREATE TABLE IF NOT EXISTS AvailabilitySlot (
    id VARCHAR(255) PRIMARY KEY,
    serviceId VARCHAR(255) NOT NULL,
    teamMemberId VARCHAR(255),
    date DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    isAvailable BOOLEAN DEFAULT true,
    maxBookings INTEGER DEFAULT 1,
    currentBookings INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serviceId) REFERENCES Service(id),
    FOREIGN KEY (teamMemberId) REFERENCES TeamMember(id),
    UNIQUE(serviceId, teamMemberId, date, startTime)
);

CREATE TABLE IF NOT EXISTS BookingPreferences (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    reminderHours JSON DEFAULT '[24, 2]',
    preferredLanguage VARCHAR(10) DEFAULT 'en',
    timeZone VARCHAR(50) DEFAULT 'UTC',
    emailNotifications BOOLEAN DEFAULT true,
    smsNotifications BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id),
    UNIQUE(userId)
);

-- Enhanced TeamMember
ALTER TABLE TeamMember ADD COLUMN IF NOT EXISTS workingHours JSON;
ALTER TABLE TeamMember ADD COLUMN IF NOT EXISTS timeZone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE TeamMember ADD COLUMN IF NOT EXISTS maxConcurrentBookings INTEGER DEFAULT 5;
ALTER TABLE TeamMember ADD COLUMN IF NOT EXISTS bookingBuffer INTEGER DEFAULT 15; -- minutes
ALTER TABLE TeamMember ADD COLUMN IF NOT EXISTS autoAssign BOOLEAN DEFAULT false;
```

### 1.2 Enum Extensions

```typescript
enum BookingType {
  STANDARD = 'STANDARD',
  RECURRING = 'RECURRING',
  EMERGENCY = 'EMERGENCY',
  CONSULTATION = 'CONSULTATION'
}

enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}
```

### 1.3 Migration Script

```typescript
// prisma/migrations/001_booking_enhancement/migration.sql
-- Apply all schema changes above
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_request_scheduled ON ServiceRequest(scheduledAt);
CREATE INDEX IF NOT EXISTS idx_service_request_booking_type ON ServiceRequest(isBooking, bookingType);
CREATE INDEX IF NOT EXISTS idx_availability_slot_date ON AvailabilitySlot(date, serviceId);
CREATE INDEX IF NOT EXISTS idx_team_member_auto_assign ON TeamMember(autoAssign, availabilityStatus);
```

## Phase 2: Core Booking Engine (Weeks 3-4)

### 2.1 Availability Engine

```typescript
// src/lib/booking/availability.ts
interface AvailabilityRequest {
  serviceId: string;
  date: Date;
  duration: number;
  teamMemberId?: string;
  clientId?: string;
}

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  teamMemberId?: string;
  price: number;
  isRecommended: boolean;
}

class AvailabilityEngine {
  async getAvailableSlots(request: AvailabilityRequest): Promise<AvailabilitySlot[]> {
    // 1. Get service configuration
    const service = await this.getServiceConfig(request.serviceId);
    
    // 2. Check business hours and blackout dates
    if (!this.isDateAvailable(request.date, service)) {
      return [];
    }
    
    // 3. Get team member availability
    const teamMembers = await this.getAvailableTeamMembers(
      request.serviceId, 
      request.date,
      request.teamMemberId
    );
    
    // 4. Generate time slots
    const slots: AvailabilitySlot[] = [];
    for (const member of teamMembers) {
      const memberSlots = await this.generateMemberSlots(
        member,
        service,
        request.date,
        request.duration
      );
      slots.push(...memberSlots);
    }
    
    // 5. Filter conflicts and apply buffer times
    return this.filterAvailableSlots(slots, request);
  }
  
  private async getServiceConfig(serviceId: string) {
    return await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        teamMembers: {
          where: { availabilityStatus: 'AVAILABLE' }
        }
      }
    });
  }
  
  private isDateAvailable(date: Date, service: any): boolean {
    // Check blackout dates
    const blackoutDates = service.blackoutDates || [];
    if (blackoutDates.some((bd: string) => new Date(bd).toDateString() === date.toDateString())) {
      return false;
    }
    
    // Check advance booking limits
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < service.minAdvanceHours) {
      return false;
    }
    
    if (diffHours > (service.advanceBookingDays * 24)) {
      return false;
    }
    
    return true;
  }
  
  private async generateMemberSlots(
    member: any,
    service: any,
    date: Date,
    duration: number
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];
    const workingHours = member.workingHours || service.businessHours;
    
    if (!workingHours) return slots;
    
    const dayOfWeek = date.getDay();
    const daySchedule = workingHours[dayOfWeek];
    
    if (!daySchedule || !daySchedule.isWorking) return slots;
    
    // Generate slots based on working hours
    let currentTime = this.parseTime(daySchedule.startTime);
    const endTime = this.parseTime(daySchedule.endTime);
    
    while (currentTime + duration <= endTime) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      
      // Check for existing bookings
      const hasConflict = await this.hasBookingConflict(
        member.id,
        slotStart,
        slotEnd
      );
      
      if (!hasConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          teamMemberId: member.id,
          price: await this.calculateSlotPrice(service, slotStart, duration),
          isRecommended: this.isRecommendedSlot(slotStart)
        });
      }
      
      currentTime += duration + (member.bookingBuffer || 15);
    }
    
    return slots;
  }
}
```

### 2.2 Booking API Endpoints

```typescript
// src/app/api/bookings/availability/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '60');
    const teamMemberId = searchParams.get('teamMemberId');
    
    if (!serviceId || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const availabilityEngine = new AvailabilityEngine();
    const slots = await availabilityEngine.getAvailableSlots({
      serviceId,
      date: new Date(date),
      duration,
      teamMemberId: teamMemberId || undefined
    });
    
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get availability' }, { status: 500 });
  }
}

// src/app/api/bookings/route.ts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // Validate booking request
    const validatedData = await validateBookingRequest(body);
    
    // Check availability one more time
    const availabilityEngine = new AvailabilityEngine();
    const isAvailable = await availabilityEngine.isSlotAvailable(validatedData);
    
    if (!isAvailable) {
      return NextResponse.json({ 
        error: 'Selected time slot is no longer available' 
      }, { status: 409 });
    }
    
    // Create unified service request with booking data
    const booking = await prisma.serviceRequest.create({
      data: {
        ...validatedData,
        isBooking: true,
        clientId: session?.user?.id,
        status: 'PENDING'
      }
    });
    
    // Auto-assign if enabled
    if (validatedData.autoAssign) {
      await autoAssignBooking(booking.id);
    }
    
    // Send confirmation email
    await sendBookingConfirmation(booking);
    
    // Emit realtime event
    await realtimeService.emit('booking-created', {
      bookingId: booking.id,
      clientId: booking.clientId
    });
    
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### 2.3 Pricing Engine

```typescript
// src/lib/booking/pricing.ts
class PricingEngine {
  async calculateBookingPrice(request: BookingPriceRequest): Promise<PriceBreakdown> {
    const service = await this.getService(request.serviceId);
    let basePrice = service.basePrice || 0;
    
    const breakdown: PriceBreakdown = {
      basePrice,
      surcharges: [],
      discounts: [],
      total: basePrice
    };
    
    // Time-based surcharges
    if (this.isPeakHours(request.scheduledAt)) {
      const peakSurcharge = basePrice * 0.2; // 20% peak hour surcharge
      breakdown.surcharges.push({
        type: 'PEAK_HOURS',
        amount: peakSurcharge,
        description: 'Peak hours surcharge'
      });
    }
    
    // Weekend surcharge
    if (this.isWeekend(request.scheduledAt)) {
      const weekendSurcharge = basePrice * 0.15;
      breakdown.surcharges.push({
        type: 'WEEKEND',
        amount: weekendSurcharge,
        description: 'Weekend surcharge'
      });
    }
    
    // Duration-based pricing
    if (request.duration > service.standardDuration) {
      const extraTime = request.duration - service.standardDuration;
      const extraCost = (extraTime / 60) * service.hourlyRate;
      breakdown.surcharges.push({
        type: 'EXTRA_TIME',
        amount: extraCost,
        description: `Additional ${extraTime} minutes`
      });
    }
    
    // Emergency booking surcharge
    if (request.bookingType === 'EMERGENCY') {
      const emergencySurcharge = basePrice * 0.5;
      breakdown.surcharges.push({
        type: 'EMERGENCY',
        amount: emergencySurcharge,
        description: 'Emergency booking surcharge'
      });
    }
    
    // Apply discounts
    if (request.promoCode) {
      const discount = await this.validateAndApplyPromoCode(
        request.promoCode,
        breakdown.total,
        request.clientId
      );
      if (discount) {
        breakdown.discounts.push(discount);
      }
    }
    
    // Calculate final total
    const totalSurcharges = breakdown.surcharges.reduce((sum, s) => sum + s.amount, 0);
    const totalDiscounts = breakdown.discounts.reduce((sum, d) => sum + d.amount, 0);
    breakdown.total = basePrice + totalSurcharges - totalDiscounts;
    
    return breakdown;
  }
}
```

## Phase 3: Multi-Step Booking Wizard (Weeks 5-6)

### 3.1 Booking Wizard Component Architecture

```typescript
// src/components/booking/BookingWizard.tsx
interface BookingWizardProps {
  serviceId?: string;
  onComplete: (booking: BookingData) => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ serviceId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [isValid, setIsValid] = useState(false);

  const steps = [
    {
      id: 'service-selection',
      title: 'Select Service',
      component: ServiceSelectionStep,
      validation: (data: any) => !!data.serviceId
    },
    {
      id: 'datetime-selection',
      title: 'Choose Date & Time',
      component: DateTimeSelectionStep,
      validation: (data: any) => !!data.scheduledAt
    },
    {
      id: 'customer-details',
      title: 'Your Details',
      component: CustomerDetailsStep,
      validation: (data: any) => data.clientName && data.clientEmail
    },
    {
      id: 'payment',
      title: 'Payment',
      component: PaymentStep,
      validation: (data: any) => !!data.paymentMethod
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      component: ConfirmationStep,
      validation: () => true
    }
  ];

  const handleStepData = (stepData: any) => {
    const updatedData = { ...bookingData, ...stepData };
    setBookingData(updatedData);
    
    // Validate current step
    const currentStepConfig = steps[currentStep];
    setIsValid(currentStepConfig.validation(updatedData));
  };

  const nextStep = () => {
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitBooking = async () => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      if (response.ok) {
        const booking = await response.json();
        onComplete(booking);
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  return (
    <div className="booking-wizard">
      <BookingProgress 
        steps={steps.map(s => s.title)} 
        currentStep={currentStep} 
      />
      
      <div className="step-content">
        {React.createElement(steps[currentStep].component, {
          data: bookingData,
          onUpdate: handleStepData,
          onNext: nextStep,
          onPrevious: previousStep,
          onSubmit: submitBooking,
          isValid
        })}
      </div>
    </div>
  );
};
```

### 3.2 Service Selection Step

```typescript
// src/components/booking/steps/ServiceSelectionStep.tsx
const ServiceSelectionStep: React.FC<StepProps> = ({ data, onUpdate }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customizations, setCustomizations] = useState<ServiceCustomization[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?bookingEnabled=true');
      const servicesData = await response.json();
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    onUpdate({
      serviceId: service.id,
      serviceName: service.name,
      basePrice: service.basePrice,
      estimatedDuration: service.estimatedDurationHours * 60
    });
  };

  const handleCustomizationChange = (customization: ServiceCustomization) => {
    const updated = [...customizations];
    const existingIndex = updated.findIndex(c => c.id === customization.id);
    
    if (existingIndex >= 0) {
      if (customization.selected) {
        updated[existingIndex] = customization;
      } else {
        updated.splice(existingIndex, 1);
      }
    } else if (customization.selected) {
      updated.push(customization);
    }
    
    setCustomizations(updated);
    onUpdate({ customizations: updated });
  };

  return (
    <div className="service-selection-step">
      <h2>Select Your Service</h2>
      
      <div className="services-grid">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={handleServiceSelect}
          />
        ))}
      </div>

      {selectedService && (
        <div className="service-customization">
          <h3>Customize Your Service</h3>
          <ServiceCustomizer
            service={selectedService}
            customizations={customizations}
            onChange={handleCustomizationChange}
          />
        </div>
      )}
    </div>
  );
};
```

### 3.3 DateTime Selection Step

```typescript
// src/components/booking/steps/DateTimeSelectionStep.tsx
const DateTimeSelectionStep: React.FC<StepProps> = ({ data, onUpdate }) => {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = async (date: Date) => {
    if (!data.serviceId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/bookings/availability?serviceId=${data.serviceId}&date=${date.toISOString()}&duration=${data.estimatedDuration || 60}`
      );
      const { slots } = await response.json();
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchAvailability(date);
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    onUpdate({
      scheduledAt: slot.startTime,
      duration: (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60),
      teamMemberId: slot.teamMemberId,
      price: slot.price
    });
  };

  return (
    <div className="datetime-selection-step">
      <h2>Choose Date & Time</h2>
      
      <div className="datetime-selector">
        <div className="calendar-section">
          <BookingCalendar
            serviceId={data.serviceId}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            minDate={new Date()}
            maxDate={addDays(new Date(), 60)}
          />
        </div>

        <div className="time-slots-section">
          <h3>Available Times</h3>
          {loading ? (
            <div className="loading-spinner">Loading available times...</div>
          ) : availableSlots.length > 0 ? (
            <TimeSlotGrid
              slots={availableSlots}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
            />
          ) : selectedDate ? (
            <p>No available times for this date</p>
          ) : (
            <p>Please select a date to see available times</p>
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <p><strong>Service:</strong> {data.serviceName}</p>
          <p><strong>Date:</strong> {format(selectedSlot.startTime, 'MMMM d, yyyy')}</p>
          <p><strong>Time:</strong> {format(selectedSlot.startTime, 'h:mm a')} - {format(selectedSlot.endTime, 'h:mm a')}</p>
          <p><strong>Duration:</strong> {data.duration} minutes</p>
          <p><strong>Price:</strong> AED {selectedSlot.price}</p>
        </div>
      )}
    </div>
  );
};
```

## Phase 4: Advanced Features (Weeks 7-8)

### 4.1 Recurring Bookings

```typescript
// src/lib/booking/recurring.ts
interface RecurringPattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // For weekly patterns
  dayOfMonth?: number; // For monthly patterns
  endDate?: Date;
  occurrences?: number;
}

class RecurringBookingService {
  async createRecurringBooking(
    bookingData: BookingData,
    pattern: RecurringPattern
  ): Promise<BookingData[]> {
    const bookings: BookingData[] = [];
    const dates = this.generateRecurringDates(
      bookingData.scheduledAt,
      pattern
    );

    // Create parent booking
    const parentBooking = await this.createBooking({
      ...bookingData,
      recurringPattern: pattern
    });
    
    bookings.push(parentBooking);

    // Create child bookings
    for (let i = 1; i < dates.length; i++) {
      try {
        const childBooking = await this.createBooking({
          ...bookingData,
          scheduledAt: dates[i],
          parentBookingId: parentBooking.id
        });
        bookings.push(childBooking);
      } catch (error) {
        // Log conflict but continue with other dates
        console.warn(`Skipping date ${dates[i]} due to conflict:`, error);
      }
    }

    return bookings;
  }

  private generateRecurringDates(
    startDate: Date,
    pattern: RecurringPattern
  ): Date[] {
    const dates: Date[] = [startDate];
    let currentDate = new Date(startDate);
    
    const maxOccurrences = pattern.occurrences || 52; // Default 1 year
    const endDate = pattern.endDate || addYears(startDate, 1);

    for (let i = 1; i < maxOccurrences; i++) {
      switch (pattern.frequency) {
        case 'DAILY':
          currentDate = addDays(currentDate, pattern.interval);
          break;
        case 'WEEKLY':
          currentDate = addWeeks(currentDate, pattern.interval);
          // Adjust to specified day of week if needed
          if (pattern.daysOfWeek?.length) {
            currentDate = this.adjustToNextWeekday(currentDate, pattern.daysOfWeek);
          }
          break;
        case 'MONTHLY':
          currentDate = addMonths(currentDate, pattern.interval);
          // Adjust to specified day of month if needed
          if (pattern.dayOfMonth) {
            currentDate.setDate(pattern.dayOfMonth);
          }
          break;
      }

      if (currentDate > endDate) break;
      dates.push(new Date(currentDate));
    }

    return dates;
  }
}
```

### 4.2 Smart Notifications & Reminders

```typescript
// src/lib/notifications/booking-reminders.ts
class BookingReminderService {
  async scheduleReminders(booking: BookingData) {
    const preferences = await this.getClientPreferences(booking.clientId);
    const reminderTimes = preferences.reminderHours || [24, 2]; // Hours before

    for (const hours of reminderTimes) {
      const reminderTime = subHours(booking.scheduledAt, hours);
      
      if (reminderTime > new Date()) {
        await this.scheduleReminder({
          bookingId: booking.id,
          clientId: booking.clientId,
          reminderTime,
          type: hours >= 24 ? 'ADVANCE' : 'IMMEDIATE',
          channels: this.getPreferredChannels(preferences, hours)
        });
      }
    }
  }

  private getPreferredChannels(preferences: any, hoursBefor: number) {
    const channels = [];
    
    if (preferences.emailNotifications) {
      channels.push('EMAIL');
    }
    
    if (preferences.smsNotifications && hoursBefor <= 4) {
      channels.push('SMS'); // SMS only for immediate reminders
    }
    
    return channels;
  }
}

// Cron job for sending reminders
// src/app/api/cron/send-reminders/route.ts
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-cron-secret');
  if (authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const upcomingWindow = addMinutes(now, 15); // 15-minute window

    const reminders = await prisma.scheduledReminder.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: upcomingWindow
        },
        sent: false
      },
      include: {
        booking: {
          include: { client: true, service: true }
        }
      }
    });

    const results = await Promise.allSettled(
      reminders.map(reminder => this.sendReminder(reminder))
    );

    return NextResponse.json({
      processed: reminders.length,
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    });
  } catch (error) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.3 Advanced Calendar Integration

```typescript
// src/lib/calendar/ics-generator.ts
class ICSGenerator {
  generateBookingICS(booking: BookingData): string {
    const startTime = booking.scheduledAt;
    const endTime = addMinutes(startTime, booking.duration);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your Company//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@yourcompany.com`,
      `DTSTAMP:${this.formatICSDate(new Date())}`,
      `DTSTART:${this.formatICSDate(startTime)}`,
      `DTEND:${this.formatICSDate(endTime)}`,
      `SUMMARY:${booking.serviceName} - ${booking.clientName}`,
      `DESCRIPTION:${this.generateDescription(booking)}`,
      `LOCATION:${booking.location || 'TBD'}`,
      `ORGANIZER;CN=Your Company:mailto:bookings@yourcompany.com`,
      `ATTENDEE;CN=${booking.clientName}:mailto:${booking.clientEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
  }

  private formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  private generateDescription(booking: BookingData): string {
    const lines = [
      `Service: ${booking.serviceName}`,
      `Client: ${booking.clientName}`,
      `Duration: ${booking.duration} minutes`,
      `Booking ID: ${booking.id}`
    ];

    if (booking.notes) {
      lines.push(`Notes: ${booking.notes}`);
    }

    return lines.join('\\n');
  }
}
```

### 4.4 Conflict Detection & Resolution

```typescript
// src/lib/booking/conflict-detection.ts
interface ConflictRule {
  id: string;
  name: string;
  check: (booking: BookingData, existing: BookingData[]) => ConflictResult;
  severity: 'WARNING' | 'ERROR';
}

class ConflictDetectionService {
  private rules: ConflictRule[] = [
    {
      id: 'double-booking',
      name: 'Double Booking',
      severity: 'ERROR',
      check: (booking, existing) => {
        const conflicts = existing.filter(b => 
          b.teamMemberId === booking.teamMemberId &&
          this.timesOverlap(booking, b)
        );
        return {
          hasConflict: conflicts.length > 0,
          conflicts,
          message: conflicts.length > 0 ? 
            `Team member already has ${conflicts.length} booking(s) at this time` : ''
        };
      }
    },
    {
      id: 'buffer-violation',
      name: 'Buffer Time Violation',
      severity: 'WARNING',
      check: (booking, existing) => {
        const teamMember = this.getTeamMember(booking.teamMemberId);
        const bufferMinutes = teamMember?.bookingBuffer || 15;
        
        const tooClose = existing.filter(b => {
          if (b.teamMemberId !== booking.teamMemberId) return false;
          
          const bookingEnd = addMinutes(booking.scheduledAt, booking.duration);
          const existingStart = b.scheduledAt;
          const existingEnd = addMinutes(b.scheduledAt, b.duration);
          
          // Check if new booking ends too close to existing booking start
          const minutesUntilNext = differenceInMinutes(existingStart, bookingEnd);
          // Check if new booking starts too close to existing booking end  
          const minutesAfterPrevious = differenceInMinutes(booking.scheduledAt, existingEnd);
          
          return (minutesUntilNext > 0 && minutesUntilNext < bufferMinutes) ||
                 (minutesAfterPrevious > 0 && minutesAfterPrevious < bufferMinutes);
        });
        
        return {
          hasConflict: tooClose.length > 0,
          conflicts: tooClose,
          message: tooClose.length > 0 ? 
            `Insufficient buffer time between bookings` : ''
        };
      }
    },
    {
      id: 'capacity-exceeded',
      name: 'Daily Capacity Exceeded',
      severity: 'WARNING',
      check: (booking, existing) => {
        const service = this.getService(booking.serviceId);
        const maxDaily = service?.maxDailyBookings || Infinity;
        
        const sameDay = existing.filter(b =>
          b.serviceId === booking.serviceId &&
          isSameDay(b.scheduledAt, booking.scheduledAt)
        );
        
        return {
          hasConflict: sameDay.length >= maxDaily,
          conflicts: sameDay,
          message: sameDay.length >= maxDaily ?
            `Daily booking limit (${maxDaily}) exceeded for this service` : ''
        };
      }
    }
  ];

  async detectConflicts(booking: BookingData): Promise<ConflictReport> {
    // Get existing bookings for the relevant time period and team member
    const timeWindow = {
      start: subHours(booking.scheduledAt, 2),
      end: addHours(booking.scheduledAt, booking.duration / 60 + 2)
    };
    
    const existingBookings = await prisma.serviceRequest.findMany({
      where: {
        isBooking: true,
        scheduledAt: {
          gte: timeWindow.start,
          lte: timeWindow.end
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    });

    const conflicts: ConflictResult[] = [];
    const warnings: ConflictResult[] = [];

    for (const rule of this.rules) {
      const result = rule.check(booking, existingBookings);
      if (result.hasConflict) {
        if (rule.severity === 'ERROR') {
          conflicts.push({ ...result, rule: rule.name });
        } else {
          warnings.push({ ...result, rule: rule.name });
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      hasWarnings: warnings.length > 0,
      conflicts,
      warnings,
      canProceed: conflicts.length === 0
    };
  }
}
```

## Phase 5: Real-time Features & WebSockets (Week 9)

### 5.1 Real-time Availability Updates

```typescript
// src/lib/realtime/booking-events.ts
class BookingRealtimeService {
  async onBookingCreated(booking: BookingData) {
    // Notify availability changes to other users viewing the same time slots
    await this.broadcastAvailabilityChange(booking);
    
    // Notify team member assignment
    if (booking.teamMemberId) {
      await this.notifyTeamMember(booking.teamMemberId, {
        type: 'BOOKING_ASSIGNED',
        booking
      });
    }
    
    // Update admin dashboard metrics
    await this.updateDashboardMetrics();
  }

  async onBookingUpdated(booking: BookingData, changes: Partial<BookingData>) {
    // If time/date changed, update availability
    if (changes.scheduledAt || changes.duration) {
      await this.broadcastAvailabilityChange(booking);
    }
    
    // If assignment changed, notify both old and new team members
    if (changes.teamMemberId) {
      if (booking.teamMemberId) {
        await this.notifyTeamMember(booking.teamMemberId, {
          type: 'BOOKING_ASSIGNED',
          booking
        });
      }
      // Notify previous team member if reassigned
    }
    
    // Always notify client of changes
    await this.notifyClient(booking.clientId, {
      type: 'BOOKING_UPDATED',
      booking,
      changes
    });
  }

  private async broadcastAvailabilityChange(booking: BookingData) {
    const affectedDate = format(booking.scheduledAt, 'yyyy-MM-dd');
    
    // Broadcast to all users viewing this service's availability on this date
    await realtimeService.broadcast(`availability:${booking.serviceId}:${affectedDate}`, {
      type: 'AVAILABILITY_CHANGED',
      serviceId: booking.serviceId,
      date: affectedDate,
      teamMemberId: booking.teamMemberId
    });
  }
}

// WebSocket endpoint
// src/app/api/ws/bookings/route.ts
export async function GET(request: NextRequest) {
  const { socket, response } = await setupWebSocket(request);
  
  if (!socket) return response;

  const session = await getServerSession();
  if (!session) {
    socket.close(1008, 'Authentication required');
    return response;
  }

  // Subscribe to relevant channels based on user role
  const subscriptions: string[] = [];
  
  if (session.user.role === 'CLIENT') {
    subscriptions.push(`client:${session.user.id}`);
  } else if (['TEAM_MEMBER', 'TEAM_LEAD', 'ADMIN'].includes(session.user.role)) {
    subscriptions.push(`team:${session.user.id}`);
    subscriptions.push('dashboard:metrics');
  }

  // Handle subscription requests
  socket.on('subscribe', (channel: string) => {
    if (this.canSubscribe(session.user, channel)) {
      subscriptions.push(channel);
      realtimeService.subscribe(channel, (data) => {
        socket.send(JSON.stringify({
          channel,
          data
        }));
      });
    }
  });

  return response;
}
```

### 5.2 Live Chat Support

```typescript
// src/components/booking/LiveChatSupport.tsx
const LiveChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const { socket } = useWebSocket(`/api/ws/chat`, {
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'chat-message') {
        setMessages(prev => [...prev, message.data]);
      }
    }
  });

  const sendMessage = () => {
    if (!currentMessage.trim() || !socket) return;
    
    const message: ChatMessage = {
      id: generateId(),
      text: currentMessage,
      userId: user.id,
      userName: user.name,
      timestamp: new Date(),
      type: 'user'
    };

    socket.send(JSON.stringify({
      type: 'chat-message',
      data: message
    }));

    setMessages(prev => [...prev, message]);
    setCurrentMessage('');
  };

  return (
    <>
      <ChatTriggerButton 
        onClick={() => setIsOpen(true)}
        isConnected={isConnected}
        unreadCount={0}
      />
      
      {isOpen && (
        <ChatWindow
          messages={messages}
          currentMessage={currentMessage}
          onMessageChange={setCurrentMessage}
          onSendMessage={sendMessage}
          onClose={() => setIsOpen(false)}
          isConnected={isConnected}
        />
      )}
    </>
  );
};
```

## Phase 6: Mobile Optimization & PWA (Week 10)

### 6.1 Progressive Web App Configuration

```typescript
// public/manifest.json
{
  "name": "Accounting Firm Booking System",
  "short_name": "BookingSystem",
  "description": "Professional accounting services booking platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Book Service",
      "short_name": "Book",
      "description": "Book a new accounting service",
      "url": "/book",
      "icons": [{ "src": "/icons/book-192.png", "sizes": "192x192" }]
    },
    {
      "name": "My Bookings",
      "short_name": "Bookings",
      "description": "View your current bookings",
      "url": "/portal/bookings",
      "icons": [{ "src": "/icons/bookings-192.png", "sizes": "192x192" }]
    }
  ]
}

// src/app/layout.tsx - PWA Integration
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Accounting Firm Booking System',
  description: 'Professional accounting services booking platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BookingSystem'
  }
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};
```

### 6.2 Offline Support

```typescript
// src/lib/offline/booking-cache.ts
class OfflineBookingCache {
  private db: IDBDatabase | null = null;
  
  async initialize() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('BookingSystemDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Services cache
        if (!db.objectStoreNames.contains('services')) {
          const servicesStore = db.createObjectStore('services', { keyPath: 'id' });
          servicesStore.createIndex('category', 'category');
        }
        
        // Pending bookings (offline mode)
        if (!db.objectStoreNames.contains('pendingBookings')) {
          const pendingStore = db.createObjectStore('pendingBookings', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'createdAt');
        }
        
        // User bookings cache
        if (!db.objectStoreNames.contains('userBookings')) {
          const bookingsStore = db.createObjectStore('userBookings', { keyPath: 'id' });
          bookingsStore.createIndex('userId', 'userId');
          bookingsStore.createIndex('status', 'status');
        }
      };
    });
  }

  async cacheServices(services: Service[]) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['services'], 'readwrite');
    const store = transaction.objectStore('services');
    
    for (const service of services) {
      await store.put({
        ...service,
        cachedAt: new Date()
      });
    }
  }

  async getCachedServices(): Promise<Service[]> {
    if (!this.db) return [];
    
    const transaction = this.db.transaction(['services'], 'readonly');
    const store = transaction.objectStore('services');
    const request = store.getAll();
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async savePendingBooking(booking: BookingData) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pendingBookings'], 'readwrite');
    const store = transaction.objectStore('pendingBookings');
    
    await store.put({
      ...booking,
      id: `offline-${Date.now()}`,
      status: 'PENDING_SYNC',
      createdAt: new Date()
    });
  }

  async getPendingBookings(): Promise<BookingData[]> {
    if (!this.db) return [];
    
    const transaction = this.db.transaction(['pendingBookings'], 'readonly');
    const store = transaction.objectStore('pendingBookings');
    const request = store.getAll();
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }
}

// Service Worker for offline functionality
// public/sw.js
const CACHE_NAME = 'booking-system-v1';
const STATIC_ASSETS = [
  '/',
  '/book',
  '/portal',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Try network first for API calls
        if (event.request.url.includes('/api/')) {
          return fetch(event.request)
            .catch(() => {
              // Return offline response for critical endpoints
              if (event.request.url.includes('/api/services')) {
                return new Response(
                  JSON.stringify({ offline: true, services: [] }),
                  { headers: { 'Content-Type': 'application/json' } }
                );
              }
            });
        }
        
        return fetch(event.request);
      })
  );
});
```

### 6.3 Touch-Optimized UI Components

```typescript
// src/components/mobile/TouchCalendar.tsx
const TouchCalendar: React.FC<TouchCalendarProps> = ({
  onDateSelect,
  availableDates,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [touchStart, setTouchStart] = useState<TouchEvent | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.nativeEvent);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.nativeEvent.changedTouches[0];
    const touchStart = this.touchStart.changedTouches[0];
    
    const deltaX = touchEnd.clientX - touchStart.clientX;
    const deltaY = Math.abs(touchEnd.clientY - touchStart.clientY);
    
    // Horizontal swipe detected
    if (Math.abs(deltaX) > 50 && deltaY < 50) {
      if (deltaX > 0) {
        // Swipe right - previous month
        setCurrentMonth(subMonths(currentMonth, 1));
      } else {
        // Swipe left - next month  
        setCurrentMonth(addMonths(currentMonth, 1));
      }
    }
  };

  return (
    <div 
      className="touch-calendar"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CalendarHeader 
        month={currentMonth}
        onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
      />
      
      <CalendarGrid
        month={currentMonth}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        touchOptimized={true}
      />
    </div>
  );
};

// src/components/mobile/SwipeableTimeSlots.tsx
const SwipeableTimeSlots: React.FC<SwipeableTimeSlotsProps> = ({
  slots,
  onSlotSelect
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slotsPerView = 3; // Show 3 time slots at once on mobile
  
  const nextSlots = () => {
    setCurrentIndex(prev => 
      Math.min(prev + slotsPerView, slots.length - slotsPerView)
    );
  };
  
  const prevSlots = () => {
    setCurrentIndex(prev => Math.max(prev - slotsPerView, 0));
  };

  const visibleSlots = slots.slice(currentIndex, currentIndex + slotsPerView);

  return (
    <div className="swipeable-time-slots">
      <div className="slots-navigation">
        <button 
          onClick={prevSlots}
          disabled={currentIndex === 0}
          className="nav-button prev"
        >
          ←
        </button>
        
        <div className="slots-container">
          {visibleSlots.map(slot => (
            <TouchTimeSlot
              key={`${slot.startTime}-${slot.teamMemberId}`}
              slot={slot}
              onSelect={onSlotSelect}
            />
          ))}
        </div>
        
        <button
          onClick={nextSlots}
          disabled={currentIndex + slotsPerView >= slots.length}
          className="nav-button next"
        >
          →
        </button>
      </div>
      
      <div className="slots-indicator">
        {Array.from({ length: Math.ceil(slots.length / slotsPerView) }, (_, i) => (
          <div
            key={i}
            className={`indicator-dot ${
              Math.floor(currentIndex / slotsPerView) === i ? 'active' : ''
            }`}
            onClick={() => setCurrentIndex(i * slotsPerView)}
          />
        ))}
      </div>
    </div>
  );
};
```

## Phase 7: Analytics & Reporting (Week 11)

### 7.1 Booking Analytics Dashboard

```typescript
// src/components/analytics/BookingAnalyticsDashboard.tsx
const BookingAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);

  const { data: bookingMetrics } = useSWR(
    `/api/admin/analytics/bookings?timeRange=${timeRange}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  return (
    <div className="booking-analytics-dashboard">
      <div className="analytics-header">
        <h2>Booking Analytics</h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Bookings"
          value={bookingMetrics?.totalBookings}
          change={bookingMetrics?.bookingsChange}
          trend="up"
        />
        <MetricCard
          title="Revenue"
          value={`AED ${bookingMetrics?.totalRevenue?.toLocaleString()}`}
          change={bookingMetrics?.revenueChange}
          trend="up"
        />
        <MetricCard
          title="Avg. Booking Value"
          value={`AED ${bookingMetrics?.avgBookingValue}`}
          change={bookingMetrics?.avgValueChange}
        />
        <MetricCard
          title="Cancellation Rate"
          value={`${bookingMetrics?.cancellationRate}%`}
          change={bookingMetrics?.cancellationChange}
          trend="down"
        />
      </div>

      <div className="charts-grid">
        <ChartCard title="Booking Trends">
          <BookingTrendsChart data={bookingMetrics?.trends} />
        </ChartCard>
        
        <ChartCard title="Service Popularity">
          <ServicePopularityChart data={bookingMetrics?.serviceStats} />
        </ChartCard>
        
        <ChartCard title="Peak Hours">
          <PeakHoursHeatmap data={bookingMetrics?.hourlyDistribution} />
        </ChartCard>
        
        <ChartCard title="Team Performance">
          <TeamPerformanceChart data={bookingMetrics?.teamStats} />
        </ChartCard>
      </div>

      <div className="detailed-reports">
        <BookingConversionFunnel data={bookingMetrics?.conversionData} />
        <BookingSourceAnalysis data={bookingMetrics?.sourceAnalysis} />
        <CustomerSegmentAnalysis data={bookingMetrics?.customerSegments} />
      </div>
    </div>
  );
};

// Analytics API endpoint
// src/app/api/admin/analytics/bookings/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user, 'ANALYTICS_VIEW')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    const dateRanges = {
      '7d': subDays(new Date(), 7),
      '30d': subDays(new Date(), 30), 
      '90d': subDays(new Date(), 90),
      '1y': subDays(new Date(), 365)
    };
    
    const startDate = dateRanges[timeRange as keyof typeof dateRanges];
    const endDate = new Date();

    // Get booking metrics
    const [
      totalBookings,
      totalRevenue,
      trends,
      serviceStats,
      hourlyDistribution,
      teamStats,
      conversionData
    ] = await Promise.all([
      // Total bookings
      prisma.serviceRequest.count({
        where: {
          isBooking: true,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      // Total revenue
      prisma.serviceRequest.aggregate({
        where: {
          isBooking: true,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { finalPrice: true }
      }),
      
      // Daily trends
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          SUM(final_price) as revenue
        FROM service_request 
        WHERE is_booking = true 
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
      
      // Service popularity
      prisma.serviceRequest.groupBy({
        by: ['serviceId'],
        where: {
          isBooking: true,
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { id: true },
        _sum: { finalPrice: true }
      }),
      
      // Hourly distribution
      prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM scheduled_at) as hour,
          EXTRACT(DOW FROM scheduled_at) as day_of_week,
          COUNT(*) as booking_count
        FROM service_request
        WHERE is_booking = true 
        AND scheduled_at >= ${startDate}
        AND scheduled_at <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM scheduled_at), EXTRACT(DOW FROM scheduled_at)
      `,
      
      // Team member performance
      prisma.serviceRequest.groupBy({
        by: ['assignedTeamMemberId'],
        where: {
          isBooking: true,
          assignedTeamMemberId: { not: null },
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { id: true },
        _sum: { finalPrice: true },
        _avg: { finalPrice: true }
      }),
      
      // Conversion funnel data
      this.getConversionFunnelData(startDate, endDate)
    ]);

    // Calculate changes from previous period
    const previousPeriodStart = subDays(startDate, 
      differenceInDays(endDate, startDate)
    );
    
    const previousBookings = await prisma.serviceRequest.count({
      where: {
        isBooking: true,
        createdAt: { gte: previousPeriodStart, lt: startDate }
      }
    });

    const bookingsChange = totalBookings > 0 ? 
      ((totalBookings - previousBookings) / previousBookings) * 100 : 0;

    return NextResponse.json({
      totalBookings,
      bookingsChange,
      totalRevenue: totalRevenue._sum.finalPrice || 0,
      avgBookingValue: totalRevenue._sum.finalPrice ? 
        totalRevenue._sum.finalPrice / totalBookings : 0,
      trends,
      serviceStats,
      hourlyDistribution,
      teamStats,
      conversionData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics' 
    }, { status: 500 });
  }
}
```

### 7.2 Predictive Analytics

```typescript
// src/lib/analytics/predictive-models.ts
class PredictiveAnalyticsService {
  async predictDemand(serviceId: string, forecastDays: number = 30): Promise<DemandForecast[]> {
    // Get historical booking data
    const historicalData = await prisma.serviceRequest.findMany({
      where: {
        serviceId,
        isBooking: true,
        createdAt: {
          gte: subDays(new Date(), 365) // 1 year of history
        }
      },
      select: {
        createdAt: true,
        scheduledAt: true,
        finalPrice: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Simple moving average prediction (can be replaced with ML models)
    const forecast = this.generateMovingAverageForecast(
      historicalData,
      forecastDays
    );

    return forecast;
  }

  async identifyPeakPeriods(serviceId: string): Promise<PeakPeriod[]> {
    const hourlyData = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM scheduled_at) as hour,
        EXTRACT(DOW FROM scheduled_at) as day_of_week,
        COUNT(*) as booking_count,
        AVG(final_price) as avg_price
      FROM service_request
      WHERE service_id = ${serviceId}
      AND is_booking = true 
      AND scheduled_at >= ${subMonths(new Date(), 6)}
      GROUP BY 
        EXTRACT(HOUR FROM scheduled_at), 
        EXTRACT(DOW FROM scheduled_at)
      ORDER BY booking_count DESC
    ` as any[];

    // Identify peak periods (booking count > average + 1 std dev)
    const avgBookings = hourlyData.reduce((sum, d) => sum + Number(d.booking_count), 0) / hourlyData.length;
    const variance = hourlyData.reduce((sum, d) => sum + Math.pow(Number(d.booking_count) - avgBookings, 2), 0) / hourlyData.length;
    const stdDev = Math.sqrt(variance);
    const peakThreshold = avgBookings + stdDev;

    return hourlyData
      .filter(d => Number(d.booking_count) > peakThreshold)
      .map(d => ({
        hour: Number(d.hour),
        dayOfWeek: Number(d.day_of_week),
        bookingCount: Number(d.booking_count),
        avgPrice: Number(d.avg_price),
        intensity: (Number(d.booking_count) - avgBookings) / stdDev
      }));
  }

  async recommendOptimalPricing(serviceId: string): Promise<PricingRecommendation[]> {
    // Analyze price elasticity and demand correlation
    const pricePerformanceData = await prisma.$queryRaw`
      SELECT 
        price_tier,
        COUNT(*) as booking_count,
        AVG(final_price) as avg_price,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_booking_speed_hours
      FROM (
        SELECT 
          final_price,
          CASE 
            WHEN final_price < 100 THEN 'low'
            WHEN final_price < 300 THEN 'medium'  
            ELSE 'high'
          END as price_tier,
          created_at,
          updated_at
        FROM service_request
        WHERE service_id = ${serviceId}
        AND is_booking = true
        AND created_at >= ${subMonths(new Date(), 3)}
      ) categorized
      GROUP BY price_tier
    ` as any[];

    return pricePerformanceData.map(d => ({
      priceTier: d.price_tier,
      currentPrice: Number(d.avg_price),
      bookingVolume: Number(d.booking_count),
      conversionSpeed: Number(d.avg_booking_speed_hours),
      recommendedAdjustment: this.calculatePriceAdjustment(d),
      confidence: this.calculateConfidence(d)
    }));
  }

  private calculatePriceAdjustment(data: any): number {
    // Simple elasticity-based recommendation
    const volumeToSpeedRatio = Number(data.booking_count) / Number(data.avg_booking_speed_hours);
    
    if (volumeToSpeedRatio > 10) {
      return 0.1; // Increase price by 10%
    } else if (volumeToSpeedRatio < 2) {
      return -0.05; // Decrease price by 5%
    }
    
    return 0; // No change recommended
  }
}
```

### 7.3 Customer Behavior Analytics

```typescript
// src/lib/analytics/customer-behavior.ts
class CustomerBehaviorAnalytics {
  async analyzeBookingPatterns(clientId: string): Promise<CustomerProfile> {
    const bookings = await prisma.serviceRequest.findMany({
      where: {
        clientId,
        isBooking: true
      },
      include: {
        service: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const profile: CustomerProfile = {
      totalBookings: bookings.length,
      averageBookingValue: this.calculateAverageValue(bookings),
      preferredServices: this.analyzeServicePreferences(bookings),
      bookingFrequency: this.calculateBookingFrequency(bookings),
      seasonalPatterns: this.identifySeasonalPatterns(bookings),
      peakBookingTimes: this.identifyPeakTimes(bookings),
      cancellationRate: this.calculateCancellationRate(bookings),
      loyaltyScore: this.calculateLoyaltyScore(bookings),
      predictedLifetimeValue: this.predictLifetimeValue(bookings),
      churnRisk: this.assessChurnRisk(bookings),
      recommendedServices: await this.generateServiceRecommendations(clientId, bookings)
    };

    return profile;
  }

  private identifySeasonalPatterns(bookings: BookingData[]): SeasonalPattern[] {
    const monthlyData = new Map<number, number>();
    
    bookings.forEach(booking => {
      const month = new Date(booking.createdAt).getMonth();
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    const avgBookingsPerMonth = bookings.length / 12;
    const patterns: SeasonalPattern[] = [];

    monthlyData.forEach((count, month) => {
      const deviation = (count - avgBookingsPerMonth) / avgBookingsPerMonth;
      if (Math.abs(deviation) > 0.5) { // 50% deviation threshold
        patterns.push({
          month,
          pattern: deviation > 0 ? 'high' : 'low',
          intensity: Math.abs(deviation),
          bookingCount: count
        });
      }
    });

    return patterns;
  }

  private calculateLoyaltyScore(bookings: BookingData[]): number {
    if (bookings.length === 0) return 0;

    const factors = {
      frequency: Math.min(bookings.length / 10, 1), // Max score at 10+ bookings
      recency: this.calculateRecencyScore(bookings),
      consistency: this.calculateConsistencyScore(bookings),
      valueGrowth: this.calculateValueGrowthScore(bookings)
    };

    // Weighted average
    return Math.round(
      (factors.frequency * 0.3 + 
       factors.recency * 0.3 + 
       factors.consistency * 0.2 + 
       factors.valueGrowth * 0.2) * 100
    );
  }

  private assessChurnRisk(bookings: BookingData[]): ChurnRisk {
    const lastBooking = bookings[0]; // Most recent
    const daysSinceLastBooking = differenceInDays(new Date(), lastBooking.createdAt);
    
    const averageGapDays = this.calculateAverageBookingGap(bookings);
    const expectedNextBooking = addDays(lastBooking.createdAt, averageGapDays);
    const daysOverdue = differenceInDays(new Date(), expectedNextBooking);

    let risk: 'low' | 'medium' | 'high' = 'low';
    let score = 0;

    if (daysOverdue > averageGapDays * 2) {
      risk = 'high';
      score = Math.min(100, 50 + (daysOverdue / averageGapDays) * 10);
    } else if (daysOverdue > averageGapDays * 0.5) {
      risk = 'medium';  
      score = Math.min(50, 25 + (daysOverdue / averageGapDays) * 5);
    } else {
      score = Math.max(0, 25 - (daysSinceLastBooking / averageGapDays) * 5);
    }

    return {
      level: risk,
      score,
      daysSinceLastBooking,
      expectedNextBookingDate: expectedNextBooking,
      factors: this.identifyChurnFactors(bookings)
    };
  }

  async generateServiceRecommendations(
    clientId: string, 
    bookings: BookingData[]
  ): Promise<ServiceRecommendation[]> {
    // Collaborative filtering - find similar customers
    const similarCustomers = await this.findSimilarCustomers(clientId, bookings);
    
    // Content-based filtering - analyze current preferences
    const preferredCategories = this.extractPreferredCategories(bookings);
    
    // Get services not yet booked by this customer
    const bookedServiceIds = bookings.map(b => b.serviceId);
    const candidateServices = await prisma.service.findMany({
      where: {
        id: { notIn: bookedServiceIds },
        bookingEnabled: true,
        status: 'ACTIVE'
      }
    });

    const recommendations = candidateServices.map(service => ({
      service,
      score: this.calculateRecommendationScore(service, bookings, similarCustomers),
      reason: this.generateRecommendationReason(service, bookings)
    }));

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recommendations
  }
}
```

## Phase 8: Advanced Payment Integration (Week 12)

### 8.1 Multi-Payment Gateway Support

```typescript
// src/lib/payments/payment-processor.ts
interface PaymentGateway {
  id: string;
  name: string;
  supportedMethods: PaymentMethod[];
  currencies: string[];
  fees: PaymentFees;
  process(request: PaymentRequest): Promise<PaymentResult>;
  refund(transactionId: string, amount?: number): Promise<RefundResult>;
  getStatus(transactionId: string): Promise<PaymentStatus>;
}

class PaymentProcessor {
  private gateways: Map<string, PaymentGateway> = new Map();
  
  constructor() {
    // Register payment gateways
    this.registerGateway(new NetworkInternationalGateway());
    this.registerGateway(new PayFortGateway());
    this.registerGateway(new StripeGateway());
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Select optimal gateway based on criteria
    const gateway = this.selectOptimalGateway(request);
    
    try {
      const result = await gateway.process(request);
      
      // Log transaction
      await this.logTransaction(request, result, gateway.id);
      
      return result;
    } catch (error) {
      // Try fallback gateway if available
      const fallbackGateway = this.getFallbackGateway(gateway.id, request);
      if (fallbackGateway) {
        return await fallbackGateway.process(request);
      }
      
      throw error;
    }
  }

  private selectOptimalGateway(request: PaymentRequest): PaymentGateway {
    const criteria = {
      currency: request.currency,
      amount: request.amount,
      method: request.paymentMethod,
      region: request.billingAddress?.country || 'AE'
    };

    // UAE-specific routing
    if (criteria.region === 'AE') {
      if (criteria.amount > 5000) {
        return this.gateways.get('network-international')!; // Lower fees for high amounts
      }
      return this.gateways.get('payfort')!; // Best local support
    }
    
    // International payments
    return this.gateways.get('stripe')!;
  }
}

// Network International Gateway Implementation
class NetworkInternationalGateway implements PaymentGateway {
  id = 'network-international';
  name = 'Network International (N-Genius)';
  supportedMethods = ['CREDIT_CARD', 'DEBIT_CARD'];
  currencies = ['AED', 'SAR', 'USD', 'EUR'];
  fees = { fixed: 0, percentage: 2.9 };

  async process(request: PaymentRequest): Promise<PaymentResult> {
    const payload = {
      action: 'PURCHASE',
      amount: {
        currencyCode: request.currency,
        value: Math.round(request.amount * 100) // Convert to cents
      },
      merchantAttributes: {
        redirectUrl: `${process.env.NEXTAUTH_URL}/payment/callback`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancelled`,
        skipConfirmationPage: true
      },
      emailAddress: request.customerEmail,
      billingAddress: this.formatAddress(request.billingAddress),
      merchantOrderReference: request.bookingId
    };

    const response = await fetch(`${process.env.NI_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAccessToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new PaymentError(data.message || 'Payment failed');
    }

    return {
      success: true,
      transactionId: data.reference,
      paymentUrl: data._links.payment.href,
      status: 'PENDING_3DS',
      gatewayResponse: data
    };
  }

  private async getAccessToken(): Promise<string> {
    // Implement OAuth token retrieval
    const response = await fetch(`${process.env.NI_API_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NI_API_KEY}:${process.env.NI_API_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  }
}
```

### 8.2 Dynamic Pricing & Promotions

```typescript
// src/lib/pricing/dynamic-pricing-engine.ts
class DynamicPricingEngine {
  async calculateDynamicPrice(request: PricingRequest): Promise<DynamicPriceResult> {
    const basePrice = await this.getBasePrice(request.serviceId);
    const modifiers: PriceModifier[] = [];

    // Time-based pricing
    const timeModifier = this.getTimeBasedModifier(request.scheduledAt);
    if (timeModifier.factor !== 1) {
      modifiers.push(timeModifier);
    }

    // Demand-based pricing
    const demandModifier = await this.getDemandBasedModifier(request);
    if (demandModifier.factor !== 1) {
      modifiers.push(demandModifier);
    }

    // Customer-specific pricing
    const customerModifier = await this.getCustomerModifier(request.customerId);
    if (customerModifier.factor !== 1) {
      modifiers.push(customerModifier);
    }

    // Apply promotional codes
    const promoModifier = await this.getPromoModifier(request.promoCode, request.customerId);
    if (promoModifier) {
      modifiers.push(promoModifier);
    }

    // Calculate final price
    let finalPrice = basePrice;
    const appliedModifiers: AppliedModifier[] = [];

    for (const modifier of modifiers) {
      const adjustment = this.calculateAdjustment(finalPrice, modifier);
      finalPrice += adjustment;
      
      appliedModifiers.push({
        type: modifier.type,
        description: modifier.description,
        factor: modifier.factor,
        adjustment,
        finalPrice
      });
    }

    return {
      basePrice,
      finalPrice: Math.max(finalPrice, basePrice * 0.5), // Never below 50% of base
      modifiers: appliedModifiers,
      validUntil: addMinutes(new Date(), 15), // Price valid for 15 minutes
      priceId: this.generatePriceId(request, appliedModifiers)
    };
  }

  private async getDemandBasedModifier(request: PricingRequest): Promise<PriceModifier> {
    // Check current demand for the requested time slot
    const timeWindow = {
      start: startOfHour(request.scheduledAt),
      end: endOfHour(request.scheduledAt)
    };

    const [currentBookings, historicalAverage] = await Promise.all([
      prisma.serviceRequest.count({
        where: {
          serviceId: request.serviceId,
          isBooking: true,
          scheduledAt: {
            gte: timeWindow.start,
            lte: timeWindow.end
          },
          status: { notIn: ['CANCELLED'] }
        }
      }),
      
      // Get average bookings for this hour over the past month
      this.getHistoricalAverageForHour(
        request.serviceId,
        request.scheduledAt.getHours(),
        request.scheduledAt.getDay()
      )
    ]);

    const demandRatio = historicalAverage > 0 ? currentBookings / historicalAverage : 1;
    
    let factor = 1;
    let description = '';

    if (demandRatio >= 1.5) {
      factor = 1.2; // 20% surcharge for high demand
      description = 'High demand surcharge';
    } else if (demandRatio <= 0.5) {
      factor = 0.9; // 10% discount for low demand
      description = 'Low demand discount';
    }

    return {
      type: 'DEMAND',
      factor,
      description
    };
  }

  private async getCustomerModifier(customerId: string): Promise<PriceModifier> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        serviceRequests: {
          where: { isBooking: true, status: 'COMPLETED' },
          select: { finalPrice: true }
        }
      }
    });

    if (!customer) {
      return { type: 'CUSTOMER', factor: 1, description: '' };
    }

    const totalSpent = customer.serviceRequests.reduce((sum, sr) => sum + (sr.finalPrice || 0), 0);
    const bookingCount = customer.serviceRequests.length;

    // VIP customer discounts
    if (totalSpent > 10000 || bookingCount > 20) {
      return {
        type: 'CUSTOMER',
        factor: 0.85, // 15% VIP discount
        description: 'VIP customer discount'
      };
    } else if (totalSpent > 5000 || bookingCount > 10) {
      return {
        type: 'CUSTOMER', 
        factor: 0.95, // 5% loyal customer discount
        description: 'Loyal customer discount'
      };
    } else if (bookingCount === 0) {
      return {
        type: 'CUSTOMER',
        factor: 0.9, // 10% new customer discount
        description: 'First-time customer discount'
      };
    }

    return { type: 'CUSTOMER', factor: 1, description: '' };
  }

  async createSmartPromotion(params: SmartPromoParams): Promise<Promotion> {
    // AI-driven promotion creation based on business goals
    const analytics = await this.getRecentAnalytics(params.serviceId);
    
    const promotion: Promotion = {
      id: generateId(),
      name: params.name || this.generatePromoName(analytics),
      code: params.code || this.generatePromoCode(),
      type: this.determineOptimalPromoType(analytics, params.goal),
      value: this.calculateOptimalDiscount(analytics, params.goal),
      conditions: this.generateSmartConditions(analytics, params),
      validFrom: params.startDate || new Date(),
      validUntil: params.endDate || addDays(new Date(), 30),
      maxUses: params.maxUses || this.calculateOptimalMaxUses(analytics),
      serviceId: params.serviceId,
      targetSegment: params.targetSegment || this.identifyTargetSegment(analytics)
    };

    await prisma.promotion.create({ data: promotion });
    
    return promotion;
  }

  private determineOptimalPromoType(analytics: any, goal: string): PromotionType {
    switch (goal) {
      case 'increase_volume':
        return analytics.avgBookingValue > 200 ? 'PERCENTAGE' : 'FIXED_AMOUNT';
      case 'increase_revenue':
        return 'PERCENTAGE';
      case 'attract_new_customers':
        return 'FIRST_TIME_PERCENTAGE';
      case 'reduce_cancellations':
        return 'BOOKING_COMPLETION_BONUS';
      default:
        return 'PERCENTAGE';
    }
  }
}
```

### 8.3 Subscription & Package Pricing

```typescript
// src/lib/pricing/subscription-manager.ts
class SubscriptionManager {
  async createServicePackage(packageData: ServicePackageData): Promise<ServicePackage> {
    const package = await prisma.servicePackage.create({
      data: {
        ...packageData,
        pricing: {
          individual: this.calculateIndividualPricing(packageData.services),
          package: packageData.packagePrice,
          savings: this.calculateSavings(packageData.services, packageData.packagePrice)
        }
      },
      include: {
        services: true,
        subscriptions: true
      }
    });

    return package;
  }

  async createSubscription(request: SubscriptionRequest): Promise<Subscription> {
    // Validate customer eligibility
    await this.validateSubscriptionEligibility(request.customerId, request.packageId);

    const subscription = await prisma.subscription.create({
      data: {
        customerId: request.customerId,
        packageId: request.packageId,
        frequency: request.frequency,
        nextBillingDate: this.calculateNextBillingDate(request.frequency),
        status: 'ACTIVE',
        autoRenewal: request.autoRenewal || true,
        customizations: request.customizations || {}
      }
    });

    // Set up recurring payment
    await this.setupRecurringPayment(subscription);

    // Schedule initial services
    await this.scheduleSubscriptionServices(subscription);

    return subscription;
  }

  private async scheduleSubscriptionServices(subscription: Subscription) {
    const package = await prisma.servicePackage.findUnique({
      where: { id: subscription.packageId },
      include: { services: true }
    });

    if (!package) return;

    for (const service of package.services) {
      const frequency = subscription.customizations[service.id]?.frequency || 
                       service.defaultFrequency || 
                       subscription.frequency;

      await this.scheduleRecurringService({
        subscriptionId: subscription.id,
        serviceId: service.id,
        customerId: subscription.customerId,
        frequency,
        startDate: subscription.createdAt
      });
    }
  }

  async processSubscriptionBilling(subscriptionId: string): Promise<BillingResult> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        package: { include: { services: true } }
      }
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new Error('Invalid subscription');
    }

    try {
      // Calculate billing amount (including usage overages)
      const billingAmount = await this.calculateSubscriptionBilling(subscription);

      // Process payment
      const paymentResult = await this.paymentProcessor.processRecurringPayment({
        customerId: subscription.customerId,
        amount: billingAmount.total,
        currency: 'AED',
        description: `Subscription billing - ${subscription.package.name}`,
        subscriptionId: subscription.id
      });

      if (paymentResult.success) {
        // Update subscription
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            nextBillingDate: this.calculateNextBillingDate(subscription.frequency),
            lastBilledAt: new Date()
          }
        });

        // Create billing record
        await prisma.subscriptionBilling.create({
          data: {
            subscriptionId,
            amount: billingAmount.total,
            breakdown: billingAmount.breakdown,
            paymentTransactionId: paymentResult.transactionId,
            status: 'PAID',
            billingPeriod: {
              start: subscription.lastBilledAt || subscription.createdAt,
              end: new Date()
            }
          }
        });

        return {
          success: true,
          amount: billingAmount.total,
          transactionId: paymentResult.transactionId
        };
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (error) {
      // Handle failed billing
      await this.handleFailedBilling(subscription, error);
      throw error;
    }
  }
}
```

## Phase 9: Testing & Quality Assurance (Week 13)

### 9.1 Comprehensive Test Suite

```typescript
// tests/booking/booking-flow.e2e.test.ts
describe('Complete Booking Flow E2E', () => {
  test('should complete full booking flow successfully', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/book');
    
    // Step 1: Service Selection
    await page.click('[data-testid="service-card-tax-consultation"]');
    await page.click('[data-testid="add-on-rush-service"]');
    await page.click('[data-testid="next-step"]');

    // Step 2: Date/Time Selection
    await page.click('[data-testid="calendar-next-month"]');
    await page.click('[data-testid="calendar-day-15"]');
    await page.click('[data-testid="time-slot-10-00"]');
    await page.click('[data-testid="next-step"]');

    // Step 3: Customer Details
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');
    await page.fill('[data-testid="customer-phone"]', '+971501234567');
    await page.fill('[data-testid="special-requirements"]', 'Need Arabic interpreter');
    await page.click('[data-testid="next-step"]');

    // Step 4: Payment
    await page.click('[data-testid="payment-method-card"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.click('[data-testid="promo-code-toggle"]');
    await page.fill('[data-testid="promo-code"]', 'FIRST10');
    await page.click('[data-testid="apply-promo"]');

    // Verify discount applied
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('AED 270.00');
    
    await page.click('[data-testid="complete-booking"]');

    // Step 5: Confirmation
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/BK-\d{8}/);
    
    // Verify email sent (mock verification)
    expect(mockEmailService.sendBookingConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'john@example.com',
        serviceName: 'Tax Consultation'
      })
    );
  });

  test('should handle booking conflicts gracefully', async ({ page }) => {
    // Mock API to return conflict
    await page.route('/api/bookings', route => {
      route.fulfill({
        status: 409,
        body: JSON.stringify({
          error: 'Time slot no longer available',
          suggestedAlternatives: [
            { startTime: '2024-01-15T11:00:00Z', endTime: '2024-01-15T12:00:00Z' },
            { startTime: '2024-01-15T14:00:00Z', endTime: '2024-01-15T15:00:00Z' }
          ]
        })
      });
    });

    // Complete booking flow until payment
    await completeBookingFlowUntilPayment(page);
    await page.click('[data-testid="complete-booking"]');

    // Verify conflict handling
    await expect(page.locator('[data-testid="conflict-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="alternative-slots"]')).toContainText('11:00 AM');
    
    // Select alternative slot
    await page.click('[data-testid="alternative-slot-0"]');
    await page.click('[data-testid="accept-alternative"]');

    // Verify booking completes with new time
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });
});

// tests/booking/availability.integration.test.ts
describe('Availability Engine Integration', () => {
  beforeEach(async () => {
    await seedTestData();
  });

  test('should return available slots correctly', async () => {
    const availabilityEngine = new AvailabilityEngine();
    
    const slots = await availabilityEngine.getAvailableSlots({
      serviceId: 'tax-consultation',
      date: new Date('2024-01-15'),
      duration: 60
    });

    expect(slots).toHaveLength(8); // 8 available slots for the day
    expect(slots[0]).toMatchObject({
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      teamMemberId: expect.any(String),
      price: expect.any(Number),
      isRecommended: expect.any(Boolean)
    });
  });

  test('should handle conflicts correctly', async () => {
    // Create conflicting booking
    await prisma.serviceRequest.create({
      data: {
        serviceId: 'tax-consultation',
        isBooking: true,
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        teamMemberId: 'team-member-1',
        status: 'CONFIRMED'
      }
    });

    const availabilityEngine = new AvailabilityEngine();
    const slots = await availabilityEngine.getAvailableSlots({
      serviceId: 'tax-consultation',
      date: new Date('2024-01-15'),
      duration: 60
    });

    // Should not include the 10 AM slot
    const conflictingSlot = slots.find(slot => 
      slot.startTime.getHours() === 10 && slot.teamMemberId === 'team-member-1'
    );
    expect(conflictingSlot).toBeUndefined();
  });

  test('should apply buffer times correctly', async () => {
    // Set team member buffer time to 30 minutes
    await prisma.teamMember.update({
      where: { id: 'team-member-1' },
      data: { bookingBuffer: 30 }
    });

    // Create booking at 10:00-11:00
    await prisma.serviceRequest.create({
      data: {
        serviceId: 'tax-consultation',
        isBooking: true,
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        teamMemberId: 'team-member-1',
        status: 'CONFIRMED'
      }
    });

    const availabilityEngine = new AvailabilityEngine();
    const slots = await availabilityEngine.getAvailableSlots({
      serviceId: 'tax-consultation',
      date: new Date('2024-01-15'),
      duration: 60,
      teamMemberId: 'team-member-1'
    });

    // Should not have slots from 9:00-9:30 (before buffer) or 11:00-11:30 (after buffer)
    const invalidSlots = slots.filter(slot => {
      const hour = slot.startTime.getHours();
      const minute = slot.startTime.getMinutes();
      return (hour === 9 && minute >= 30) || (hour === 11 && minute < 30);
    });
    
    expect(invalidSlots).toHaveLength(0);
  });
});

// tests/booking/pricing-engine.unit.test.ts
describe('Pricing Engine', () => {
  let pricingEngine: PricingEngine;

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  test('should apply peak hours surcharge', async () => {
    const request: BookingPriceRequest = {
      serviceId: 'tax-consultation',
      scheduledAt: new Date('2024-01-15T09:00:00Z'), // Peak hour
      duration: 60,
      bookingType: 'STANDARD'
    };

    const result = await pricingEngine.calculateBookingPrice(request);
    
    expect(result.surcharges).toContainEqual(
      expect.objectContaining({
        type: 'PEAK_HOURS',
        amount: expect.any(Number),
        description: 'Peak hours surcharge'
      })
    );
  });

  test('should apply weekend surcharge', async () => {
    const request: BookingPriceRequest = {
      serviceId: 'tax-consultation',
      scheduledAt: new Date('2024-01-13T14:00:00Z'), // Saturday
      duration: 60,
      bookingType: 'STANDARD'
    };

    const result = await pricingEngine.calculateBookingPrice(request);
    
    expect(result.surcharges).toContainEqual(
      expect.objectContaining({
        type: 'WEEKEND',
        amount: expect.any(Number)
      })
    );
  });

  test('should apply emergency booking surcharge', async () => {
    const request: BookingPriceRequest = {
      serviceId: 'tax-consultation',
      scheduledAt: new Date('2024-01-15T14:00:00Z'),
      duration: 60,
      bookingType: 'EMERGENCY'
    };

    const result = await pricingEngine.calculateBookingPrice(request);
    
    expect(result.surcharges).toContainEqual(
      expect.objectContaining({
        type: 'EMERGENCY',
        amount: expect.any(Number)
      })
    );
  });
});

// tests/booking/conflict-detection.unit.test.ts
describe('Conflict Detection Service', () => {
  let conflictService: ConflictDetectionService;

  beforeEach(() => {
    conflictService = new ConflictDetectionService();
  });

  test('should detect double booking conflict', async () => {
    const newBooking: BookingData = {
      serviceId: 'tax-consultation',
      teamMemberId: 'team-member-1',
      scheduledAt: new Date('2024-01-15T10:00:00Z'),
      duration: 60
    };

    const existingBookings: BookingData[] = [{
      serviceId: 'audit-service',
      teamMemberId: 'team-member-1',
      scheduledAt: new Date('2024-01-15T10:30:00Z'),
      duration: 90
    }];

    const result = await conflictService.detectConflicts(newBooking, existingBookings);
    
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toContainEqual(
      expect.objectContaining({
        rule: 'Double Booking',
        hasConflict: true
      })
    );
  });

  test('should detect buffer time violation', async () => {
    const newBooking: BookingData = {
      serviceId: 'tax-consultation',
      teamMemberId: 'team-member-1',
      scheduledAt: new Date('2024-01-15T11:00:00Z'),
      duration: 60
    };

    // Existing booking ends at 11:05 (only 5 minutes buffer)
    const existingBookings: BookingData[] = [{
      serviceId: 'audit-service',
      teamMemberId: 'team-member-1',
      scheduledAt: new Date('2024-01-15T10:05:00Z'),
      duration: 60
    }];

    const result = await conflictService.detectConflicts(newBooking, existingBookings);
    
    expect(result.hasWarnings).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        rule: 'Buffer Time Violation'
      })
    );
  });
});
```

### 9.2 Load Testing & Performance

```typescript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '5m', target: 100 }, // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 200 }, // Ramp up to 200 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = 'https://your-booking-system.com';

export default function () {
  group('Booking Flow Load Test', function () {
    // Test availability endpoint
    group('Get Availability', function () {
      const availabilityResponse = http.get(
        `${BASE_URL}/api/bookings/availability?serviceId=tax-consultation&date=2024-01-15&duration=60`
      );
      
      const availabilityCheck = check(availabilityResponse, {
        'availability status is 200': (r) => r.status === 200,
        'availability response time < 500ms': (r) => r.timings.duration < 500,
        'availability returns slots': (r) => {
          const body = JSON.parse(r.body);
          return body.slots && body.slots.length > 0;
        },
      });
      
      if (!availabilityCheck) {
        errorRate.add(1);
      }
    });

    // Test booking creation
    group('Create Booking', function () {
      const bookingPayload = {
        serviceId: 'tax-consultation',
        scheduledAt: '2024-01-15T10:00:00Z',
        duration: 60,
        clientName: `Test User ${Math.random()}`,
        clientEmail: `test${Math.random()}@example.com`,
        clientPhone: '+971501234567',
        paymentMethod: 'CREDIT_CARD'
      };

      const bookingResponse = http.post(
        `${BASE_URL}/api/bookings`,
        JSON.stringify(bookingPayload),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
        }
      );

      const bookingCheck = check(bookingResponse, {
        'booking creation status is 201 or 409': (r) => r.status === 201 || r.status === 409,
        'booking response time < 1000ms': (r) => r.timings.duration < 1000,
      });

      if (!bookingCheck) {
        errorRate.add(1);
      }
    });

    sleep(1); // Wait 1 second between iterations
  });
}
```

### 9.3 Accessibility Testing

```typescript
// tests/accessibility/booking-accessibility.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Booking System Accessibility', () => {
  test('booking wizard should be accessible', async ({ page }) => {
    await page.goto('/book');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/book');
    
    // Test tab navigation through booking wizard
    await page.keyboard.press('Tab'); // Focus on first service
    await page.keyboard.press('Enter'); // Select service
    
    await page.keyboard.press('Tab'); // Move to next button
    await page.keyboard.press('Enter'); // Go to next step
    
    // Verify we moved to date/time selection
    await expect(page.locator('[data-testid="datetime-step"]')).toBeVisible();
    
    // Test calendar keyboard navigation
    await page.keyboard.press('Tab'); // Focus calendar
    await page.keyboard.press('ArrowRight'); // Navigate dates
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter'); // Select date
    
    // Test time slot keyboard navigation
    await page.keyboard.press('Tab'); // Focus first time slot
    await page.keyboard.press('ArrowDown'); // Navigate time slots
    await page.keyboard.press('Enter'); // Select time slot
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/book');
    
    // Check calendar has proper ARIA attributes
    const calendar = page.locator('[role="grid"]');
    await expect(calendar).toHaveAttribute('aria-label', /calendar/i);
    
    // Check time slots have proper roles
    const timeSlots = page.locator('[role="button"][aria-pressed]');
    await expect(timeSlots.first()).toHaveAttribute('aria-label', /time slot/i);
    
    // Check form inputs have proper labels
    const nameInput = page.locator('[data-testid="customer-name"]');
    await expect(nameInput).toHaveAttribute('aria-label');
    
    // Check progress indicator is accessible
    const progress = page.locator('[role="progressbar"]');
    await expect(progress).toHaveAttribute('aria-valuenow');
    await expect(progress).toHaveAttribute('aria-valuemax');
  });
});
```

## Phase 10: Deployment & Production (Week 14)

### 10.1 Production Deployment Checklist

```typescript
// deployment/pre-deployment-checklist.ts
interface DeploymentChecklist {
  environment: string;
  checks: DeploymentCheck[];
}

interface DeploymentCheck {
  id: string;
  name: string;
  required: boolean;
  status: 'pending' | 'passed' | 'failed';
  details?: string;
}

class DeploymentValidator {
  async runPreDeploymentChecks(environment: string): Promise<DeploymentChecklist> {
    const checklist: DeploymentChecklist = {
      environment,
      checks: []
    };

    // Database checks
    checklist.checks.push(await this.checkDatabaseConnection());
    checklist.checks.push(await this.checkDatabaseMigrations());
    checklist.checks.push(await this.checkDatabaseIndexes());

    // Environment variables
    checklist.checks.push(await this.checkEnvironmentVariables());
    checklist.checks.push(await this.checkSecrets());

    // External services
    checklist.checks.push(await this.checkPaymentGateways());
    checklist.checks.push(await this.checkEmailService());
    checklist.checks.push(await this.checkFileStorage());

    // Performance benchmarks
    checklist.checks.push(await this.checkResponseTimes());
    checklist.checks.push(await this.checkLoadCapacity());

    // Security checks
    checklist.checks.push(await this.checkSSLConfiguration());
    checklist.checks.push(await this.checkAPIRateLimits());
    checklist.checks.push(await this.checkDataEncryption());

    // Monitoring & logging
    checklist.checks.push(await this.checkMonitoringSetup());
    checklist.checks.push(await this.checkLogAggregation());
    checklist.checks.push(await this.checkAlertConfiguration());

    return checklist;
  }

  private async checkDatabaseConnection(): Promise<DeploymentCheck> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        id: 'db-connection',
        name: 'Database Connection',
        required: true,
        status: 'passed'
      };
    } catch (error) {
      return {
        id: 'db-connection',
        name: 'Database Connection',
        required: true,
        status: 'failed',
        details: error.message
      };
    }
  }

  private async checkPaymentGateways(): Promise<DeploymentCheck> {
    const gatewayChecks = await Promise.allSettled([
      this.testNetworkInternationalConnection(),
      this.testPayFortConnection(),
      this.testStripeConnection()
    ]);

    const failedGateways = gatewayChecks
      .filter(result => result.status === 'rejected')
      .length;

    return {
      id: 'payment-gateways',
      name: 'Payment Gateway Connections',
      required: true,
      status: failedGateways === 0 ? 'passed' : failedGateways === gatewayChecks.length ? 'failed' : 'passed',
      details: failedGateways > 0 ? `${failedGateways} gateway(s) failed` : 'All gateways operational'
    };
  }

  private async checkLoadCapacity(): Promise<DeploymentCheck> {
    // Run simplified load test
    const startTime = Date.now();
    const requests = Array.from({ length: 10 }, () => 
      fetch('/api/health').then(r => r.ok)
    );
    
    const results = await Promise.allSettled(requests);
    const duration = Date.now() - startTime;
    const successfulRequests = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    const passed = successfulRequests >= 8 && duration < 5000; // 80% success rate, under 5s
    
    return {
      id: 'load-capacity',
      name: 'Load Capacity Test',
      required: false,
      status: passed ? 'passed' : 'failed',
      details: `${successfulRequests}/10 requests succeeded in ${duration}ms`
    };
  }
}
```

### 10.2 Monitoring & Alerting

```typescript
// monitoring/booking-system-monitoring.ts
class BookingSystemMonitoring {
  private metrics: MetricsCollector;
  private alertManager: AlertManager;

  constructor() {
    this.metrics = new MetricsCollector();
    this.alertManager = new AlertManager();
  }

  async setupMonitoring() {
    // Set up key metrics collection
    await this.metrics.registerMetric({
      name: 'booking_creation_rate',
      type: 'counter',
      description: 'Number of booking creation attempts',
      labels: ['service_id', 'status']
    });

    await this.metrics.registerMetric({
      name: 'booking_completion_time',
      type: 'histogram',
      description: 'Time to complete booking flow',
      buckets: [1, 2, 5, 10, 30, 60] // seconds
    });

    await this.metrics.registerMetric({
      name: 'availability_query_duration',
      type: 'histogram', 
      description: 'Availability query response time',
      buckets: [0.1, 0.5, 1, 2, 5] // seconds
    });

    await this.metrics.registerMetric({
      name: 'payment_processing_duration',
      type: 'histogram',
      description: 'Payment processing time',
      buckets: [1, 3, 5, 10, 30] // seconds
    });

    await this.metrics.registerMetric({
      name: 'booking_conflicts_detected',
      type: 'counter',
      description: 'Number of booking conflicts detected',
      labels: ['conflict_type']
    });

    // Set up alerts
    await this.setupAlerts();
  }

  private async setupAlerts() {
    // High error rate alert
    await this.alertManager.createAlert({
      name: 'High Booking Error Rate',
      condition: 'booking_creation_rate{status="failed"} / booking_creation_rate > 0.05',
      duration: '5m',
      severity: 'critical',
      message: 'Booking error rate is above 5% for 5 minutes',
      notifications: ['email', 'slack', 'pagerduty']
    });

    // Slow availability queries
    await this.alertManager.createAlert({
      name: 'Slow Availability Queries',
      condition: 'histogram_quantile(0.95, availability_query_duration) > 2',
      duration: '3m',
      severity: 'warning',
      message: '95th percentile availability query time is above 2 seconds',
      notifications: ['slack']
    });

    // Payment processing issues
    await this.alertManager.createAlert({
      name: 'Payment Processing Failures',
      condition: 'increase(payment_failures_total[5m]) > 3',
      duration: '1m',
      severity: 'critical',
      message: 'More than 3 payment failures in the last 5 minutes',
      notifications: ['email', 'pagerduty']
    });

    // Database connection issues
    await this.alertManager.createAlert({
      name: 'Database Connection Pool Exhaustion',
      condition: 'db_connections_active / db_connections_max > 0.9',
      duration: '2m',
      severity: 'critical',
      message: 'Database connection pool is 90% utilized',
      notifications: ['email', 'slack']
    });

    // Business metrics alerts
    await this.alertManager.createAlert({
      name: 'Booking Conversion Drop',
      condition: 'booking_conversion_rate < 0.7',
      duration: '15m',
      severity: 'warning',
      message: 'Booking conversion rate has dropped below 70%',
      notifications: ['email']
    });
  }

  async trackBookingMetrics(booking: BookingData, duration: number) {
    // Track booking creation
    await this.metrics.increment('booking_creation_rate', {
      service_id: booking.serviceId,
      status: 'success'
    });

    // Track completion time
    await this.metrics.observe('booking_completion_time', duration);

    // Track business metrics
    await this.updateBusinessMetrics(booking);
  }

  private async updateBusinessMetrics(booking: BookingData) {
    // Calculate and update conversion rate
    const totalAttempts = await this.getTotalBookingAttempts();
    const successfulBookings = await this.getSuccessfulBookings();
    const conversionRate = successfulBookings / totalAttempts;
    
    await this.metrics.gauge('booking_conversion_rate', conversionRate);

    // Track revenue metrics
    await this.metrics.observe('booking_value', booking.finalPrice || 0);
    
    // Track service-specific metrics
    await this.metrics.increment('bookings_by_service', { 
      service: booking.serviceName 
    });
  }
}

// monitoring/health-checks.ts
class HealthCheckService {
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkExternalServices(),
      this.checkSystemResources(),
      this.checkApplicationHealth()
    ]);

    const results = checks.map((check, index) => {
      const checkNames = ['database', 'external_services', 'system_resources', 'application'];
      return {
        name: checkNames[index],
        status: check.status === 'fulfilled' && check.value.healthy ? 'healthy' : 'unhealthy',
        details: check.status === 'fulfilled' ? check.value.details : check.reason,
        responseTime: check.status === 'fulfilled' ? check.value.responseTime : null
      };
    });

    const overallHealth = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallHealth,
      timestamp: new Date(),
      checks: results,
      uptime: process.uptime(),
      version: process.env.APP_VERSION || 'unknown'
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      // Test write capability
      await prisma.healthLog.create({
        data: {
          service: 'booking-system',
          status: 'UP',
          checkedAt: new Date(),
          details: { healthCheck: true }
        }
      });

      return {
        healthy: true,
        responseTime: Date.now() - startTime,
        details: 'Database connection and write operations successful'
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        details: `Database error: ${error.message}`
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const serviceChecks = await Promise.allSettled([
      this.pingService('email', process.env.SENDGRID_API_URL),
      this.pingService('payment', process.env.PAYMENT_GATEWAY_URL),
      this.pingService('storage', process.env.STORAGE_PROVIDER_URL)
    ]);

    const failedServices = serviceChecks.filter(check => 
      check.status === 'rejected' || !check.value.healthy
    );

    return {
      healthy: failedServices.length === 0,
      responseTime: Math.max(...serviceChecks
        .filter(c => c.status === 'fulfilled')
        .map(c => c.value.responseTime)
      ),
      details: failedServices.length > 0 ? 
        `${failedServices.length} external service(s) unavailable` : 
        'All external services operational'
    };
  }

  private async checkSystemResources(): Promise<HealthCheck> {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryLimitMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (memoryUsageMB / memoryLimitMB) * 100;

    const cpuUsage = process.cpuUsage();
    
    const healthy = memoryUsagePercent < 90; // Alert if memory usage > 90%

    return {
      healthy,
      responseTime: 0,
      details: {
        memory: `${memoryUsageMB.toFixed(2)}MB / ${memoryLimitMB.toFixed(2)}MB (${memoryUsagePercent.toFixed(1)}%)`,
        uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
        nodeVersion: process.version
      }
    };
  }
}
```

## Implementation Timeline & Milestones

### Week 1-2: Foundation
- [ ] Database schema enhancements
- [ ] Basic availability engine
- [ ] Unified booking API structure

### Week 3-4: Core Features  
- [ ] Advanced pricing engine
- [ ] Conflict detection system
- [ ] Basic booking wizard UI

### Week 5-6: User Experience
- [ ] Complete booking wizard
- [ ] Real-time availability updates
- [ ] Mobile-responsive design

### Week 7-8: Advanced Features
- [ ] Recurring bookings
- [ ] Smart notifications
- [ ] Calendar integration (ICS)

### Week 9: Real-time & Communication
- [ ] WebSocket implementation
- [ ] Live chat support
- [ ] Real-time dashboard updates

### Week 10: Mobile & Offline
- [ ] PWA configuration
- [ ] Offline booking capability
- [ ] Touch-optimized UI

### Week 11: Analytics & Intelligence
- [ ] Booking analytics dashboard
- [ ] Predictive analytics
- [ ] Customer behavior analysis

### Week 12: Payments & Pricing
- [ ] Multi-gateway payment processing
- [ ] Dynamic pricing engine
- [ ] Subscription management

### Week 13: Testing & Quality
- [ ] Comprehensive test suite
- [ ] Load testing
- [ ] Accessibility testing

### Week 14: Production Deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Performance optimization

## Success Metrics & KPIs

### Technical Metrics
- **Availability**: 99.9% uptime target
- **Performance**: <2s booking completion time
- **Scalability**: Handle 1000+ concurrent users
- **Error Rate**: <0.1% booking failure rate

### Business Metrics
- **Conversion Rate**: 80%+ booking completion rate
- **Customer Satisfaction**: 4.5/5 average rating
- **Revenue Impact**: 25% increase in bookings
- **Operational Efficiency**: 50% reduction in manual scheduling

### User Experience Metrics
- **Page Load Time**: <1.5s first contentful paint
- **Mobile Usage**: 60%+ mobile bookings
- **Accessibility**: WCAG 2.1 AA compliance
- **Customer Support**: 40% reduction in support tickets

## Risk Mitigation & Rollback Plans

### Technical Risks
1. **Database Performance**: Implement read replicas and connection pooling
2. **Payment Integration**: Multiple gateway fallbacks
3. **Real-time Scaling**: Horizontal scaling with Redis/Postgres pubsub
4. **External Service Failures**: Circuit breakers and graceful degradation

### Business Risks  
1. **User Adoption**: Gradual rollout with feature flags
2. **Revenue Impact**: A/B testing for pricing changes
3. **Operational Disruption**: Parallel system operation during transition
4. **Customer Service Overload**: Comprehensive training and documentation

### Rollback Strategy
```typescript
// Feature flag configuration for gradual rollout
const FEATURE_FLAGS = {
  ENHANCED_BOOKING_WIZARD: {
    enabled: process.env.FF_BOOKING_WIZARD === 'true',
    rolloutPercentage: parseInt(process.env.FF_BOOKING_WIZARD_ROLLOUT) || 0
  },
  DYNAMIC_PRICING: {
    enabled: process.env.FF_DYNAMIC_PRICING === 'true',
    rolloutPercentage: parseInt(process.env.FF_DYNAMIC_PRICING_ROLLOUT) || 0
  },
  REAL_TIME_UPDATES: {
    enabled: process.env.FF_REAL_TIME === 'true',
    rolloutPercentage: 100 // Safe to enable for all users
  }
};

// Rollback capability in booking flow
class BookingFlowManager {
  async createBooking(request: BookingRequest): Promise<BookingResult> {
    if (FEATURE_FLAGS.ENHANCED_BOOKING_WIZARD.enabled && 
        this.shouldUseFeature('ENHANCED_BOOKING_WIZARD', request.userId)) {
      try {
        return await this.createEnhancedBooking(request);
      } catch (error) {
        console.error('Enhanced booking failed, falling back to legacy:', error);
        return await this.createLegacyBooking(request);
      }
    }
    
    return await this.createLegacyBooking(request);
  }
  
  private shouldUseFeature(feature: string, userId: string): boolean {
    const config = FEATURE_FLAGS[feature];
    if (!config.enabled) return false;
    
    // Use consistent hash to ensure same user always gets same experience
    const hash = this.hashUserId(userId);
    return hash % 100 < config.rolloutPercentage;
  }
}
```

## Post-Implementation Support & Maintenance

### Monitoring Dashboard Setup
```typescript
// Create comprehensive monitoring dashboard
const monitoringMetrics = {
  // Performance Metrics
  bookingCompletionTime: 'Average time to complete booking',
  availabilityQueryTime: 'Availability lookup response time',
  paymentProcessingTime: 'Payment gateway response time',
  
  // Business Metrics  
  conversionRate: 'Booking completion rate',
  revenuePerBooking: 'Average revenue per booking',
  customerSatisfaction: 'Customer rating average',
  
  // Technical Metrics
  errorRate: 'API error rate',
  databaseConnections: 'Active database connections',
  cacheHitRate: 'Redis cache hit rate'
};
```

### Maintenance Schedule
- **Daily**: Health checks, error monitoring, performance metrics review
- **Weekly**: Capacity planning, user feedback analysis, feature usage reports  
- **Monthly**: Security audits, dependency updates, performance optimization
- **Quarterly**: Business metrics review, ROI analysis, feature roadmap updates

## Cost Analysis & ROI Projection

### Implementation Costs
- **Development**: 14 weeks × 2 developers = ~$140,000
- **Infrastructure**: Cloud hosting, databases, monitoring = ~$2,000/month
- **Third-party Services**: Payment gateways, SMS, email = ~$500/month
- **Testing & QA**: Load testing, security audits = ~$10,000

### Projected Benefits (Annual)
- **Increased Bookings**: 25% increase = +$200,000 revenue
- **Operational Efficiency**: 50% reduction in manual work = $50,000 savings
- **Customer Retention**: 15% improvement = +$75,000 revenue
- **Reduced Support Costs**: 40% fewer tickets = $25,000 savings

**Net ROI**: 350,000 - 155,000 = $195,000 annual benefit (126% ROI)

## Conclusion

This comprehensive enhancement plan transforms your basic booking system into a sophisticated, ServiceMarket-style platform that will:

1. **Dramatically improve user experience** with an intuitive multi-step booking wizard
2. **Increase operational efficiency** through automated scheduling and conflict detection
3. **Boost revenue** via dynamic pricing and better conversion rates
4. **Enhance customer satisfaction** with real-time updates and mobile optimization
5. **Provide valuable business insights** through advanced analytics and reporting

The phased approach ensures minimal disruption to current operations while delivering incremental value. The robust testing strategy and rollback capabilities minimize risks, while comprehensive monitoring ensures long-term success.

The investment in this enhancement will pay dividends through increased bookings, improved customer satisfaction, and operational efficiencies that scale with business growth.# Comprehensive Booking System Enhancement Plan

## Executive Summary

This implementation plan outlines the transformation of your existing accounting firm booking system into a comprehensive ServiceMarket-style platform with advanced booking capabilities, service request management, and unified client portal experience.

## Current State Analysis

Based on your audit documentation, your current system includes:
- Basic booking functionality
- Admin dashboard with task management
- Client portal with service requests
- Basic authentication and user management
- File upload capabilities with AV scanning

## Target Enhancement: ServiceMarket-Style Booking System

### Key Features to Implement:
1. **Unified Booking & Service Request Management**
2. **Advanced Scheduling & Availability**
3. **Multi-Service Booking Wizard**
4. **Dynamic Pricing Engine**
5. **Real-time Availability & Notifications**
6. **Enhanced Client Experience**