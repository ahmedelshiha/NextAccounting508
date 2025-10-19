'use client'

import UserProfileDropdown from '../admin/layout/Header/UserProfileDropdown'

export interface UserProfileDropdownBuilderProps {
  showStatus?: boolean
}

export default function UserProfileDropdownBuilder({ showStatus = true }: UserProfileDropdownBuilderProps) {
  return <UserProfileDropdown showStatus={showStatus} />
}
