// src/app/api/admin/booking-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BookingSettingsService } from '@/services/booking-settings.service';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

const bookingSettingsService = new BookingSettingsService(prisma);

/**
 * GET /api/admin/booking-settings
 * Retrieves booking settings for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to view settings
    if (!hasPermission(session.user, 'BOOKING_SETTINGS_VIEW')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Get existing settings or create defaults
    let settings = await bookingSettingsService.getBookingSettings(organizationId);
    
    if (!settings) {
      // Create default settings for new organization
      settings = await bookingSettingsService.createDefaultSettings(organizationId);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching booking settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/booking-settings
 * Updates booking settings for the current organization
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to update settings
    if (!hasPermission(session.user, 'BOOKING_SETTINGS_EDIT')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Validate the update request
    const validation = await bookingSettingsService.validateSettingsUpdate(
      organizationId,
      updates
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Settings validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Update settings
    const updatedSettings = await bookingSettingsService.updateBookingSettings(
      organizationId,
      updates
    );

    // Log the settings change
    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'BOOKING_SETTINGS_UPDATED',
      resource: 'BookingSettings',
      details: updates
    });

    return NextResponse.json({
      settings: updatedSettings,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error('Error updating booking settings:', error);
    return NextResponse.json(
      { error: 'Failed to update booking settings' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/steps/route.ts

/**
 * PUT /api/admin/booking-settings/steps
 * Updates booking step configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_EDIT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { steps } = await request.json();
    const organizationId = session.user.organizationId;

    // Get current settings to find settings ID
    const currentSettings = await bookingSettingsService.getBookingSettings(organizationId);
    if (!currentSettings) {
      return NextResponse.json(
        { error: 'Booking settings not found' },
        { status: 404 }
      );
    }

    // Update steps
    const updatedSteps = await bookingSettingsService.updateBookingSteps(
      currentSettings.id,
      steps
    );

    // Log the change
    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'BOOKING_STEPS_UPDATED',
      resource: 'BookingStepConfig',
      details: { steps: updatedSteps.length }
    });

    return NextResponse.json({ steps: updatedSteps });
  } catch (error) {
    console.error('Error updating booking steps:', error);
    return NextResponse.json(
      { error: 'Failed to update booking steps' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/business-hours/route.ts

/**
 * PUT /api/admin/booking-settings/business-hours
 * Updates business hours configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_EDIT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessHours } = await request.json();
    const organizationId = session.user.organizationId;

    const currentSettings = await bookingSettingsService.getBookingSettings(organizationId);
    if (!currentSettings) {
      return NextResponse.json(
        { error: 'Booking settings not found' },
        { status: 404 }
      );
    }

    const updatedHours = await bookingSettingsService.updateBusinessHours(
      currentSettings.id,
      businessHours
    );

    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'BUSINESS_HOURS_UPDATED',
      resource: 'BusinessHoursConfig',
      details: { daysConfigured: updatedHours.length }
    });

    return NextResponse.json({ businessHours: updatedHours });
  } catch (error) {
    console.error('Error updating business hours:', error);
    return NextResponse.json(
      { error: 'Failed to update business hours' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/payment-methods/route.ts

/**
 * PUT /api/admin/booking-settings/payment-methods
 * Updates payment method configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_EDIT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethods } = await request.json();
    const organizationId = session.user.organizationId;

    const currentSettings = await bookingSettingsService.getBookingSettings(organizationId);
    if (!currentSettings) {
      return NextResponse.json(
        { error: 'Booking settings not found' },
        { status: 404 }
      );
    }

    const updatedMethods = await bookingSettingsService.updatePaymentMethods(
      currentSettings.id,
      paymentMethods
    );

    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'PAYMENT_METHODS_UPDATED',
      resource: 'PaymentMethodConfig',
      details: { methods: updatedMethods.length }
    });

    return NextResponse.json({ paymentMethods: updatedMethods });
  } catch (error) {
    console.error('Error updating payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to update payment methods' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/export/route.ts

/**
 * GET /api/admin/booking-settings/export
 * Exports complete booking settings configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_EXPORT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    const exportData = await bookingSettingsService.exportSettings(organizationId);

    // Log the export
    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'BOOKING_SETTINGS_EXPORTED',
      resource: 'BookingSettings',
      details: { exportVersion: exportData.version }
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting booking settings:', error);
    return NextResponse.json(
      { error: 'Failed to export booking settings' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/import/route.ts

/**
 * POST /api/admin/booking-settings/import
 * Imports booking settings configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_IMPORT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const importRequest = await request.json();
    const organizationId = session.user.organizationId;

    const importedSettings = await bookingSettingsService.importSettings(
      organizationId,
      importRequest
    );

    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'BOOKING_SETTINGS_IMPORTED',
      resource: 'BookingSettings',
      details: { 
        sections: importRequest.selectedSections,
        overwrite: importRequest.overwriteExisting
      }
    });

    return NextResponse.json({ settings: importedSettings });
  } catch (error) {
    console.error('Error importing booking settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import booking settings' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/reset/route.ts

/**
 * POST /api/admin/booking-settings/reset
 * Resets booking settings to default configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_RESET')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Backup current settings before reset
    const currentSettings = await bookingSettingsService.getBookingSettings(organizationId);
    
    const resetSettings = await bookingSettingsService.resetToDefaults(organizationId);

    await auditLog({
      userId: session.user.id,
      organizationId,
      action: 'BOOKING_SETTINGS_RESET',
      resource: 'BookingSettings',
      details: { 
        previousSettingsBackup: currentSettings?.id,
        resetToDefaults: true
      }
    });

    return NextResponse.json({ settings: resetSettings });
  } catch (error) {
    console.error('Error resetting booking settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset booking settings' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/booking-settings/validate/route.ts

/**
 * POST /api/admin/booking-settings/validate
 * Validates booking settings configuration without saving
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, 'BOOKING_SETTINGS_VIEW')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const organizationId = session.user.organizationId;

    const validation = await bookingSettingsService.validateSettingsUpdate(
      organizationId,
      updates
    );

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating booking settings:', error);
    return NextResponse.json(
      { error: 'Failed to validate booking settings' },
      { status: 500 }
    );
  }
}

// Helper function for audit logging
async function auditLog(logData: {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  details: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        ...logData,
        timestamp: new Date(),
        ipAddress: '127.0.0.1', // Should be extracted from request
        userAgent: 'Admin Panel' // Should be extracted from request
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break main functionality
  }
}