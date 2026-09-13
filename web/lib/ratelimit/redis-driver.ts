import { RateLimitResult, RateLimiterDriver } from "./types";

export class UpstashRedisDriver implements RateLimiterDriver {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
  }

  public async limit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const currentWindowStart = Math.floor(now / windowMs) * windowMs;
    const nextWindowStart = currentWindowStart + windowMs;
    const retryAfter = Math.max(1, Math.ceil((nextWindowStart - now) / 1000));

    const redisKey = `ratelimit:${key}`;

    try {
      const res = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["HGET", redisKey, "curr"],
          ["HGET", redisKey, "prev"],
          ["HGET", redisKey, "start"],
        ]),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Upstash HTTP Error: ${res.statusText}`);
      }

      const [currRes, prevRes, startRes] = await res.json();
      let currentCount = currRes?.result ? parseInt(currRes.result, 10) : 0;
      let previousCount = prevRes?.result ? parseInt(prevRes.result, 10) : 0;
      const windowStart = startRes?.result ? parseInt(startRes.result, 10) : currentWindowStart;

      if (now >= windowStart + windowMs * 2) {
        currentCount = 0;
        previousCount = 0;
      } else if (now >= windowStart + windowMs) {
        previousCount = currentCount;
        currentCount = 0;
      }

      const timeIntoCurrentWindow = now - currentWindowStart;
      const previousWindowWeight = Math.max(0, 1 - (timeIntoCurrentWindow / windowMs));
      const estimatedRequests = Math.floor(
        previousCount * previousWindowWeight + currentCount
      );

      if (estimatedRequests >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: nextWindowStart,
          retryAfter,
        };
      }

      const ttlSeconds = Math.ceil((windowMs * 2) / 1000);
      await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["HSET", redisKey, "curr", String(currentCount + 1), "prev", String(previousCount), "start", String(currentWindowStart)],
          ["EXPIRE", redisKey, ttlSeconds],
        ]),
      });

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - (estimatedRequests + 1)),
        reset: nextWindowStart,
        retryAfter,
      };
    } catch (err) {
      console.error("[RateLimiter Redis Error, failing open]:", err);
      return {
        success: true,
        limit,
        remaining: 1,
        reset: nextWindowStart,
        retryAfter,
      };
    }
  }
}
