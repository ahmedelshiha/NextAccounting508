import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CreditCard, 
  Clock, 
  Users, 
  Bell, 
  Calendar, 
  Shield, 
  Zap,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Main Booking Settings Panel Component
const BookingSettingsPanel = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Tab configuration
  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'steps', label: 'Booking Steps', icon: Clock },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'customers', label: 'Customer Experience', icon: Users },
    { id: 'assignments', label: 'Team Assignments', icon: Shield },
    { id: 'pricing', label: 'Dynamic Pricing', icon: Zap }
  ];

  // Load settings on component mount
  useEffect(() => {
    loadBookingSettings();
  }, []);

  const loadBookingSettings = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      const response = await fetch('/api/admin/booking-settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load booking settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (section, field, value) => {
    const newChanges = {
      ...changes,
      [section]: {
        ...changes[section],
        [field]: value
      }
    };
    setChanges(newChanges);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);
      
      // Replace with actual API call
      const response = await fetch('/api/admin/booking-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setChanges({});
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const error = await response.json();
        setValidationErrors(error.errors || []);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        setSaving(true);
        await fetch('/api/admin/booking-settings/reset', { method: 'POST' });
        await loadBookingSettings();
        setChanges({});
      } catch (error) {
        console.error('Failed to reset settings:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const exportSettings = async () => {
    try {
      const response = await fetch('/api/admin/booking-settings/export');
      const data = await response.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="booking-settings-panel bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking System Settings</h1>
            <p className="text-gray-600 mt-1">Configure your booking system behavior and preferences</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportSettings}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={resetToDefaults}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={saving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </button>
            
            <button
              onClick={saveSettings}
              disabled={saving || Object.keys(changes).length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">Settings saved successfully!</span>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Please fix the following errors:</span>
            </div>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                  {changes[tab.id] && Object.keys(changes[tab.id]).length > 0 && (
                    <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'general' && (
            <GeneralSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('generalSettings', field, value)}
              values={changes.generalSettings || {}}
            />
          )}
          
          {activeTab === 'payments' && (
            <PaymentSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('paymentSettings', field, value)}
              values={changes.paymentSettings || {}}
            />
          )}
          
          {activeTab === 'steps' && (
            <BookingStepsSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('stepSettings', field, value)}
              values={changes.stepSettings || {}}
            />
          )}
          
          {activeTab === 'availability' && (
            <AvailabilitySettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('availabilitySettings', field, value)}
              values={changes.availabilitySettings || {}}
            />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('notificationSettings', field, value)}
              values={changes.notificationSettings || {}}
            />
          )}
          
          {activeTab === 'customers' && (
            <CustomerSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('customerSettings', field, value)}
              values={changes.customerSettings || {}}
            />
          )}
          
          {activeTab === 'assignments' && (
            <AssignmentSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('assignmentSettings', field, value)}
              values={changes.assignmentSettings || {}}
            />
          )}
          
          {activeTab === 'pricing' && (
            <PricingSettings 
              settings={settings} 
              onChange={(field, value) => handleSettingChange('pricingSettings', field, value)}
              values={changes.pricingSettings || {}}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// General Settings Component
const GeneralSettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">General Booking Settings</h2>
      <p className="text-gray-600 mb-6">Configure basic booking system behavior and policies</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SettingCard title="Booking Status" description="Enable or disable the booking system">
        <ToggleSwitch
          enabled={values.bookingEnabled ?? settings?.bookingEnabled ?? true}
          onChange={(value) => onChange('bookingEnabled', value)}
          label="Enable Booking System"
        />
      </SettingCard>

      <SettingCard title="Approval Process" description="Require manual approval for bookings">
        <ToggleSwitch
          enabled={values.requireApproval ?? settings?.requireApproval ?? false}
          onChange={(value) => onChange('requireApproval', value)}
          label="Require Approval"
        />
      </SettingCard>

      <SettingCard title="Cancellation Policy" description="Allow customers to cancel bookings">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.allowCancellation ?? settings?.allowCancellation ?? true}
            onChange={(value) => onChange('allowCancellation', value)}
            label="Allow Cancellation"
          />
          <NumberInput
            label="Cancellation Deadline (hours)"
            value={values.cancellationDeadlineHours ?? settings?.cancellationDeadlineHours ?? 24}
            onChange={(value) => onChange('cancellationDeadlineHours', value)}
            min={1}
            max={168}
            disabled={!(values.allowCancellation ?? settings?.allowCancellation ?? true)}
          />
        </div>
      </SettingCard>

      <SettingCard title="Rescheduling Policy" description="Allow customers to reschedule bookings">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.allowRescheduling ?? settings?.allowRescheduling ?? true}
            onChange={(value) => onChange('allowRescheduling', value)}
            label="Allow Rescheduling"
          />
          <NumberInput
            label="Reschedule Deadline (hours)"
            value={values.rescheduleDeadlineHours ?? settings?.rescheduleDeadlineHours ?? 4}
            onChange={(value) => onChange('rescheduleDeadlineHours', value)}
            min={1}
            max={72}
            disabled={!(values.allowRescheduling ?? settings?.allowRescheduling ?? true)}
          />
        </div>
      </SettingCard>
    </div>
  </div>
);

