import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'

export async function toastFromResponse(res: Response, opts?: { success?: string; failure?: string }) {
  try {
    if (res.ok) {
      if (opts?.success) toast.success(opts.success)
      return
    }
    let body: any = null
    try { body = await res.clone().json() } catch {}
    const msg = getApiErrorMessage(body || { error: res.statusText }, opts?.failure || 'Request failed')
    toast.error(msg)
  } catch {
    toast.error(opts?.failure || 'Request failed')
  }
}

export function toastError(err: unknown, fallback = 'Something went wrong') {
  try {
    const message = getApiErrorMessage(err as any, fallback)
    toast.error(message)
  } catch {
    toast.error(fallback)
  }
}

export function toastSuccess(message: string) {
  toast.success(message)
}
