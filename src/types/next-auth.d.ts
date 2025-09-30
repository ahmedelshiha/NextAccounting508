declare module 'next-auth' {
  export function getServerSession(...args: any[]): Promise<any>
}

declare module 'next-auth/next' {
  export function getServerSession(...args: any[]): Promise<any>
}
