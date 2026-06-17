import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

interface PersistedShape<T = unknown> {
  v: number;
  e: CacheEntry<T>;
}

export interface InvalidationEvent {
  pattern: string;
  ts: number;
}

const PERSIST_VERSION   = 1;
const STORAGE_PREFIX    = 'sehaty_cache::';
const BROADCAST_CHANNEL = 'sehaty-http-cache';
const SWEEP_INTERVAL_MS = 60_000;
const AUTO_REFRESH_MS   = 10 * 60 * 1000; // 10 minutes

type CrossTabMessage =
  | { type: 'set'; key: string }
  | { type: 'invalidate'; pattern: string }
  | { type: 'clear' };

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly storage = inject(StorageService);
  private readonly mem     = new Map<string, CacheEntry>();
  private channel: BroadcastChannel | null = null;

  private readonly invalidationSignal = signal<InvalidationEvent>({ pattern: '', ts: 0 });
  readonly invalidations = this.invalidationSignal.asReadonly();

  constructor() {
    this.hydrateFromStorage();
    this.initCrossTabSync();
    this.scheduleSweep();
    this.scheduleAutoRefresh();
  }

  // ── public API ──

  get<T>(key: string): T | null {
    const entry = this.mem.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) { this.evict(key); return null; }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = { data, cachedAt: now, expiresAt: now + ttlMs };
    this.mem.set(key, entry as CacheEntry);
    this.persist(key, entry);
    this.broadcast({ type: 'set', key });
  }

  invalidate(pattern: string): void {
    if (!pattern) return;
    for (const key of [...this.mem.keys()]) {
      if (key.includes(pattern)) this.evict(key);
    }
    this.broadcast({ type: 'invalidate', pattern });
    this.invalidationSignal.set({ pattern, ts: Date.now() });
  }

  clear(): void {
    for (const key of [...this.mem.keys()]) this.evict(key);
    this.broadcast({ type: 'clear' });
  }

  // ── internals ──

  private evict(key: string): void {
    this.mem.delete(key);
    this.storage.remove(STORAGE_PREFIX + key);
  }

  private persist<T>(key: string, entry: CacheEntry<T>): void {
    const shape: PersistedShape<T> = { v: PERSIST_VERSION, e: entry };
    this.storage.setJson(STORAGE_PREFIX + key, shape);
  }

  private hydrateFromStorage(): void {
    const prefix = STORAGE_PREFIX;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const raw = localStorage.key(i);
        if (!raw?.startsWith(prefix)) continue;
        const key   = raw.slice(prefix.length);
        const shape = this.storage.getJson<PersistedShape>(raw);
        if (!shape || shape.v !== PERSIST_VERSION) { this.storage.remove(raw); continue; }
        if (Date.now() >= shape.e.expiresAt) { this.storage.remove(raw); continue; }
        this.mem.set(key, shape.e);
      }
    } catch { /* localStorage unavailable — skip hydration */ }
  }

  private initCrossTabSync(): void {
    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL);
      this.channel.onmessage = (ev: MessageEvent<CrossTabMessage>) => {
        const msg = ev.data;
        if (msg.type === 'invalidate') {
          for (const key of [...this.mem.keys()]) {
            if (key.includes(msg.pattern)) this.mem.delete(key);
          }
          this.invalidationSignal.set({ pattern: msg.pattern, ts: Date.now() });
        } else if (msg.type === 'clear') {
          this.mem.clear();
        }
      };
    } catch { /* BroadcastChannel not supported */ }
  }

  private broadcast(msg: CrossTabMessage): void {
    try { this.channel?.postMessage(msg); } catch { /* ignore */ }
  }

  private scheduleSweep(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.mem.entries()) {
        if (now >= entry.expiresAt) this.evict(key);
      }
    }, SWEEP_INTERVAL_MS);
  }

  private scheduleAutoRefresh(): void {
    setInterval(() => {
      this.clear();
    }, AUTO_REFRESH_MS);
  }
}
