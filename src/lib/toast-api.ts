import { toast as sonnerToast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'

// Re-export toast for convenience
export const toast = sonnerToast

export async function toastFromResponse(res: Response, opts?: { success?: string; failure?: string }) {
  try {
    if (res.ok) {
      if (opts?.success) sonnerToast.success(opts.success)
      return
    }
    let body: any = null
    try { body = await res.clone().json() } catch {}
    const msg = getApiErrorMessage(body || { error: res.statusText }, opts?.failure || 'Request failed')
    sonnerToast.error(msg)
  } catch {
    sonnerToast.error(opts?.failure || 'Request failed')
  }
}

export function toastError(err: unknown, fallback = 'Something went wrong') {
  try {
    const message = getApiErrorMessage(err as any, fallback)
    sonnerToast.error(message)
  } catch {
    sonnerToast.error(fallback)
  }
}

export function toastSuccess(message: string) {
  sonnerToast.success(message)
}
