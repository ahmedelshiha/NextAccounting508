declare module 'pg' {
  export interface ClientConfig {
    connectionString?: string
    [key: string]: any
  }

  export class Client {
    constructor(config?: ClientConfig)
    connect(): Promise<void>
    end(): Promise<void>
    on(event: string, listener: (...args: any[]) => void): this
    query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>
  }

  export class Pool {
    constructor(config?: ClientConfig)
    query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>
    end(): Promise<void>
  }
}
