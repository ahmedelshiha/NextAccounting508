// tests/booking-settings/booking-settings.service.test.ts

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { BookingSettingsService } from '../../src/services/booking-settings.service';
import { BookingSettingsUpdateRequest } from '../../src/types/booking-settings.types';

// Mock Prisma Client
const prismaMock = mockDeep<PrismaClient>();
const bookingSettingsService = new BookingSettingsService(prismaMock);

describe('BookingSettingsService', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getBookingSettings', () => {
    it('should return booking settings for valid organization', async () => {
      const mockSettings = {
        id: 'settings-1',
        organizationId: 'org-1',
        bookingEnabled: true,
        requireApproval: false,
        acceptCash: true,
        acceptCard: true,
        steps: [],
        businessHoursConfig: [],
        paymentMethods: [],
        notificationTemplates: []
      };

      prismaMock.bookingSettings.findUnique.mockResolvedValue(mockSettings as any);

      const result = await bookingSettingsService.getBookingSettings('org-1');

      expect(result).toEqual(mockSettings);
      expect(prismaMock.bookingSettings.findUnique).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
          businessHoursConfig: { orderBy: { dayOfWeek: 'asc' } },
          paymentMethods: { where: { enabled: true } },
          notificationTemplates: true
        }
      });
    });

    it('should return null for non-existent organization', async () => {
      prismaMock.bookingSettings.findUnique.mockResolvedValue(null);

      const result = await bookingSettingsService.getBookingSettings('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      prismaMock.bookingSettings.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(bookingSettingsService.getBookingSettings('org-1')).rejects.toThrow(
        'Failed to retrieve booking settings: Database connection failed'
      );
    });
  });

  describe('createDefaultSettings', () => {
    it('should create default settings with all related data', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return callback({
          bookingSettings: {
            create: jest.fn().mockResolvedValue({ id: 'settings-1' })
          },
          bookingStepConfig: {
            createMany: jest.fn().mockResolvedValue({ count: 4 })
          },
          businessHoursConfig: {
            createMany: jest.fn().mockResolvedValue({ count: 7 })
          },
          paymentMethodConfig: {
            createMany: jest.fn().mockResolvedValue({ count: 3 })
          },
          notificationTemplate: {
            createMany: jest.fn().mockResolvedValue({ count: 2 })
          }
        });
      });

      prismaMock.$transaction = mockTransaction as any;

      // Mock the subsequent getBookingSettings call
      const mockCompleteSettings = {
        id: 'settings-1',
        organizationId: 'org-1',
        bookingEnabled: true,
        steps: [],
        businessHoursConfig: [],
        paymentMethods: [],
        notificationTemplates: []
      };

      prismaMock.bookingSettings.findUnique.mockResolvedValue(mockCompleteSettings as any);

      const result = await bookingSettingsService.createDefaultSettings('org-1');

      expect(result).toEqual(mockCompleteSettings);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = jest.fn().mockRejectedValue(new Error('Transaction failed'));
      prismaMock.$transaction = mockTransaction as any;

      await expect(bookingSettingsService.createDefaultSettings('org-1')).rejects.toThrow(
        'Failed to create booking settings: Transaction failed'
      );
    });
  });

  describe('updateBookingSettings', () => {
    it('should update settings successfully with valid data', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        generalSettings: {
          bookingEnabled: false,
          requireApproval: true
        },
        paymentSettings: {
          acceptCash: false,
          acceptCard: true
        }
      };

      // Mock validation passing
      jest.spyOn(bookingSettingsService, 'validateSettingsUpdate').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      prismaMock.bookingSettings.update.mockResolvedValue({} as any);

      // Mock getBookingSettings call
      const mockUpdatedSettings = {
        id: 'settings-1',
        organizationId: 'org-1',
        bookingEnabled: false,
        requireApproval: true,
        acceptCash: false,
        acceptCard: true
      };

      jest.spyOn(bookingSettingsService, 'getBookingSettings').mockResolvedValue(mockUpdatedSettings as any);

      const result = await bookingSettingsService.updateBookingSettings('org-1', updateRequest);

      expect(result).toEqual(mockUpdatedSettings);
      expect(prismaMock.bookingSettings.update).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        data: expect.objectContaining({
          bookingEnabled: false,
          requireApproval: true,
          acceptCash: false,
          acceptCard: true,
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should reject update with validation errors', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        paymentSettings: {
          paymentRequired: true,
          acceptCash: false,
          acceptCard: false,
          acceptBankTransfer: false,
          acceptWire: false,
          acceptCrypto: false
        }
      };

      jest.spyOn(bookingSettingsService, 'validateSettingsUpdate').mockResolvedValue({
        isValid: false,
        errors: [{
          field: 'paymentSettings',
          message: 'At least one payment method must be enabled when payment is required',
          code: 'NO_PAYMENT_METHOD_ENABLED'
        }],
        warnings: []
      });

      await expect(bookingSettingsService.updateBookingSettings('org-1', updateRequest)).rejects.toThrow(
        'Settings validation failed: At least one payment method must be enabled when payment is required'
      );
    });
  });

  describe('validateSettingsUpdate', () => {
    it('should validate payment settings correctly', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        paymentSettings: {
          paymentRequired: true,
          acceptCash: false,
          acceptCard: false,
          acceptBankTransfer: false,
          acceptWire: false,
          acceptCrypto: false
        }
      };

      const result = await bookingSettingsService.validateSettingsUpdate('org-1', updateRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('NO_PAYMENT_METHOD_ENABLED');
    });

    it('should validate deposit percentage correctly', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        paymentSettings: {
          allowPartialPayment: true,
          depositPercentage: 150 // Invalid: over 100%
        }
      };

      const result = await bookingSettingsService.validateSettingsUpdate('org-1', updateRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_DEPOSIT_PERCENTAGE')).toBe(true);
    });

    it('should validate availability settings correctly', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        availabilitySettings: {
          minAdvanceBookingHours: -5 // Invalid: negative value
        }
      };

      const result = await bookingSettingsService.validateSettingsUpdate('org-1', updateRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_MIN_ADVANCE_HOURS')).toBe(true);
    });

    it('should generate warnings for potentially problematic settings', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        availabilitySettings: {
          advanceBookingDays: 800 // Warning: very high value
        }
      };

      const result = await bookingSettingsService.validateSettingsUpdate('org-1', updateRequest);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('advanceBookingDays');
    });

    it('should pass validation for valid settings', async () => {
      const updateRequest: BookingSettingsUpdateRequest = {
        generalSettings: {
          bookingEnabled: true,
          allowCancellation: true
        },
        paymentSettings: {
          paymentRequired: true,
          acceptCard: true,
          depositPercentage: 50
        }
      };

      const result = await bookingSettingsService.validateSettingsUpdate('org-1', updateRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

// tests/booking-settings/booking-settings-api.test.ts

import { NextRequest } from 'next/server';
import { GET, PUT } from '../../src/app/api/admin/booking-settings/route';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../src/lib/permissions');
jest.mock('../../src/services/booking-settings.service');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/admin/booking-settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET endpoint', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/booking-settings');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 for insufficient permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', organizationId: 'org-1' }
      } as any);

      // Mock hasPermission to return false
      require('../../src/lib/permissions').hasPermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/booking-settings');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should return settings for valid request', async () => {
      const mockSettings = {
        id: 'settings-1',
        organizationId: 'org-1',
        bookingEnabled: true
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', organizationId: 'org-1' }
      } as any);

      require('../../src/lib/permissions').hasPermission.mockReturnValue(true);

      const mockService = require('../../src/services/booking-settings.service').BookingSettingsService;
      mockService.prototype.getBookingSettings.mockResolvedValue(mockSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/booking-settings');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockSettings);
    });

    it('should create default settings if none exist', async () => {
      const mockDefaultSettings = {
        id: 'settings-1',
        organizationId: 'org-1',
        bookingEnabled: true
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', organizationId: 'org-1' }
      } as any);

      require('../../src/lib/permissions').hasPermission.mockReturnValue(true);

      const mockService = require('../../src/services/booking-settings.service').BookingSettingsService;
      mockService.prototype.getBookingSettings.mockResolvedValue(null);
      mockService.prototype.createDefaultSettings.mockResolvedValue(mockDefaultSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/booking-settings');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockDefaultSettings);
      expect(mockService.prototype.createDefaultSettings).toHaveBeenCalledWith('org-1');
    });
  });

  describe('PUT endpoint', () => {
    it('should update settings successfully', async () => {
      const updateRequest = {
        generalSettings: { bookingEnabled: false }
      };

      const mockUpdatedSettings = {
        id: 'settings-1',
        organizationId: 'org-1',
        bookingEnabled: false
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', organizationId: 'org-1' }
      } as any);

      require('../../src/lib/permissions').hasPermission.mockReturnValue(true);

      const mockService = require('../../src/services/booking-settings.service').BookingSettingsService;
      mockService.prototype.validateSettingsUpdate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });
      mockService.prototype.updateBookingSettings.mockResolvedValue(mockUpdatedSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/booking-settings', {
        method: 'PUT',
        body: JSON.stringify(updateRequest)
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.settings).toEqual(mockUpdatedSettings);
    });

    it('should return 400 for validation errors', async () => {
      const updateRequest = {
        paymentSettings: {
          paymentRequired: true,
          acceptCash: false,
          acceptCard: false,
          acceptBankTransfer: false,
          acceptWire: false,
          acceptCrypto: false
        }
      };

      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', organizationId: 'org-1' }
      } as any);

      require('../../src/lib/permissions').hasPermission.mockReturnValue(true);

      const mockService = require('../../src/services/booking-settings.service').BookingSettingsService;
      mockService.prototype.validateSettingsUpdate.mockResolvedValue({
        isValid: false,
        errors: [{
          field: 'paymentSettings',
          message: 'At least one payment method must be enabled when payment is required',
          code: 'NO_PAYMENT_METHOD_ENABLED'
        }],
        warnings: []
      });

      const request = new NextRequest('http://localhost:3000/api/admin/booking-settings', {
        method: 'PUT',
        body: JSON.stringify(updateRequest)
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Settings validation failed');
      expect(data.errors).toHaveLength(1);
    });
  });
});

