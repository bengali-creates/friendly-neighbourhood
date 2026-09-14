import { RateLimitResult, RateLimiterDriver } from "./types";

interface WindowData {
  currentCount: number;
  previousCount: number;
  currentWindowStart: number;
}

export class MemorySlidingWindowDriver implements RateLimiterDriver {
  private store: Map<string, WindowData>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    const globalAny = globalThis as unknown as { rateLimitMemoryStore?: Map<string, WindowData> };
    if (!globalAny.rateLimitMemoryStore) {
      globalAny.rateLimitMemoryStore = new Map<string, WindowData>();
    }
    this.store = globalAny.rateLimitMemoryStore;
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
      if (this.cleanupInterval && typeof this.cleanupInterval.unref === "function") {
        this.cleanupInterval.unref();
      }
    }
  }

  public limit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const currentWindowStart = Math.floor(now / windowMs) * windowMs;
    const nextWindowStart = currentWindowStart + windowMs;

    let data = this.store.get(key);

    if (!data) {
      data = { currentCount: 0, previousCount: 0, currentWindowStart };
      this.store.set(key, data);
    }

    if (now >= data.currentWindowStart + windowMs * 2) {
      data.previousCount = 0;
      data.currentCount = 0;
      data.currentWindowStart = currentWindowStart;
    } else if (now >= data.currentWindowStart + windowMs) {
      data.previousCount = data.currentCount;
      data.currentCount = 0;
      data.currentWindowStart = currentWindowStart;
    }
    const timeIntoCurrentWindow = now - currentWindowStart;
    const previousWindowWeight = Math.max(0, 1 - (timeIntoCurrentWindow / windowMs));
    const estimatedRequests = Math.floor(
      data.previousCount * previousWindowWeight + data.currentCount
    );

    const retryAfter = Math.max(1, Math.ceil((nextWindowStart - now) / 1000));

    if (estimatedRequests >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: nextWindowStart,
        retryAfter,
      };
    }

    data.currentCount += 1;

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - (estimatedRequests + 1)),
      reset: nextWindowStart,
      retryAfter,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now - data.currentWindowStart > 5 * 60 * 1000) {
        this.store.delete(key);
      }
    }
  }
}
