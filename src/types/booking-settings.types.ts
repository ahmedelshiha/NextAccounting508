export interface BookingSettings {
  id: string;
  tenantId?: string | null;
  bookingEnabled: boolean;
  requireApproval: boolean;
  allowCancellation: boolean;
  allowRescheduling: boolean;
  cancellationDeadlineHours: number;
  rescheduleDeadlineHours: number;
  paymentRequired: boolean;
  acceptCash: boolean;
  acceptCard: boolean;
  acceptBankTransfer: boolean;
  acceptWire: boolean;
  acceptCrypto: boolean;
  requireFullPayment: boolean;
  allowPartialPayment: boolean;
  depositPercentage: number;
  enableServiceSelection: boolean;
  enableDateTimeSelection: boolean;
  enableCustomerDetails: boolean;
  enableAdditionalServices: boolean;
  enablePaymentStep: boolean;
  enableConfirmationStep: boolean;
  enableFileUpload: boolean;
  enableSpecialRequests: boolean;
  advanceBookingDays: number;
  minAdvanceBookingHours: number;
  maxBookingsPerDay: number;
  maxBookingsPerCustomer: number;
  bufferTimeBetweenBookings: number;
  businessHours?: Record<string, unknown> | null;
  blackoutDates?: unknown[] | null;
  holidaySchedule?: Record<string, unknown> | null;
  sendBookingConfirmation: boolean;
  sendReminders: boolean;
  reminderHours?: number[] | null;
  notifyTeamMembers: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  requireLogin: boolean;
  allowGuestBooking: boolean;
  showPricing: boolean;
  showTeamMemberSelection: boolean;
  allowRecurringBookings: boolean;
  enableWaitlist: boolean;
  enableAutoAssignment: boolean;
  assignmentStrategy: AssignmentStrategy;
  considerWorkload: boolean;
  considerSpecialization: boolean;
  enableDynamicPricing: boolean;
  peakHoursSurcharge: number;
  weekendSurcharge: number;
  emergencyBookingSurcharge: number;
  calendarSync: boolean;
  webhookUrl?: string | null;
  apiAccessEnabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy?: string | null;
  steps?: BookingStepConfig[];
  businessHoursConfig?: BusinessHoursConfig[];
  paymentMethods?: PaymentMethodConfig[];
  notificationTemplates?: NotificationTemplate[];
}

export type AssignmentStrategy =
  | 'ROUND_ROBIN'
  | 'LOAD_BALANCED'
  | 'SKILL_BASED'
  | 'AVAILABILITY_BASED'
  | 'MANUAL';

export interface BookingStepConfig {
  id: string;
  bookingSettingsId: string;
  stepName: string;
  stepOrder: number;
  enabled: boolean;
  required: boolean;
  title: string;
  description?: string | null;
  validationRules?: Record<string, unknown> | null;
  customFields?: unknown[] | null;
  createdAt: Date | string;
}

export interface BusinessHoursConfig {
  id: string;
  bookingSettingsId: string;
  dayOfWeek: number; // 0-6
  isWorkingDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  maxBookingsPerHour: number;
}

export interface PaymentMethodConfig {
  id: string;
  bookingSettingsId: string;
  methodType: string;
  enabled: boolean;
  displayName: string;
  description?: string | null;
  processingFee: number;
  minAmount: number;
  maxAmount?: number | null;
  gatewayConfig?: Record<string, unknown> | null;
}

export interface NotificationTemplate {
  id: string;
  bookingSettingsId: string;
  templateType: string;
  channel: string;
  enabled: boolean;
  subject?: string | null;
  content: string;
  variables?: string[] | null;
}

export interface BookingSettingsUpdateRequest {
  generalSettings?: Partial<Pick<BookingSettings,
    'bookingEnabled' | 'requireApproval' | 'allowCancellation' | 'allowRescheduling' |
    'cancellationDeadlineHours' | 'rescheduleDeadlineHours'>>;

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
    'requireLogin' | 'allowGuestBooking' | 'showPricing' | 'showTeamMemberSelection' |
    'allowRecurringBookings' | 'enableWaitlist'>>;

  assignmentSettings?: Partial<Pick<BookingSettings,
    'enableAutoAssignment' | 'assignmentStrategy' | 'considerWorkload' | 'considerSpecialization'>>;

  pricingSettings?: Partial<Pick<BookingSettings,
    'enableDynamicPricing' | 'peakHoursSurcharge' | 'weekendSurcharge' | 'emergencyBookingSurcharge'>>;

  integrationSettings?: Partial<Pick<BookingSettings,
    'calendarSync' | 'webhookUrl' | 'apiAccessEnabled'>>;
}

export interface SettingsValidationError { field: string; message: string; code: string }
export interface SettingsValidationWarning { field: string; message: string; suggestion?: string }
export interface SettingsValidationResult { isValid: boolean; errors: SettingsValidationError[]; warnings: SettingsValidationWarning[] }

export interface BookingSettingsExport {
  settings: BookingSettings;
  steps: BookingStepConfig[];
  businessHours: BusinessHoursConfig[];
  paymentMethods: PaymentMethodConfig[];
  notificationTemplates: NotificationTemplate[];
  exportedAt: Date | string;
  version: string;
}

export interface BookingSettingsImport {
  data: BookingSettingsExport;
  overwriteExisting: boolean;
  selectedSections: Array<'settings' | 'steps' | 'businessHours' | 'paymentMethods' | 'notifications'>;
}
