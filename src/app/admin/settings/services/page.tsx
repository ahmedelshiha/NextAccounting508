import { redirect } from 'next/navigation'

export default function Page() {
  // Services management lives under /admin/services — redirect here to avoid 404
  redirect('/admin/services')
}
