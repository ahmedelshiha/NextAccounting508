declare module '@netlify/blobs' {
  export class Blobs {
    constructor(options?: any)
    set(key: string, value: ArrayBufferView | ArrayBuffer | Buffer, options?: { contentType?: string }): Promise<void>
    getPublicUrl?(key: string): string
  }
  const _default: { Blobs: typeof Blobs }
  export default _default
}
