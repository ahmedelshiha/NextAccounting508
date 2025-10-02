import { redirect } from 'next/navigation'

export default function Page() {
  // Service Requests settings live under /admin/service-requests — redirect to avoid 404
  redirect('/admin/service-requests')
}
