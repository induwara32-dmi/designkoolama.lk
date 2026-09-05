/**
 * A fixed-window rate-limit tracker shared by every rate-limit guard. A prior audit
 * flagged that each guard kept its own unbounded `Map<string, number[]>` -- entries
 * for an IP that never comes back are never removed, so under sustained traffic from
 * many distinct IPs (e.g. a public form getting hit by bots) the map grows forever.
 * This adds two independent bounds: a periodic sweep that drops any key whose entire
 * window has expired, and a hard cap that evicts the oldest key if the map somehow
 * grows past it between sweeps.
 */
export class RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private lastSweepAt = Date.now();

  constructor(
    private readonly windowMs: number,
    private readonly maxTrackedKeys = 5000,
  ) {}

  private sweep(now: number) {
    if (now - this.lastSweepAt < this.windowMs) return;
    this.lastSweepAt = now;
    for (const [key, times] of this.hits) {
      const recent = times.filter((time) => now - time < this.windowMs);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }

  /** Records a hit for `key` and returns whether it has exceeded `limit` within the window. */
  isLimited(key: string, limit: number): boolean {
    const now = Date.now();
    this.sweep(now);
    const recent = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
    if (recent.length >= limit) {
      this.hits.set(key, recent);
      return true;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxTrackedKeys) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey !== undefined) this.hits.delete(oldestKey);
    }
    return false;
  }
}
