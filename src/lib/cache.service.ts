export class CacheService {
  async get<T>(_key: string): Promise<T | null> { return null; }
  async set(_key: string, _value: any, _ttl?: number): Promise<void> { /* no-op */ }
  async delete(_key: string): Promise<void> { /* no-op */ }
  async deletePattern(_pattern: string): Promise<void> { /* no-op */ }
}
