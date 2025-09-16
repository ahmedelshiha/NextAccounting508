'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface ServiceSummary { id: string; name: string; slug: string; category?: string | null }
interface Comment { id: string; content: string; createdAt: string; author?: { id: string; name?: string | null } | null }
interface ServiceRequest {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  service: ServiceSummary
  attachments?: any
  comments?: Comment[]
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function PortalServiceRequestDetailPage() {
  const { data: session } = useSession()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [reqData, setReqData] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const id = params?.id

  const load = async () => {
    try {
      if (!id) return
      setLoading(true)
      const res = await apiFetch(`/api/portal/service-requests/${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setReqData(json.data)
    } catch (e) {
      toast.error('Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id])

  const submitComment = async () => {
    if (!comment.trim()) return
    try {
      const res = await apiFetch(`/api/portal/service-requests/${encodeURIComponent(id!)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment })
      })
      if (!res.ok) throw new Error('Failed')
      setComment('')
      await load()
    } catch (e) {
      toast.error('Failed to post comment')
    }
  }

  const cancelRequest = async () => {
    if (!id) return
    if (!confirm('Are you sure you want to cancel this request?')) return
    try {
      const res = await apiFetch(`/api/portal/service-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Unable to cancel')
        return
      }
      toast.success('Request cancelled')
      router.refresh()
      await load()
    } catch (e) {
      toast.error('Unable to cancel')
    }
  }

  const approveRequest = async () => {
    if (!id) return
    try {
      const res = await apiFetch(`/api/portal/service-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Unable to approve')
        return
      }
      toast.success('Request approved')
      router.refresh()
      await load()
    } catch (e) {
      toast.error('Unable to approve')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Request</h1>
            <p className="text-gray-600">View details and discussion</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/portal/service-requests">Back</Link>
            </Button>
            {reqData && ['SUBMITTED','IN_REVIEW'].includes(reqData.status) && (
              <Button onClick={approveRequest}>Approve</Button>
            )}
            {reqData && !['COMPLETED','CANCELLED'].includes(reqData.status) && (
              <Button variant="destructive" onClick={cancelRequest}>Cancel</Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-200 animate-pulse rounded-lg h-28" />
            <div className="bg-gray-200 animate-pulse rounded-lg h-40" />
          </div>
        ) : !reqData ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-700">Request not found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{reqData.title}</CardTitle>
                    <CardDescription className="mt-1">{reqData.service?.name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusStyles[reqData.status] || 'bg-gray-100 text-gray-800'}>{reqData.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reqData.description && (
                  <p className="text-gray-800 whitespace-pre-line">{reqData.description}</p>
                )}
                {Array.isArray(reqData.attachments) && reqData.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Attachments</h4>
                    <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200">
                      {reqData.attachments.map((a: any, i: number) => (
                        <li key={`${a.name || 'file'}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="truncate">
                            {(a.name || 'File')} {a.size ? <span className="text-gray-500">({Math.round(a.size/1024)} KB)</span> : null}
                          </span>
                          {a.url ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={a.url} target="_blank" rel="noopener noreferrer">View</a>
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discussion</CardTitle>
                <CardDescription>Ask questions or provide more details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reqData.comments || []).length === 0 ? (
                    <p className="text-sm text-gray-600">No comments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(reqData.comments || []).map((c) => (
                        <div key={c.id} className="bg-gray-50 rounded-md p-3">
                          <div className="text-sm text-gray-700">{c.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {c.author?.name || 'You'} • {new Date(c.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2">
                    <Label htmlFor="comment">Add a comment</Label>
                    <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1" rows={3} />
                    <div className="flex justify-end mt-2">
                      <Button onClick={submitComment} disabled={!comment.trim()}>Post Comment</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