// tests/booking-settings/booking-settings-panel.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingSettingsPanel } from '../../src/components/admin/BookingSettingsPanel';

// Mock fetch
global.fetch = jest.fn();

const mockSettings = {
  id: 'settings-1',
  organizationId: 'org-1',
  bookingEnabled: true,
  requireApproval: false,
  acceptCash: true,
  acceptCard: true,
  acceptWire: false,
  paymentRequired: false,
  allowCancellation: true,
  cancellationDeadlineHours: 24
};

describe('BookingSettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSettings)
    });
  });

  it('should render all setting tabs', async () => {
    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Payments')).toBeInTheDocument();
      expect(screen.getByText('Booking Steps')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Customer Experience')).toBeInTheDocument();
      expect(screen.getByText('Team Assignments')).toBeInTheDocument();
      expect(screen.getByText('Dynamic Pricing')).toBeInTheDocument();
    });
  });

  it('should load settings on mount', async () => {
    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/booking-settings');
    });
  });

  it('should switch tabs correctly', async () => {
    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('General Booking Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Payments'));

    await waitFor(() => {
      expect(screen.getByText('Payment Configuration')).toBeInTheDocument();
    });
  });

  it('should toggle settings and track changes', async () => {
    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Enable Booking System')).toBeInTheDocument();
    });

    const bookingEnabledToggle = screen.getByLabelText('Enable Booking System').closest('button');
    expect(bookingEnabledToggle).toBeInTheDocument();

    fireEvent.click(bookingEnabledToggle!);

    // Check if save button becomes enabled
    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('should save changes successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ settings: { ...mockSettings, bookingEnabled: false } })
      });

    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Enable Booking System')).toBeInTheDocument();
    });

    // Toggle a setting
    const bookingEnabledToggle = screen.getByLabelText('Enable Booking System').closest('button');
    fireEvent.click(bookingEnabledToggle!);

    // Click save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/booking-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('bookingEnabled')
      });
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    });
  });

  it('should display validation errors', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings)
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'Settings validation failed',
          errors: [{
            field: 'paymentSettings',
            message: 'At least one payment method must be enabled when payment is required'
          }]
        })
      });

    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Enable Booking System')).toBeInTheDocument();
    });

    // Make a change that will cause validation error
    fireEvent.click(screen.getByText('Payments'));
    
    await waitFor(() => {
      expect(screen.getByText('Require Payment')).toBeInTheDocument();
    });

    // Enable payment requirement
    const paymentRequiredToggle = screen.getByLabelText('Require Payment').closest('button');
    fireEvent.click(paymentRequiredToggle!);

    // Disable all payment methods (this will cause validation error)
    const cashToggle = screen.getByText('Cash Payment').closest('div');
    fireEvent.click(cashToggle!);
    
    const cardToggle = screen.getByText('Credit/Debit Card').closest('div');
    fireEvent.click(cardToggle!);

    // Try to save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      expect(screen.getByText('At least one payment method must be enabled when payment is required')).toBeInTheDocument();
    });
  });

  it('should export settings', async () => {
    const mockExportData = {
      settings: mockSettings,
      steps: [],
      businessHours: [],
      paymentMethods: [],
      notificationTemplates: [],
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExportData)
      });

    // Mock URL.createObjectURL and related DOM APIs
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    const mockClick = jest.fn();
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
    document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick
    })) as any;

    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/booking-settings/export');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  it('should reset to defaults with confirmation', async () => {
    const mockDefaultSettings = {
      ...mockSettings,
      requireApproval: false,
      acceptWire: false
    };

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ settings: mockDefaultSettings })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDefaultSettings)
      });

    render(<BookingSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reset to Defaults'));

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to reset all settings to defaults? This cannot be undone.'
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/booking-settings/reset', {
        method: 'POST'
      });
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });
});