// Payment Settings Component
const PaymentSettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Configuration</h2>
      <p className="text-gray-600 mb-6">Configure payment methods and policies</p>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <SettingCard title="Payment Requirements" description="Configure when payment is required">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.paymentRequired ?? settings?.paymentRequired ?? false}
            onChange={(value) => onChange('paymentRequired', value)}
            label="Require Payment"
          />
          <div className="grid grid-cols-2 gap-4">
            <ToggleSwitch
              enabled={values.requireFullPayment ?? settings?.requireFullPayment ?? false}
              onChange={(value) => onChange('requireFullPayment', value)}
              label="Require Full Payment"
              disabled={!(values.paymentRequired ?? settings?.paymentRequired ?? false)}
            />
            <ToggleSwitch
              enabled={values.allowPartialPayment ?? settings?.allowPartialPayment ?? true}
              onChange={(value) => onChange('allowPartialPayment', value)}
              label="Allow Partial Payment"
              disabled={!(values.paymentRequired ?? settings?.paymentRequired ?? false)}
            />
          </div>
          <NumberInput
            label="Deposit Percentage (%)"
            value={values.depositPercentage ?? settings?.depositPercentage ?? 50}
            onChange={(value) => onChange('depositPercentage', value)}
            min={10}
            max={100}
            disabled={!(values.allowPartialPayment ?? settings?.allowPartialPayment ?? true)}
          />
        </div>
      </SettingCard>

      <SettingCard title="Payment Methods" description="Enable or disable payment methods">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <PaymentMethodToggle
            method="cash"
            label="Cash Payment"
            enabled={values.acceptCash ?? settings?.acceptCash ?? true}
            onChange={(value) => onChange('acceptCash', value)}
            icon="💵"
          />
          <PaymentMethodToggle
            method="card"
            label="Credit/Debit Card"
            enabled={values.acceptCard ?? settings?.acceptCard ?? true}
            onChange={(value) => onChange('acceptCard', value)}
            icon="💳"
          />
          <PaymentMethodToggle
            method="bank"
            label="Bank Transfer"
            enabled={values.acceptBankTransfer ?? settings?.acceptBankTransfer ?? false}
            onChange={(value) => onChange('acceptBankTransfer', value)}
            icon="🏦"
          />
          <PaymentMethodToggle
            method="wire"
            label="Wire Transfer"
            enabled={values.acceptWire ?? settings?.acceptWire ?? false}
            onChange={(value) => onChange('acceptWire', value)}
            icon="📤"
          />
          <PaymentMethodToggle
            method="crypto"
            label="Cryptocurrency"
            enabled={values.acceptCrypto ?? settings?.acceptCrypto ?? false}
            onChange={(value) => onChange('acceptCrypto', value)}
            icon="₿"
          />
        </div>
      </SettingCard>
    </div>
  </div>
);

