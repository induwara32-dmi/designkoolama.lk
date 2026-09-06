/**
 * A fixed-window rate-limit tracker shared by every rate-limit guard. A prior audit
 * flagged that each guard kept its own unbounded `Map<string, number[]>` -- entries
 * for an IP that never comes back are never removed, so under sustained traffic from
 * many distinct IPs (e.g. a public form getting hit by bots) the map grows forever.
 * This adds two independent bounds: a periodic sweep that drops any key whose entire
 * window has expired, and a hard cap that evicts the oldest key if the map somehow
 * grows past it between sweeps.
 *
 * Serverless caveat: this Map lives in one function instance's memory. A guard built
 * on it (login, submission, media-upload) correctly rate-limits repeated requests
 * that land on the SAME warm Vercel instance, but Vercel can and does run several
 * instances concurrently under load, each with its own empty Map -- so the effective
 * limit becomes (configured limit) x (however many instances happen to be warm),
 * not a hard global ceiling. For this app's expected traffic that's an acceptable
 * trade-off (it still stops a single abusive client hammering one warm instance, and
 * a cold start clears any instance's state anyway). If it ever needs to be a real
 * global limit regardless of instance count, this needs a shared store instead --
 * e.g. Upstash Redis (has a Vercel-friendly free tier) or a Postgres table -- not a
 * bigger in-memory structure, since no amount of in-process bookkeeping fixes memory
 * not being shared across instances.
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
