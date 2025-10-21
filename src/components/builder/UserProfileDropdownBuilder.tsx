'use client'

import { useEffect } from 'react'
import UserProfileDropdown from '../admin/layout/Header/UserProfileDropdown'

export interface UserProfileDropdownBuilderProps {
  showStatus?: boolean
}

export default function UserProfileDropdownBuilder({ showStatus = true }: UserProfileDropdownBuilderProps) {
  // Register with Builder.io if available (optional, non-blocking)
  useEffect(() => {
    void (async () => {
      try {
        // @ts-ignore - @builder.io/react is optional and may not be installed
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
  }, [])

  return <UserProfileDropdown showStatus={showStatus} />
}