// Booking Steps Settings Component
const BookingStepsSettings = ({ settings, onChange, values }) => {
  const steps = [
    { key: 'enableServiceSelection', label: 'Service Selection', description: 'Choose service type', required: true },
    { key: 'enableDateTimeSelection', label: 'Date & Time Selection', description: 'Pick appointment slot', required: true },
    { key: 'enableCustomerDetails', label: 'Customer Details', description: 'Contact information', required: true },
    { key: 'enableAdditionalServices', label: 'Additional Services', description: 'Extra services/add-ons', required: false },
    { key: 'enablePaymentStep', label: 'Payment Step', description: 'Process payment', required: false },
    { key: 'enableFileUpload', label: 'File Upload', description: 'Upload documents', required: false },
    { key: 'enableSpecialRequests', label: 'Special Requests', description: 'Additional requirements', required: false },
    { key: 'enableConfirmationStep', label: 'Confirmation', description: 'Review and confirm', required: true }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Flow Steps</h2>
        <p className="text-gray-600 mb-6">Configure which steps appear in the booking wizard</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <StepConfigCard
            key={step.key}
            step={step}
            order={index + 1}
            enabled={values[step.key] ?? settings?.[step.key] ?? true}
            onChange={(value) => onChange(step.key, value)}
          />
        ))}
      </div>
    </div>
  );
};

// Availability Settings Component
const AvailabilitySettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability Configuration</h2>
      <p className="text-gray-600 mb-6">Set booking timeframes and limits</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SettingCard title="Advance Booking" description="How far in advance bookings are allowed">
        <div className="space-y-3">
          <NumberInput
            label="Maximum Days in Advance"
            value={values.advanceBookingDays ?? settings?.advanceBookingDays ?? 365}
            onChange={(value) => onChange('advanceBookingDays', value)}
            min={1}
            max={730}
          />
          <NumberInput
            label="Minimum Hours in Advance"
            value={values.minAdvanceBookingHours ?? settings?.minAdvanceBookingHours ?? 2}
            onChange={(value) => onChange('minAdvanceBookingHours', value)}
            min={0}
            max={168}
          />
        </div>
      </SettingCard>

      <SettingCard title="Booking Limits" description="Maximum bookings allowed">
        <div className="space-y-3">
          <NumberInput
            label="Max Bookings per Day"
            value={values.maxBookingsPerDay ?? settings?.maxBookingsPerDay ?? 50}
            onChange={(value) => onChange('maxBookingsPerDay', value)}
            min={1}
            max={200}
          />
          <NumberInput
            label="Max Bookings per Customer"
            value={values.maxBookingsPerCustomer ?? settings?.maxBookingsPerCustomer ?? 5}
            onChange={(value) => onChange('maxBookingsPerCustomer', value)}
            min={1}
            max={20}
          />
        </div>
      </SettingCard>

      <SettingCard title="Buffer Time" description="Time between bookings">
        <NumberInput
          label="Buffer Minutes"
          value={values.bufferTimeBetweenBookings ?? settings?.bufferTimeBetweenBookings ?? 15}
          onChange={(value) => onChange('bufferTimeBetweenBookings', value)}
          min={0}
          max={120}
        />
      </SettingCard>
    </div>
  </div>
);