// tests/booking-settings/payment-settings.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentSettings } from '../../src/components/admin/PaymentSettings';

describe('PaymentSettings', () => {
  const mockOnChange = jest.fn();
  const mockSettings = {
    paymentRequired: false,
    acceptCash: true,
    acceptCard: true,
    acceptBankTransfer: false,
    acceptWire: false,
    acceptCrypto: false,
    requireFullPayment: false,
    allowPartialPayment: true,
    depositPercentage: 50
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render payment method toggles', () => {
    render(
      <PaymentSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    expect(screen.getByText('Cash Payment')).toBeInTheDocument();
    expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(screen.getByText('Wire Transfer')).toBeInTheDocument();
    expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
  });

  it('should toggle payment methods correctly', () => {
    render(
      <PaymentSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    const wireTransferToggle = screen.getByText('Wire Transfer').closest('div');
    fireEvent.click(wireTransferToggle!);

    expect(mockOnChange).toHaveBeenCalledWith('acceptWire', true);
  });

  it('should disable deposit percentage when partial payment is disabled', () => {
    const settingsWithFullPayment = {
      ...mockSettings,
      allowPartialPayment: false
    };

    render(
      <PaymentSettings 
        settings={settingsWithFullPayment} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    const depositInput = screen.getByLabelText('Deposit Percentage (%)');
    expect(depositInput).toBeDisabled();
  });

  it('should handle deposit percentage changes', () => {
    render(
      <PaymentSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    const depositInput = screen.getByLabelText('Deposit Percentage (%)');
    fireEvent.change(depositInput, { target: { value: '75' } });

    expect(mockOnChange).toHaveBeenCalledWith('depositPercentage', 75);
  });
});

// tests/booking-settings/booking-steps-settings.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingStepsSettings } from '../../src/components/admin/BookingStepsSettings';

describe('BookingStepsSettings', () => {
  const mockOnChange = jest.fn();
  const mockSettings = {
    enableServiceSelection: true,
    enableDateTimeSelection: true,
    enableCustomerDetails: true,
    enableAdditionalServices: true,
    enablePaymentStep: false,
    enableFileUpload: false,
    enableSpecialRequests: true,
    enableConfirmationStep: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all booking steps', () => {
    render(
      <BookingStepsSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    expect(screen.getByText('Service Selection')).toBeInTheDocument();
    expect(screen.getByText('Date & Time Selection')).toBeInTheDocument();
    expect(screen.getByText('Customer Details')).toBeInTheDocument();
    expect(screen.getByText('Additional Services')).toBeInTheDocument();
    expect(screen.getByText('Payment Step')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Special Requests')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  it('should show required badge for required steps', () => {
    render(
      <BookingStepsSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    // Required steps should have "Required" badges
    const serviceSelectionCard = screen.getByText('Service Selection').closest('div');
    expect(serviceSelectionCard).toHaveTextContent('Required');

    const customerDetailsCard = screen.getByText('Customer Details').closest('div');
    expect(customerDetailsCard).toHaveTextContent('Required');

    const confirmationCard = screen.getByText('Confirmation').closest('div');
    expect(confirmationCard).toHaveTextContent('Required');

    // Optional steps should not have "Required" badges
    const additionalServicesCard = screen.getByText('Additional Services').closest('div');
    expect(additionalServicesCard).not.toHaveTextContent('Required');
  });

  it('should disable toggle for required steps', () => {
    render(
      <BookingStepsSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    // Try to toggle a required step - should not call onChange
    const serviceSelectionCard = screen.getByText('Service Selection').closest('[data-testid="step-config-card"]') || 
                                 screen.getByText('Service Selection').closest('div');
    
    const toggleButton = serviceSelectionCard?.querySelector('button[disabled]');
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(mockOnChange).not.toHaveBeenCalled();
    }
  });

  it('should allow toggling optional steps', () => {
    render(
      <BookingStepsSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    // Find the file upload step and toggle it
    const fileUploadCard = screen.getByText('File Upload').closest('div');
    const toggleButton = fileUploadCard?.querySelector('button:not([disabled])');
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(mockOnChange).toHaveBeenCalledWith('enableFileUpload', true);
    }
  });

  it('should display step descriptions', () => {
    render(
      <BookingStepsSettings 
        settings={mockSettings} 
        onChange={mockOnChange}
        values={{}}
      />
    );

    expect(screen.getByText('Choose service type')).toBeInTheDocument();
    expect(screen.getByText('Pick appointment slot')).toBeInTheDocument();
    expect(screen.getByText('Contact information')).toBeInTheDocument();
    expect(screen.getByText('Extra services/add-ons')).toBeInTheDocument();
    expect(screen.getByText('Process payment')).toBeInTheDocument();
    expect(screen.getByText('Upload documents')).toBeInTheDocument();
    expect(screen.getByText('Additional requirements')).toBeInTheDocument();
    expect(screen.getByText('Review and confirm')).toBeInTheDocument();
  });
});

// tests/booking-settings/integration.test.ts

import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { PrismaClient } from '@prisma/client';
import { BookingSettingsService } from '../../src/services/booking-settings.service';

// Use a test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/booking_test'
    }
  }
});

const bookingSettingsService = new BookingSettingsService(prisma);

describe('Booking Settings Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test database
    await prisma.bookingSettings.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.bookingSettings.deleteMany();
    await prisma.organization.deleteMany();
  });

  it('should create and retrieve booking settings end-to-end', async () => {
    // Create test organization
    const organization = await prisma.organization.create({
      data: {
        id: 'test-org-1',
        name: 'Test Organization',
        email: 'test@example.com'
      }
    });

    // Create default settings
    const settings = await bookingSettingsService.createDefaultSettings(organization.id);

    expect(settings).toBeDefined();
    expect(settings.organizationId).toBe(organization.id);
    expect(settings.bookingEnabled).toBe(true);
    expect(settings.acceptCash).toBe(true);
    expect(settings.acceptCard).toBe(true);

    // Verify settings can be retrieved
    const retrievedSettings = await bookingSettingsService.getBookingSettings(organization.id);
    expect(retrievedSettings).toEqual(settings);
  });

  it('should update settings with validation', async () => {
    // Create test organization and settings
    const organization = await prisma.organization.create({
      data: {
        id: 'test-org-2',
        name: 'Test Organization 2',
        email: 'test2@example.com'
      }
    });

    const initialSettings = await bookingSettingsService.createDefaultSettings(organization.id);

    // Update settings
    const updateRequest = {
      generalSettings: {
        bookingEnabled: false,
        requireApproval: true
      },
      paymentSettings: {
        acceptWire: true,
        depositPercentage: 75
      }
    };

    const updatedSettings = await bookingSettingsService.updateBookingSettings(
      organization.id,
      updateRequest
    );

    expect(updatedSettings.bookingEnabled).toBe(false);
    expect(updatedSettings.requireApproval).toBe(true);
    expect(updatedSettings.acceptWire).toBe(true);
    expect(updatedSettings.depositPercentage).toBe(75);
  });

  it('should reject invalid settings updates', async () => {
    // Create test organization and settings
    const organization = await prisma.organization.create({
      data: {
        id: 'test-org-3',
        name: 'Test Organization 3',
        email: 'test3@example.com'
      }
    });

    await bookingSettingsService.createDefaultSettings(organization.id);

    // Try to update with invalid settings (payment required but no methods enabled)
    const invalidUpdateRequest = {
      paymentSettings: {
        paymentRequired: true,
        acceptCash: false,
        acceptCard: false,
        acceptBankTransfer: false,
        acceptWire: false,
        acceptCrypto: false
      }
    };

    await expect(
      bookingSettingsService.updateBookingSettings(organization.id, invalidUpdateRequest)
    ).rejects.toThrow('Settings validation failed');
  });

  it('should export and import settings correctly', async () => {
    // Create test organization and settings
    const organization = await prisma.organization.create({
      data: {
        id: 'test-org-4',
        name: 'Test Organization 4',
        email: 'test4@example.com'
      }
    });

    const originalSettings = await bookingSettingsService.createDefaultSettings(organization.id);

    // Modify some settings
    await bookingSettingsService.updateBookingSettings(organization.id, {
      generalSettings: { requireApproval: true },
      paymentSettings: { acceptWire: true }
    });

    // Export settings
    const exportData = await bookingSettingsService.exportSettings(organization.id);
    expect(exportData.settings.requireApproval).toBe(true);
    expect(exportData.settings.acceptWire).toBe(true);

    // Create another organization for import test
    const targetOrganization = await prisma.organization.create({
      data: {
        id: 'test-org-5',
        name: 'Target Organization',
        email: 'target@example.com'
      }
    });

    await bookingSettingsService.createDefaultSettings(targetOrganization.id);

    // Import settings
    const importedSettings = await bookingSettingsService.importSettings(targetOrganization.id, {
      data: exportData,
      overwriteExisting: true,
      selectedSections: ['settings', 'steps', 'businessHours', 'paymentMethods', 'notifications']
    });

    expect(importedSettings.requireApproval).toBe(true);
    expect(importedSettings.acceptWire).toBe(true);
  });

  it('should reset settings to defaults', async () => {
    // Create test organization and settings
    const organization = await prisma.organization.create({
      data: {
        id: 'test-org-6',
        name: 'Test Organization 6',
        email: 'test6@example.com'
      }
    });

    const initialSettings = await bookingSettingsService.createDefaultSettings(organization.id);

    // Modify settings
    await bookingSettingsService.updateBookingSettings(organization.id, {
      generalSettings: {
        bookingEnabled: false,
        requireApproval: true,
        allowCancellation: false
      }
    });

    // Verify settings were modified
    const modifiedSettings = await bookingSettingsService.getBookingSettings(organization.id);
    expect(modifiedSettings?.bookingEnabled).toBe(false);
    expect(modifiedSettings?.requireApproval).toBe(true);
    expect(modifiedSettings?.allowCancellation).toBe(false);

    // Reset to defaults
    const resetSettings = await bookingSettingsService.resetToDefaults(organization.id);

    expect(resetSettings.bookingEnabled).toBe(true);
    expect(resetSettings.requireApproval).toBe(false);
    expect(resetSettings.allowCancellation).toBe(true);
  });
});