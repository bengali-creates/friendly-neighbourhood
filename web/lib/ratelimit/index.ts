import { RateLimitResult, RateLimiterDriver } from "./types";
import { MemorySlidingWindowDriver } from "./memory-driver";
import { UpstashRedisDriver } from "./redis-driver";

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  prefix?: string;
}

export class RateLimiter {
  private driver: RateLimiterDriver;
  private limitCount: number;
  private windowMs: number;
  private prefix: string;

  constructor(options: RateLimiterOptions) {
    this.limitCount = options.limit;
    this.windowMs = options.windowMs;
    this.prefix = options.prefix || "rl";

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
      this.driver = new UpstashRedisDriver(upstashUrl, upstashToken);
    } else {
      this.driver = new MemorySlidingWindowDriver();
    }
  }

  public async limit(identifier: string): Promise<RateLimitResult> {
    const namespacedKey = `${this.prefix}:${identifier}`;
    return await this.driver.limit(namespacedKey, this.limitCount, this.windowMs);
  }
}

export const authRateLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
  prefix: "auth",
});

export const apiMutationRateLimiter = new RateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
  prefix: "api:mutations",
});

export const publicFeedRateLimiter = new RateLimiter({
  limit: 120,
  windowMs: 60 * 1000,
  prefix: "api:feeds",
});

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    ...(result.success ? {} : { "Retry-After": String(result.retryAfter) }),
  };
}


export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