// Notification Settings Component
const NotificationSettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
      <p className="text-gray-600 mb-6">Configure automatic notifications and reminders</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SettingCard title="Booking Confirmations" description="Send confirmation notifications">
        <ToggleSwitch
          enabled={values.sendBookingConfirmation ?? settings?.sendBookingConfirmation ?? true}
          onChange={(value) => onChange('sendBookingConfirmation', value)}
          label="Send Confirmations"
        />
      </SettingCard>

      <SettingCard title="Reminders" description="Send reminder notifications">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.sendReminders ?? settings?.sendReminders ?? true}
            onChange={(value) => onChange('sendReminders', value)}
            label="Send Reminders"
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="24 Hours Before"
              value={24}
              disabled={true}
              readonly={true}
            />
            <NumberInput
              label="2 Hours Before"
              value={2}
              disabled={true}
              readonly={true}
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Notification Channels" description="Choose notification methods">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.emailNotifications ?? settings?.emailNotifications ?? true}
            onChange={(value) => onChange('emailNotifications', value)}
            label="Email Notifications"
          />
          <ToggleSwitch
            enabled={values.smsNotifications ?? settings?.smsNotifications ?? false}
            onChange={(value) => onChange('smsNotifications', value)}
            label="SMS Notifications"
          />
        </div>
      </SettingCard>

      <SettingCard title="Team Notifications" description="Notify team members">
        <ToggleSwitch
          enabled={values.notifyTeamMembers ?? settings?.notifyTeamMembers ?? true}
          onChange={(value) => onChange('notifyTeamMembers', value)}
          label="Notify Team Members"
        />
      </SettingCard>
    </div>
  </div>
);

// Customer Settings Component
const CustomerSettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Experience</h2>
      <p className="text-gray-600 mb-6">Configure customer-facing features</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SettingCard title="Authentication" description="Login requirements for booking">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.requireLogin ?? settings?.requireLogin ?? false}
            onChange={(value) => onChange('requireLogin', value)}
            label="Require Login"
          />
          <ToggleSwitch
            enabled={values.allowGuestBooking ?? settings?.allowGuestBooking ?? true}
            onChange={(value) => onChange('allowGuestBooking', value)}
            label="Allow Guest Booking"
            disabled={values.requireLogin ?? settings?.requireLogin ?? false}
          />
        </div>
      </SettingCard>

      <SettingCard title="Pricing Display" description="Show pricing information">
        <ToggleSwitch
          enabled={values.showPricing ?? settings?.showPricing ?? true}
          onChange={(value) => onChange('showPricing', value)}
          label="Show Pricing"
        />
      </SettingCard>

      <SettingCard title="Team Selection" description="Allow customers to choose team members">
        <ToggleSwitch
          enabled={values.showTeamMemberSelection ?? settings?.showTeamMemberSelection ?? false}
          onChange={(value) => onChange('showTeamMemberSelection', value)}
          label="Show Team Member Selection"
        />
      </SettingCard>

      <SettingCard title="Advanced Features" description="Additional booking options">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.allowRecurringBookings ?? settings?.allowRecurringBookings ?? false}
            onChange={(value) => onChange('allowRecurringBookings', value)}
            label="Allow Recurring Bookings"
          />
          <ToggleSwitch
            enabled={values.enableWaitlist ?? settings?.enableWaitlist ?? false}
            onChange={(value) => onChange('enableWaitlist', value)}
            label="Enable Waitlist"
          />
        </div>
      </SettingCard>
    </div>
  </div>
);

// Assignment Settings Component
const AssignmentSettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Assignment</h2>
      <p className="text-gray-600 mb-6">Configure automatic team member assignment</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SettingCard title="Auto Assignment" description="Automatically assign team members">
        <ToggleSwitch
          enabled={values.enableAutoAssignment ?? settings?.enableAutoAssignment ?? false}
          onChange={(value) => onChange('enableAutoAssignment', value)}
          label="Enable Auto Assignment"
        />
      </SettingCard>

      <SettingCard title="Assignment Strategy" description="How to assign team members">
        <SelectInput
          value={values.assignmentStrategy ?? settings?.assignmentStrategy ?? 'ROUND_ROBIN'}
          onChange={(value) => onChange('assignmentStrategy', value)}
          options={[
            { value: 'ROUND_ROBIN', label: 'Round Robin' },
            { value: 'LOAD_BALANCED', label: 'Load Balanced' },
            { value: 'SKILL_BASED', label: 'Skill Based' },
            { value: 'AVAILABILITY_BASED', label: 'Availability Based' },
            { value: 'MANUAL', label: 'Manual Only' }
          ]}
          disabled={!(values.enableAutoAssignment ?? settings?.enableAutoAssignment ?? false)}
        />
      </SettingCard>

      <SettingCard title="Assignment Factors" description="Consider these factors when assigning">
        <div className="space-y-3">
          <ToggleSwitch
            enabled={values.considerWorkload ?? settings?.considerWorkload ?? true}
            onChange={(value) => onChange('considerWorkload', value)}
            label="Consider Current Workload"
            disabled={!(values.enableAutoAssignment ?? settings?.enableAutoAssignment ?? false)}
          />
          <ToggleSwitch
            enabled={values.considerSpecialization ?? settings?.considerSpecialization ?? true}
            onChange={(value) => onChange('considerSpecialization', value)}
            label="Consider Specialization"
            disabled={!(values.enableAutoAssignment ?? settings?.enableAutoAssignment ?? false)}
          />
        </div>
      </SettingCard>
    </div>
  </div>
);

