-- Booking Settings Configuration Table
CREATE TABLE IF NOT EXISTS BookingSettings (
    id VARCHAR(255) PRIMARY KEY,
    organizationId VARCHAR(255) NOT NULL,
    
    -- General Booking Settings
    bookingEnabled BOOLEAN DEFAULT true,
    requireApproval BOOLEAN DEFAULT false,
    allowCancellation BOOLEAN DEFAULT true,
    allowRescheduling BOOLEAN DEFAULT true,
    cancellationDeadlineHours INTEGER DEFAULT 24,
    rescheduleDeadlineHours INTEGER DEFAULT 4,
    
    -- Payment Configuration
    paymentRequired BOOLEAN DEFAULT false,
    acceptCash BOOLEAN DEFAULT true,
    acceptCard BOOLEAN DEFAULT true,
    acceptBankTransfer BOOLEAN DEFAULT false,
    acceptWire BOOLEAN DEFAULT false,
    acceptCrypto BOOLEAN DEFAULT false,
    requireFullPayment BOOLEAN DEFAULT false,
    allowPartialPayment BOOLEAN DEFAULT true,
    depositPercentage INTEGER DEFAULT 50,
    
    -- Booking Steps Configuration
    enableServiceSelection BOOLEAN DEFAULT true,
    enableDateTimeSelection BOOLEAN DEFAULT true,
    enableCustomerDetails BOOLEAN DEFAULT true,
    enableAdditionalServices BOOLEAN DEFAULT true,
    enablePaymentStep BOOLEAN DEFAULT false,
    enableConfirmationStep BOOLEAN DEFAULT true,
    enableFileUpload BOOLEAN DEFAULT false,
    enableSpecialRequests BOOLEAN DEFAULT true,
    
    -- Availability Settings
    advanceBookingDays INTEGER DEFAULT 365,
    minAdvanceBookingHours INTEGER DEFAULT 2,
    maxBookingsPerDay INTEGER DEFAULT 50,
    maxBookingsPerCustomer INTEGER DEFAULT 5,
    bufferTimeBetweenBookings INTEGER DEFAULT 15,
    
    -- Business Hours Configuration
    businessHours JSON DEFAULT '{}',
    blackoutDates JSON DEFAULT '[]',
    holidaySchedule JSON DEFAULT '{}',
    
    -- Notification Settings
    sendBookingConfirmation BOOLEAN DEFAULT true,
    sendReminders BOOLEAN DEFAULT true,
    reminderHours JSON DEFAULT '[24, 2]',
    notifyTeamMembers BOOLEAN DEFAULT true,
    emailNotifications BOOLEAN DEFAULT true,
    smsNotifications BOOLEAN DEFAULT false,
    
    -- Customer Experience Settings
    requireLogin BOOLEAN DEFAULT false,
    allowGuestBooking BOOLEAN DEFAULT true,
    showPricing BOOLEAN DEFAULT true,
    showTeamMemberSelection BOOLEAN DEFAULT false,
    allowRecurringBookings BOOLEAN DEFAULT false,
    enableWaitlist BOOLEAN DEFAULT false,
    
    -- Auto-assignment Settings
    enableAutoAssignment BOOLEAN DEFAULT false,
    assignmentStrategy VARCHAR(50) DEFAULT 'ROUND_ROBIN',
    considerWorkload BOOLEAN DEFAULT true,
    considerSpecialization BOOLEAN DEFAULT true,
    
    -- Pricing Configuration
    enableDynamicPricing BOOLEAN DEFAULT false,
    peakHoursSurcharge DECIMAL(5,2) DEFAULT 0.00,
    weekendSurcharge DECIMAL(5,2) DEFAULT 0.00,
    emergencyBookingSurcharge DECIMAL(5,2) DEFAULT 0.50,
    
    -- Integration Settings
    calendarSync BOOLEAN DEFAULT false,
    webhookUrl VARCHAR(500),
    apiAccessEnabled BOOLEAN DEFAULT false,
    
    -- Metadata
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedBy VARCHAR(255),
    
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON DELETE CASCADE,
    UNIQUE(organizationId)
);

-- Booking Step Configuration Table
CREATE TABLE IF NOT EXISTS BookingStepConfig (
    id VARCHAR(255) PRIMARY KEY,
    bookingSettingsId VARCHAR(255) NOT NULL,
    stepName VARCHAR(100) NOT NULL,
    stepOrder INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT true,
    required BOOLEAN DEFAULT true,
    title VARCHAR(255),
    description TEXT,
    validationRules JSON DEFAULT '{}',
    customFields JSON DEFAULT '[]',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bookingSettingsId) REFERENCES BookingSettings(id) ON DELETE CASCADE,
    UNIQUE(bookingSettingsId, stepName),
    UNIQUE(bookingSettingsId, stepOrder)
);

-- Business Hours Configuration Table
CREATE TABLE IF NOT EXISTS BusinessHoursConfig (
    id VARCHAR(255) PRIMARY KEY,
    bookingSettingsId VARCHAR(255) NOT NULL,
    dayOfWeek INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
    isWorkingDay BOOLEAN DEFAULT true,
    startTime TIME,
    endTime TIME,
    breakStartTime TIME,
    breakEndTime TIME,
    maxBookingsPerHour INTEGER DEFAULT 4,
    
    FOREIGN KEY (bookingSettingsId) REFERENCES BookingSettings(id) ON DELETE CASCADE,
    UNIQUE(bookingSettingsId, dayOfWeek)
);

-- Payment Method Configuration Table
CREATE TABLE IF NOT EXISTS PaymentMethodConfig (
    id VARCHAR(255) PRIMARY KEY,
    bookingSettingsId VARCHAR(255) NOT NULL,
    methodType VARCHAR(50) NOT NULL, -- 'CASH', 'CARD', 'BANK_TRANSFER', 'WIRE', 'CRYPTO'
    enabled BOOLEAN DEFAULT true,
    displayName VARCHAR(100),
    description TEXT,
    processingFee DECIMAL(5,2) DEFAULT 0.00,
    minAmount DECIMAL(10,2) DEFAULT 0.00,
    maxAmount DECIMAL(10,2),
    gatewayConfig JSON DEFAULT '{}',
    
    FOREIGN KEY (bookingSettingsId) REFERENCES BookingSettings(id) ON DELETE CASCADE,
    UNIQUE(bookingSettingsId, methodType)
);

-- Notification Template Configuration
CREATE TABLE IF NOT EXISTS NotificationTemplate (
    id VARCHAR(255) PRIMARY KEY,
    bookingSettingsId VARCHAR(255) NOT NULL,
    templateType VARCHAR(100) NOT NULL, -- 'CONFIRMATION', 'REMINDER', 'CANCELLATION', etc.
    channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'PUSH'
    enabled BOOLEAN DEFAULT true,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSON DEFAULT '[]',
    
    FOREIGN KEY (bookingSettingsId) REFERENCES BookingSettings(id) ON DELETE CASCADE,
    UNIQUE(bookingSettingsId, templateType, channel)
);

-- Create indexes for better performance
CREATE INDEX idx_booking_settings_org ON BookingSettings(organizationId);
CREATE INDEX idx_booking_step_config_settings ON BookingStepConfig(bookingSettingsId);
CREATE INDEX idx_business_hours_settings ON BusinessHoursConfig(bookingSettingsId);
CREATE INDEX idx_payment_method_settings ON PaymentMethodConfig(bookingSettingsId);
CREATE INDEX idx_notification_template_settings ON NotificationTemplate(bookingSettingsId);