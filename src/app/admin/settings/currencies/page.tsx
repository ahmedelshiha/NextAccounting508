import { redirect } from 'next/navigation'

export default function Page(){
  redirect('/admin/settings/financial?tab=currencies')
}
