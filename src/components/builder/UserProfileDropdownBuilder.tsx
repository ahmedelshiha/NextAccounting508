'use client'

import UserProfileDropdown from '../admin/layout/Header/UserProfileDropdown'

export interface UserProfileDropdownBuilderProps {
  showStatus?: boolean
}

export default function UserProfileDropdownBuilder({ showStatus = true }: UserProfileDropdownBuilderProps) {
  return <UserProfileDropdown showStatus={showStatus} />
}

// Optional Builder.io registration. This is a no-op if @builder.io/react is not installed.
void (async () => {
  try {
    const mod: any = await import('@builder.io/react')
    const withBuilder = mod?.withBuilder
    if (typeof withBuilder === 'function') {
      withBuilder(UserProfileDropdownBuilder)({
        name: 'User Profile Dropdown',
        description: 'Profile dropdown with avatar, theme switcher, status, and Manage Profile panel.',
        image: 'https://cdn.builder.io/api/v1/image/assets%2FTEMP%2Fuser-profile-icon',
        inputs: [
          {
            name: 'showStatus',
            type: 'boolean',
            defaultValue: true,
            friendlyName: 'Show Status Selector',
            helperText: 'Toggle the Online/Away/Busy status section in the menu.'
          }
        ]
      })
    }
  } catch {
    // Silently ignore if Builder SDK is not available
  }
})()
