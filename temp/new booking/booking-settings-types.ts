// src/types/booking-settings.types.ts

export interface BookingSettings {
  id: string;
  organizationId: string;
  
  // General Booking Settings
  bookingEnabled: boolean;
  requireApproval: boolean;
  allowCancellation: boolean;
  allowRescheduling: boolean;
  cancellationDeadlineHours: number;
  rescheduleDeadlineHours: number;
  
  // Payment Configuration
  paymentRequired: boolean;
  acceptCash: boolean;
  acceptCard: boolean;
  acceptBankTransfer: boolean;
  acceptWire: boolean;
  acceptCrypto: boolean;
  requireFullPayment: boolean;
  allowPartialPayment: boolean;
  depositPercentage: number;
  
  // Booking Steps Configuration
  enableServiceSelection: boolean;
  enableDateTimeSelection: boolean;
  enableCustomerDetails: boolean;
  enableAdditionalServices: boolean;
  enablePaymentStep: boolean;
  enableConfirmationStep: boolean;
  enableFileUpload: boolean;
  enableSpecialRequests: boolean;
  
  // Availability Settings
  advanceBookingDays: number;
  minAdvanceBookingHours: number;
  maxBookingsPerDay: number;
  maxBookingsPerCustomer: number;
  bufferTimeBetweenBookings: number;
  
  // Business Hours
  businessHours: BusinessHours;
  blackoutDates: string[];
  holidaySchedule: HolidaySchedule;
  
  // Notification Settings
  sendBookingConfirmation: boolean;
  sendReminders: boolean;
  reminderHours: number[];
  notifyTeamMembers: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  // Customer Experience Settings
  requireLogin: boolean;
  allowGuestBooking: boolean;
  showPricing: boolean;
  showTeamMemberSelection: boolean;
  allowRecurringBookings: boolean;
  enableWaitlist: boolean;
  
  // Auto-assignment Settings
  enableAutoAssignment: boolean;
  assignmentStrategy: AssignmentStrategy;
  considerWorkload: boolean;
  considerSpecialization: boolean;
  
  // Pricing Configuration
  enableDynamicPricing: boolean;
  peakHoursSurcharge: number;
  weekendSurcharge: number;
  emergencyBookingSurcharge: number;
  
  // Integration Settings
  calendarSync: boolean;
  webhookUrl?: string;
  apiAccessEnabled: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  
  // Related entities
  steps?: BookingStepConfig[];
  businessHoursConfig?: BusinessHoursConfig[];
  paymentMethods?: PaymentMethodConfig[];
  notificationTemplates?: NotificationTemplate[];
}

export interface BookingStepConfig {
  id: string;
  bookingSettingsId: string;
  stepName: BookingStepName;
  stepOrder: number;
  enabled: boolean;
  required: boolean;
  title: string;
  description?: string;
  validationRules: ValidationRules;
  customFields: CustomField[];
  createdAt: Date;
}

export interface BusinessHoursConfig {
  id: string;
  bookingSettingsId: string;
  dayOfWeek: DayOfWeek;
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  maxBookingsPerHour: number;
}

export interface PaymentMethodConfig {
  id: string;
  bookingSettingsId: string;
  methodType: PaymentMethodType;
  enabled: boolean;
  displayName: string;
  description?: string;
  processingFee: number;
  minAmount: number;
  maxAmount?: number;
  gatewayConfig: PaymentGatewayConfig;
}

export interface NotificationTemplate {
  id: string;
  bookingSettingsId: string;
  templateType: NotificationTemplateType;
  channel: NotificationChannel;
  enabled: boolean;
  subject?: string;
  content: string;
  variables: string[];
}

// Enums and Union Types
export type BookingStepName = 
  | 'SERVICE_SELECTION'
  | 'DATETIME_SELECTION' 
  | 'CUSTOMER_DETAILS'
  | 'ADDITIONAL_SERVICES'
  | 'PAYMENT'
  | 'CONFIRMATION'
  | 'FILE_UPLOAD'
  | 'SPECIAL_REQUESTS';

