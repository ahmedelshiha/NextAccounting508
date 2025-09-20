declare module '@/lib/dev-fallbacks' {
  export function getAllRequests(): any[]
  export function getRequest(id: string): any | undefined
  export function addRequest(id: string, obj: any): void
  export function updateRequest(id: string, patch: any): any | null
  export function getComments(id: string): any[]
  export function addComment(id: string, comment: any): void
}