// Pricing Settings Component
const PricingSettings = ({ settings, onChange, values }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Dynamic Pricing</h2>
      <p className="text-gray-600 mb-6">Configure automatic price adjustments</p>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <SettingCard title="Dynamic Pricing" description="Enable automatic price adjustments">
        <ToggleSwitch
          enabled={values.enableDynamicPricing ?? settings?.enableDynamicPricing ?? false}
          onChange={(value) => onChange('enableDynamicPricing', value)}
          label="Enable Dynamic Pricing"
        />
      </SettingCard>

      <SettingCard title="Surcharges" description="Additional charges for specific conditions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PercentageInput
            label="Peak Hours Surcharge"
            value={values.peakHoursSurcharge ?? settings?.peakHoursSurcharge ?? 0}
            onChange={(value) => onChange('peakHoursSurcharge', value)}
            disabled={!(values.enableDynamicPricing ?? settings?.enableDynamicPricing ?? false)}
          />
          <PercentageInput
            label="Weekend Surcharge"
            value={values.weekendSurcharge ?? settings?.weekendSurcharge ?? 0}
            onChange={(value) => onChange('weekendSurcharge', value)}
            disabled={!(values.enableDynamicPricing ?? settings?.enableDynamicPricing ?? false)}
          />
          <PercentageInput
            label="Emergency Booking"
            value={values.emergencyBookingSurcharge ?? settings?.emergencyBookingSurcharge ?? 50}
            onChange={(value) => onChange('emergencyBookingSurcharge', value)}
            disabled={!(values.enableDynamicPricing ?? settings?.enableDynamicPricing ?? false)}
          />
        </div>
      </SettingCard>
    </div>
  </div>
);

// Utility Components
const SettingCard = ({ title, description, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {children}
  </div>
);

const ToggleSwitch = ({ enabled, onChange, label, disabled = false }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled && !disabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const NumberInput = ({ label, value, onChange, min, max, disabled = false, readonly = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      min={min}
      max={max}
      disabled={disabled || readonly}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
        disabled || readonly ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  </div>
);

const PercentageInput = ({ label, value, onChange, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={0}
        max={200}
        step={0.1}
        disabled={disabled}
        className={`block w-full pr-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">%</span>
    </div>
  </div>
);

const SelectInput = ({ value, onChange, options, disabled = false }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
      disabled ? 'bg-gray-100 cursor-not-allowed' : ''
    }`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const PaymentMethodToggle = ({ method, label, enabled, onChange, icon }) => (
  <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
    enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
  }`} onClick={() => onChange(!enabled)}>
    <div className="flex items-center space-x-2">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
      </div>
      <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
        {enabled && <div className="w-2 h-2 bg-white rounded-full m-1"></div>}
      </div>
    </div>
  </div>
);

const StepConfigCard = ({ step, order, enabled, onChange }) => (
  <div className={`border rounded-lg p-4 ${enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          enabled ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {order}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{step.label}</h4>
          <p className="text-sm text-gray-600">{step.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {step.required && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>}
        <ToggleSwitch
          enabled={enabled}
          onChange={onChange}
          disabled={step.required}
          label=""
        />
      </div>
    </div>
  </div>
);

export default BookingSettingsPanel;