export type PaymentMethodType = 
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'WIRE'
  | 'CRYPTO'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY';

export type AssignmentStrategy = 
  | 'ROUND_ROBIN'
  | 'LOAD_BALANCED'
  | 'SKILL_BASED'
  | 'AVAILABILITY_BASED'
  | 'MANUAL';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type NotificationTemplateType = 
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELLATION'
  | 'BOOKING_RESCHEDULED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'CUSTOM';

export type NotificationChannel = 
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'WEBHOOK';

// Supporting Interfaces
export interface BusinessHours {
  [key: string]: {
    isWorkingDay: boolean;
    startTime?: string;
    endTime?: string;
    breaks?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface HolidaySchedule {
  [date: string]: {
    name: string;
    closed: boolean;
    modifiedHours?: {
      startTime: string;
      endTime: string;
    };
  };
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  validation?: ValidationRules;
}

export interface PaymentGatewayConfig {
  gateway: string;
  publicKey?: string;
  merchantId?: string;
  webhookUrl?: string;
  testMode: boolean;
  additionalSettings?: Record<string, any>;
}

// Settings Update Types
export interface BookingSettingsUpdateRequest {
  generalSettings?: Partial<Pick<BookingSettings, 
    'bookingEnabled' | 'requireApproval' | 'allowCancellation' | 
    'allowRescheduling' | 'cancellationDeadlineHours' | 'rescheduleDeadlineHours'>>;
    
  paymentSettings?: Partial<Pick<BookingSettings,
    'paymentRequired' | 'acceptCash' | 'acceptCard' | 'acceptBankTransfer' |
    'acceptWire' | 'acceptCrypto' | 'requireFullPayment' | 'allowPartialPayment' |
    'depositPercentage'>>;
    
  stepSettings?: Partial<Pick<BookingSettings,
    'enableServiceSelection' | 'enableDateTimeSelection' | 'enableCustomerDetails' |
    'enableAdditionalServices' | 'enablePaymentStep' | 'enableConfirmationStep' |
    'enableFileUpload' | 'enableSpecialRequests'>>;
    
  availabilitySettings?: Partial<Pick<BookingSettings,
    'advanceBookingDays' | 'minAdvanceBookingHours' | 'maxBookingsPerDay' |
    'maxBookingsPerCustomer' | 'bufferTimeBetweenBookings'>>;
    
  notificationSettings?: Partial<Pick<BookingSettings,
    'sendBookingConfirmation' | 'sendReminders' | 'reminderHours' |
    'notifyTeamMembers' | 'emailNotifications' | 'smsNotifications'>>;
    
  customerSettings?: Partial<Pick<BookingSettings,
    'requireLogin' | 'allowGuestBooking' | 'showPricing' | 
    'showTeamMemberSelection' | 'allowRecurringBookings' | 'enableWaitlist'>>;
    
  assignmentSettings?: Partial<Pick<BookingSettings,
    'enableAutoAssignment' | 'assignmentStrategy' | 'considerWorkload' |
    'considerSpecialization'>>;
    
  pricingSettings?: Partial<Pick<BookingSettings,
    'enableDynamicPricing' | 'peakHoursSurcharge' | 'weekendSurcharge' |
    'emergencyBookingSurcharge'>>;
    
  integrationSettings?: Partial<Pick<BookingSettings,
    'calendarSync' | 'webhookUrl' | 'apiAccessEnabled'>>;
}

// Settings Validation Response
export interface SettingsValidationResult {
  isValid: boolean;
  errors: SettingsValidationError[];
  warnings: SettingsValidationWarning[];
}

export interface SettingsValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SettingsValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Settings Export/Import Types
export interface BookingSettingsExport {
  settings: BookingSettings;
  steps: BookingStepConfig[];
  businessHours: BusinessHoursConfig[];
  paymentMethods: PaymentMethodConfig[];
  notificationTemplates: NotificationTemplate[];
  exportedAt: Date;
  version: string;
}

export interface BookingSettingsImport {
  data: BookingSettingsExport;
  overwriteExisting: boolean;
  selectedSections: string[];
}