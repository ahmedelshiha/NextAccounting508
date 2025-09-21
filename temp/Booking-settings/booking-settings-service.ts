// src/services/booking-settings.service.ts

import { PrismaClient } from '@prisma/client';
import {
  BookingSettings,
  BookingSettingsUpdateRequest,
  BookingStepConfig,
  BusinessHoursConfig,
  PaymentMethodConfig,
  NotificationTemplate,
  SettingsValidationResult,
  BookingSettingsExport,
  BookingSettingsImport,
  SettingsValidationError,
  SettingsValidationWarning
} from '@/types/booking-settings.types';

/**
 * Service class for managing booking system configuration settings
 * Provides comprehensive CRUD operations and validation for booking settings
 */
export class BookingSettingsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieves complete booking settings for an organization
   * @param organizationId - Organization identifier
   * @returns Promise resolving to complete booking settings or null
   */
  async getBookingSettings(organizationId: string): Promise<BookingSettings | null> {
    try {
      const settings = await this.prisma.bookingSettings.findUnique({
        where: { organizationId },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          },
          businessHoursConfig: {
            orderBy: { dayOfWeek: 'asc' }
          },
          paymentMethods: {
            where: { enabled: true }
          },
          notificationTemplates: true
        }
      });

      if (!settings) return null;

      // Transform database result to typed interface
      return this.transformDatabaseResult(settings);
    } catch (error) {
      console.error('Error retrieving booking settings:', error);
      throw new Error(`Failed to retrieve booking settings: ${error.message}`);
    }
  }

  /**
   * Creates default booking settings for a new organization
   * @param organizationId - Organization identifier
   * @returns Promise resolving to created booking settings
   */
  async createDefaultSettings(organizationId: string): Promise<BookingSettings> {
    try {
      const defaultSettings = await this.prisma.$transaction(async (tx) => {
        // Create main settings record
        const settings = await tx.bookingSettings.create({
          data: {
            id: this.generateId(),
            organizationId,
            // Default values are defined in database schema
          }
        });

        // Create default booking steps
        const defaultSteps = this.getDefaultBookingSteps(settings.id);
        await tx.bookingStepConfig.createMany({
          data: defaultSteps
        });

        // Create default business hours (Monday-Friday, 9-5)
        const defaultBusinessHours = this.getDefaultBusinessHours(settings.id);
        await tx.businessHoursConfig.createMany({
          data: defaultBusinessHours
        });

        // Create default payment methods
        const defaultPaymentMethods = this.getDefaultPaymentMethods(settings.id);
        await tx.paymentMethodConfig.createMany({
          data: defaultPaymentMethods
        });

        // Create default notification templates
        const defaultNotificationTemplates = this.getDefaultNotificationTemplates(settings.id);
        await tx.notificationTemplate.createMany({
          data: defaultNotificationTemplates
        });

        return settings;
      });

      // Return complete settings with relations
      return this.getBookingSettings(organizationId) as Promise<BookingSettings>;
    } catch (error) {
      console.error('Error creating default booking settings:', error);
      throw new Error(`Failed to create booking settings: ${error.message}`);
    }
  }

  /**
   * Updates booking settings with validation
   * @param organizationId - Organization identifier
   * @param updates - Settings update request
   * @returns Promise resolving to updated settings
   */
  async updateBookingSettings(
    organizationId: string,
    updates: BookingSettingsUpdateRequest
  ): Promise<BookingSettings> {
    try {
      // Validate updates first
      const validation = await this.validateSettingsUpdate(organizationId, updates);
      if (!validation.isValid) {
        throw new Error(`Settings validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Prepare update data by merging all setting sections
      const updateData = {
        ...updates.generalSettings,
        ...updates.paymentSettings,
        ...updates.stepSettings,
        ...updates.availabilitySettings,
        ...updates.notificationSettings,
        ...updates.customerSettings,
        ...updates.assignmentSettings,
        ...updates.pricingSettings,
        ...updates.integrationSettings,
        updatedAt: new Date(),
        updatedBy: 'system' // Should be replaced with actual user ID
      };

      // Update main settings
      await this.prisma.bookingSettings.update({
        where: { organizationId },
        data: updateData
      });

      // Return updated settings
      const updatedSettings = await this.getBookingSettings(organizationId);
      
      // Emit settings change event for real-time updates
      await this.emitSettingsChangeEvent(organizationId, updates);
      
      return updatedSettings as BookingSettings;
    } catch (error) {
      console.error('Error updating booking settings:', error);
      throw new Error(`Failed to update booking settings: ${error.message}`);
    }
  }

  /**
   * Updates booking step configuration
   * @param settingsId - Booking settings identifier
   * @param steps - Array of step configurations
   * @returns Promise resolving to updated steps
   */
  async updateBookingSteps(settingsId: string, steps: Partial<BookingStepConfig>[]): Promise<BookingStepConfig[]> {
    try {
      const updatedSteps = await this.prisma.$transaction(async (tx) => {
        // Delete existing steps
        await tx.bookingStepConfig.deleteMany({
          where: { bookingSettingsId: settingsId }
        });

        // Create updated steps
        const stepData = steps.map((step, index) => ({
          id: step.id || this.generateId(),
          bookingSettingsId: settingsId,
          stepName: step.stepName!,
          stepOrder: step.stepOrder ?? index + 1,
          enabled: step.enabled ?? true,
          required: step.required ?? true,
          title: step.title || this.getDefaultStepTitle(step.stepName!),
          description: step.description,
          validationRules: step.validationRules || {},
          customFields: step.customFields || []
        }));

        await tx.bookingStepConfig.createMany({
          data: stepData
        });

        // Return created steps
        return tx.bookingStepConfig.findMany({
          where: { bookingSettingsId: settingsId },
          orderBy: { stepOrder: 'asc' }
        });
      });

      return updatedSteps;
    } catch (error) {
      console.error('Error updating booking steps:', error);
      throw new Error(`Failed to update booking steps: ${error.message}`);
    }
  }

  /**
   * Updates business hours configuration
   * @param settingsId - Booking settings identifier  
   * @param businessHours - Business hours configuration
   * @returns Promise resolving to updated business hours
   */
  async updateBusinessHours(
    settingsId: string, 
    businessHours: Partial<BusinessHoursConfig>[]
  ): Promise<BusinessHoursConfig[]> {
    try {
      const updatedHours = await this.prisma.$transaction(async (tx) => {
        // Delete existing configuration
        await tx.businessHoursConfig.deleteMany({
          where: { bookingSettingsId: settingsId }
        });

        // Create updated configuration
        const hoursData = businessHours.map(hours => ({
          id: hours.id || this.generateId(),
          bookingSettingsId: settingsId,
          dayOfWeek: hours.dayOfWeek!,
          isWorkingDay: hours.isWorkingDay ?? true,
          startTime: hours.startTime,
          endTime: hours.endTime,
          breakStartTime: hours.breakStartTime,
          breakEndTime: hours.breakEndTime,
          maxBookingsPerHour: hours.maxBookingsPerHour ?? 4
        }));

        await tx.businessHoursConfig.createMany({
          data: hoursData
        });

        return tx.businessHoursConfig.findMany({
          where: { bookingSettingsId: settingsId },
          orderBy: { dayOfWeek: 'asc' }
        });
      });

      return updatedHours;
    } catch (error) {
      console.error('Error updating business hours:', error);
      throw new Error(`Failed to update business hours: ${error.message}`);
    }
  }

  /**
   * Updates payment method configuration
   * @param settingsId - Booking settings identifier
   * @param paymentMethods - Payment method configurations
   * @returns Promise resolving to updated payment methods
   */
  async updatePaymentMethods(
    settingsId: string,
    paymentMethods: Partial<PaymentMethodConfig>[]
  ): Promise<PaymentMethodConfig[]> {
    try {
      const updatedMethods = await this.prisma.$transaction(async (tx) => {
        // Update existing or create new payment methods
        for (const method of paymentMethods) {
          await tx.paymentMethodConfig.upsert({
            where: {
              bookingSettingsId_methodType: {
                bookingSettingsId: settingsId,
                methodType: method.methodType!
              }
            },
            update: {
              enabled: method.enabled ?? true,
              displayName: method.displayName || method.methodType,
              description: method.description,
              processingFee: method.processingFee ?? 0,
              minAmount: method.minAmount ?? 0,
              maxAmount: method.maxAmount,
              gatewayConfig: method.gatewayConfig || {}
            },
            create: {
              id: this.generateId(),
              bookingSettingsId: settingsId,
              methodType: method.methodType!,
              enabled: method.enabled ?? true,
              displayName: method.displayName || method.methodType,
              description: method.description,
              processingFee: method.processingFee ?? 0,
              minAmount: method.minAmount ?? 0,
              maxAmount: method.maxAmount,
              gatewayConfig: method.gatewayConfig || {}
            }
          });
        }

        return tx.paymentMethodConfig.findMany({
          where: { bookingSettingsId: settingsId }
        });
      });

      return updatedMethods;
    } catch (error) {
      console.error('Error updating payment methods:', error);
      throw new Error(`Failed to update payment methods: ${error.message}`);
    }
  }

  /**
   * Validates settings update request
   * @param organizationId - Organization identifier
   * @param updates - Settings update request
   * @returns Promise resolving to validation result
   */
  async validateSettingsUpdate(
    organizationId: string,
    updates: BookingSettingsUpdateRequest
  ): Promise<SettingsValidationResult> {
    const errors: SettingsValidationError[] = [];
    const warnings: SettingsValidationWarning[] = [];

    try {
      // Validate payment settings
      if (updates.paymentSettings) {
        await this.validatePaymentSettings(updates.paymentSettings, errors, warnings);
      }

      // Validate availability settings
      if (updates.availabilitySettings) {
        await this.validateAvailabilitySettings(updates.availabilitySettings, errors, warnings);
      }

      // Validate step settings
      if (updates.stepSettings) {
        await this.validateStepSettings(updates.stepSettings, errors, warnings);
      }

      // Validate notification settings
      if (updates.notificationSettings) {
        await this.validateNotificationSettings(updates.notificationSettings, errors, warnings);
      }

      // Validate pricing settings
      if (updates.pricingSettings) {
        await this.validatePricingSettings(updates.pricingSettings, errors, warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error during settings validation:', error);
      errors.push({
        field: 'general',
        message: 'Validation process failed',
        code: 'VALIDATION_ERROR'
      });

      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Exports complete booking settings configuration
   * @param organizationId - Organization identifier
   * @returns Promise resolving to exportable settings data
   */
  async exportSettings(organizationId: string): Promise<BookingSettingsExport> {
    try {
      const settings = await this.getBookingSettings(organizationId);
      if (!settings) {
        throw new Error('No booking settings found for organization');
      }

      return {
        settings,
        steps: settings.steps || [],
        businessHours: settings.businessHoursConfig || [],
        paymentMethods: settings.paymentMethods || [],
        notificationTemplates: settings.notificationTemplates || [],
        exportedAt: new Date(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Error exporting booking settings:', error);
      throw new Error(`Failed to export booking settings: ${error.message}`);
    }
  }

  /**
   * Imports booking settings configuration
   * @param organizationId - Organization identifier
   * @param importData - Settings import data
   * @returns Promise resolving to imported settings
   */
  async importSettings(organizationId: string, importData: BookingSettingsImport): Promise<BookingSettings> {
    try {
      const { data, overwriteExisting, selectedSections } = importData;

      // Validate import data
      await this.validateImportData(data);

      const importedSettings = await this.prisma.$transaction(async (tx) => {
        let settingsId: string;

        if (overwriteExisting) {
          // Update existing settings
          await tx.bookingSettings.update({
            where: { organizationId },
            data: {
              ...data.settings,
              id: undefined, // Remove ID to prevent conflicts
              organizationId, // Ensure correct organization
              updatedAt: new Date()
            }
          });

          const existingSettings = await tx.bookingSettings.findUnique({
            where: { organizationId }
          });
          settingsId = existingSettings!.id;
        } else {
          // Create new settings
          const newSettings = await tx.bookingSettings.create({
            data: {
              ...data.settings,
              id: this.generateId(),
              organizationId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          settingsId = newSettings.id;
        }

        // Import selected sections
        if (selectedSections.includes('steps') && data.steps.length > 0) {
          await tx.bookingStepConfig.deleteMany({
            where: { bookingSettingsId: settingsId }
          });

          await tx.bookingStepConfig.createMany({
            data: data.steps.map(step => ({
              ...step,
              id: this.generateId(),
              bookingSettingsId: settingsId
            }))
          });
        }

        if (selectedSections.includes('businessHours') && data.businessHours.length > 0) {
          await tx.businessHoursConfig.deleteMany({
            where: { bookingSettingsId: settingsId }
          });

          await tx.businessHoursConfig.createMany({
            data: data.businessHours.map(hours => ({
              ...hours,
              id: this.generateId(),
              bookingSettingsId: settingsId
            }))
          });
        }

        if (selectedSections.includes('paymentMethods') && data.paymentMethods.length > 0) {
          await tx.paymentMethodConfig.deleteMany({
            where: { bookingSettingsId: settingsId }
          });

          await tx.paymentMethodConfig.createMany({
            data: data.paymentMethods.map(method => ({
              ...method,
              id: this.generateId(),
              bookingSettingsId: settingsId
            }))
          });
        }

        if (selectedSections.includes('notifications') && data.notificationTemplates.length > 0) {
          await tx.notificationTemplate.deleteMany({
            where: { bookingSettingsId: settingsId }
          });

          await tx.notificationTemplate.createMany({
            data: data.notificationTemplates.map(template => ({
              ...template,
              id: this.generateId(),
              bookingSettingsId: settingsId
            }))
          });
        }

        return settingsId;
      });

      // Return imported settings
      return this.getBookingSettings(organizationId) as Promise<BookingSettings>;
    } catch (error) {
      console.error('Error importing booking settings:', error);
      throw new Error(`Failed to import booking settings: ${error.message}`);
    }
  }

  /**
   * Resets booking settings to default configuration
   * @param organizationId - Organization identifier
   * @returns Promise resolving to reset settings
   */
  async resetToDefaults(organizationId: string): Promise<BookingSettings> {
    try {
      // Delete existing settings and related data
      await this.prisma.$transaction(async (tx) => {
        const existingSettings = await tx.bookingSettings.findUnique({
          where: { organizationId }
        });

        if (existingSettings) {
          // Delete related data
          await tx.bookingStepConfig.deleteMany({
            where: { bookingSettingsId: existingSettings.id }
          });
          await tx.businessHoursConfig.deleteMany({
            where: { bookingSettingsId: existingSettings.id }
          });
          await tx.paymentMethodConfig.deleteMany({
            where: { bookingSettingsId: existingSettings.id }
          });
          await tx.notificationTemplate.deleteMany({
            where: { bookingSettingsId: existingSettings.id }
          });

          // Delete main settings
          await tx.bookingSettings.delete({
            where: { organizationId }
          });
        }
      });

      // Create new default settings
      return this.createDefaultSettings(organizationId);
    } catch (error) {
      console.error('Error resetting booking settings:', error);
      throw new Error(`Failed to reset booking settings: ${error.message}`);
    }
  }

  // Private helper methods

  private transformDatabaseResult(dbResult: any): BookingSettings {
    return {
      ...dbResult,
      businessHours: dbResult.businessHours || {},
      blackoutDates: dbResult.blackoutDates || [],
      holidaySchedule: dbResult.holidaySchedule || {},
      reminderHours: dbResult.reminderHours || [24, 2]
    };
  }

  private getDefaultBookingSteps(settingsId: string): any[] {
    const defaultSteps = [
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        stepName: 'SERVICE_SELECTION',
        stepOrder: 1,
        enabled: true,
        required: true,
        title: 'Select Service',
        description: 'Choose the service you would like to book',
        validationRules: { required: true },
        customFields: []
      },
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        stepName: 'DATETIME_SELECTION',
        stepOrder: 2,
        enabled: true,
        required: true,
        title: 'Select Date & Time',
        description: 'Choose your preferred date and time',
        validationRules: { required: true },
        customFields: []
      },
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        stepName: 'CUSTOMER_DETAILS',
        stepOrder: 3,
        enabled: true,
        required: true,
        title: 'Your Details',
        description: 'Provide your contact information',
        validationRules: { required: true },
        customFields: []
      },
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        stepName: 'CONFIRMATION',
        stepOrder: 4,
        enabled: true,
        required: true,
        title: 'Confirmation',
        description: 'Review and confirm your booking',
        validationRules: {},
        customFields: []
      }
    ];

    return defaultSteps;
  }

  private getDefaultBusinessHours(settingsId: string): any[] {
    const defaultHours = [];
    
    // Monday to Friday: 9 AM - 5 PM
    for (let day = 1; day <= 5; day++) {
      defaultHours.push({
        id: this.generateId(),
        bookingSettingsId: settingsId,
        dayOfWeek: day,
        isWorkingDay: true,
        startTime: '09:00:00',
        endTime: '17:00:00',
        breakStartTime: '12:00:00',
        breakEndTime: '13:00:00',
        maxBookingsPerHour: 4
      });
    }

    // Saturday: 9 AM - 1 PM
    defaultHours.push({
      id: this.generateId(),
      bookingSettingsId: settingsId,
      dayOfWeek: 6,
      isWorkingDay: true,
      startTime: '09:00:00',
      endTime: '13:00:00',
      maxBookingsPerHour: 2
    });

    // Sunday: Closed
    defaultHours.push({
      id: this.generateId(),
      bookingSettingsId: settingsId,
      dayOfWeek: 0,
      isWorkingDay: false,
      maxBookingsPerHour: 0
    });

    return defaultHours;
  }

  private getDefaultPaymentMethods(settingsId: string): any[] {
    return [
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        methodType: 'CASH',
        enabled: true,
        displayName: 'Cash Payment',
        description: 'Pay in cash at the time of service',
        processingFee: 0.00,
        minAmount: 0.00,
        gatewayConfig: {}
      },
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        methodType: 'CARD',
        enabled: true,
        displayName: 'Credit/Debit Card',
        description: 'Pay with your credit or debit card',
        processingFee: 2.90,
        minAmount: 10.00,
        gatewayConfig: {
          gateway: 'stripe',
          testMode: true
        }
      },
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        methodType: 'BANK_TRANSFER',
        enabled: false,
        displayName: 'Bank Transfer',
        description: 'Transfer payment directly to our bank account',
        processingFee: 0.00,
        minAmount: 100.00,
        gatewayConfig: {}
      }
    ];
  }

  private getDefaultNotificationTemplates(settingsId: string): any[] {
    return [
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        templateType: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        enabled: true,
        subject: 'Booking Confirmation - {{serviceName}}',
        content: `Dear {{customerName}},

Your booking has been confirmed!

Service: {{serviceName}}
Date & Time: {{bookingDateTime}}
Duration: {{duration}}
Location: {{location}}

If you need to make any changes, please contact us at least {{cancellationDeadline}} hours in advance.

Thank you for choosing our services!`,
        variables: ['customerName', 'serviceName', 'bookingDateTime', 'duration', 'location', 'cancellationDeadline']
      },
      {
        id: this.generateId(),
        bookingSettingsId: settingsId,
        templateType: 'BOOKING_REMINDER',
        channel: 'EMAIL',
        enabled: true,
        subject: 'Reminder: Upcoming Appointment - {{serviceName}}',
        content: `Hello {{customerName}},

This is a reminder that you have an upcoming appointment:

Service: {{serviceName}}
Date & Time: {{bookingDateTime}}
Location: {{location}}

We look forward to seeing you!`,
        variables: ['customerName', 'serviceName', 'bookingDateTime', 'location']
      }
    ];
  }

  private async validatePaymentSettings(settings: any, errors: SettingsValidationError[], warnings: SettingsValidationWarning[]): Promise<void> {
    // Check if at least one payment method is enabled when payment is required
    if (settings.paymentRequired) {
      const hasEnabledMethod = settings.acceptCash || settings.acceptCard || 
                              settings.acceptBankTransfer || settings.acceptWire || 
                              settings.acceptCrypto;
      
      if (!hasEnabledMethod) {
        errors.push({
          field: 'paymentSettings',
          message: 'At least one payment method must be enabled when payment is required',
          code: 'NO_PAYMENT_METHOD_ENABLED'
        });
      }
    }

    // Validate deposit percentage
    if (settings.allowPartialPayment && settings.depositPercentage) {
      if (settings.depositPercentage < 10 || settings.depositPercentage > 100) {
        errors.push({
          field: 'depositPercentage',
          message: 'Deposit percentage must be between 10% and 100%',
          code: 'INVALID_DEPOSIT_PERCENTAGE'
        });
      }
    }
  }

  private async validateAvailabilitySettings(settings: any, errors: SettingsValidationError[], warnings: SettingsValidationWarning[]): Promise<void> {
    // Validate advance booking constraints
    if (settings.minAdvanceBookingHours && settings.minAdvanceBookingHours < 0) {
      errors.push({
        field: 'minAdvanceBookingHours',
        message: 'Minimum advance booking hours cannot be negative',
        code: 'INVALID_MIN_ADVANCE_HOURS'
      });
    }

    if (settings.advanceBookingDays && settings.advanceBookingDays > 730) {
      warnings.push({
        field: 'advanceBookingDays',
        message: 'Advance booking period is more than 2 years',
        suggestion: 'Consider reducing to improve performance'
      });
    }

    // Validate booking limits
    if (settings.maxBookingsPerDay && settings.maxBookingsPerDay > 200) {
      warnings.push({
        field: 'maxBookingsPerDay',
        message: 'High daily booking limit may impact performance',
        suggestion: 'Consider implementing hourly limits instead'
      });
    }
  }

  private async validateStepSettings(settings: any, errors: SettingsValidationError[], warnings: SettingsValidationWarning[]): Promise<void> {
    // Ensure required steps are enabled
    const requiredSteps = ['enableServiceSelection', 'enableDateTimeSelection', 'enableCustomerDetails'];
    
    for (const step of requiredSteps) {
      if (settings[step] === false) {
        errors.push({
          field: step,
          message: `${step} is required and cannot be disabled`,
          code: 'REQUIRED_STEP_DISABLED'
        });
      }
    }

    // Warn about payment step configuration
    if (settings.enablePaymentStep && !settings.paymentRequired) {
      warnings.push({
        field: 'enablePaymentStep',
        message: 'Payment step is enabled but payment is not required',
        suggestion: 'Consider enabling payment requirement or disabling payment step'
      });
    }
  }

  private async validateNotificationSettings(settings: any, errors: SettingsValidationError[], warnings: SettingsValidationWarning[]): Promise<void> {
    // Validate reminder hours
    if (settings.reminderHours && Array.isArray(settings.reminderHours)) {
      const invalidHours = settings.reminderHours.filter((hour: number) => hour < 0 || hour > 8760); // Max 1 year
      
      if (invalidHours.length > 0) {
        errors.push({
          field: 'reminderHours',
          message: 'Reminder hours must be between 0 and 8760 (1 year)',
          code: 'INVALID_REMINDER_HOURS'
        });
      }
    }

    // Check notification method availability
    if (settings.smsNotifications && !process.env.SMS_PROVIDER_CONFIGURED) {
      warnings.push({
        field: 'smsNotifications',
        message: 'SMS notifications enabled but no SMS provider configured',
        suggestion: 'Configure SMS provider or disable SMS notifications'
      });
    }
  }

  private async validatePricingSettings(settings: any, errors: SettingsValidationError[], warnings: SettingsValidationWarning[]): Promise<void> {
    // Validate surcharge percentages
    const surchargeFields = ['peakHoursSurcharge', 'weekendSurcharge', 'emergencyBookingSurcharge'];
    
    for (const field of surchargeFields) {
      if (settings[field] !== undefined) {
        if (settings[field] < 0 || settings[field] > 2) { // Max 200% surcharge
          errors.push({
            field,
            message: 'Surcharge must be between 0% and 200%',
            code: 'INVALID_SURCHARGE_PERCENTAGE'
          });
        }
      }
    }
  }

  private async validateImportData(data: BookingSettingsExport): Promise<void> {
    if (!data.settings || !data.version) {
      throw new Error('Invalid import data format');
    }

    // Add version compatibility checks here
    if (data.version !== '1.0.0') {
      throw new Error(`Unsupported settings version: ${data.version}`);
    }
  }

  private getDefaultStepTitle(stepName: string): string {
    const titles: Record<string, string> = {
      'SERVICE_SELECTION': 'Select Service',
      'DATETIME_SELECTION': 'Select Date & Time',
      'CUSTOMER_DETAILS': 'Your Details',
      'ADDITIONAL_SERVICES': 'Additional Services',
      'PAYMENT': 'Payment',
      'CONFIRMATION': 'Confirmation',
      'FILE_UPLOAD': 'Upload Files',
      'SPECIAL_REQUESTS': 'Special Requests'
    };

    return titles[stepName] || stepName.replace('_', ' ');
  }

  private async emitSettingsChangeEvent(organizationId: string, updates: BookingSettingsUpdateRequest): Promise<void> {
    // Implement real-time event emission for settings changes
    // This would typically use WebSocket or Server-Sent Events
    console.log('Settings changed for organization:', organizationId, updates);
  }

  private generateId(): string {
    return `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}