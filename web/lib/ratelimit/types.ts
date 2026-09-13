export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

export interface RateLimiterDriver {
  limit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> | RateLimitResult;
}
