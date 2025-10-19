import type { ProfileFieldDef } from "./types"

export const PROFILE_FIELDS: ProfileFieldDef[] = [
  { key: "name", label: "Full name", placeholder: "Add your name" },
  { key: "email", label: "Email", placeholder: "Add email", verified: true },
  { key: "organization", label: "Organization", placeholder: "Add organization" },
]

export const SECURITY_FIELDS: ProfileFieldDef[] = [
  { key: "userId", label: "User ID", masked: false },
  { key: "password", label: "Password", masked: true },
  { key: "twoFactorEnabled", label: "Two-factor authentication" },
]
