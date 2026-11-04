import PQueue from 'p-queue'

export type CheckOptions = {
  concurrency: number
  perHost: number
  retries: number
  waitBudget: number
}

export function checkOptions(env = process.env): CheckOptions {
  function integer(name: string, fallback: number, minimum: number) {
    const value = env[name]
    if (value === undefined) {
      return fallback
    }
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) < minimum
    ) {
      throw new Error(`Invalid ${name}: ${value}`)
    }
    return Number(value)
  }
  return {
    concurrency: integer('LISTS_MANAGE_FIX_CONCURRENCY', 20, 1),
    perHost: integer('LISTS_MANAGE_FIX_PER_HOST', 5, 1),
    retries: integer('LISTS_MANAGE_FIX_RETRIES', 3, 0),
    waitBudget:
      env.LISTS_MANAGE_FIX_WAIT_MS === 'unlimited'
        ? Infinity
        : integer('LISTS_MANAGE_FIX_WAIT_MS', 900_000, 0),
  }
}

type Job = {
  run: () => Promise<Response>
  resolve: (value: Response) => void
  reject: (error: unknown) => void
}
type Host = {
  jobs: Job[]
  active: number
  until: number
  started: number
  waited: number
  throttles: number
  exhausted: boolean
  timer?: ReturnType<typeof setTimeout>
}

function retryAfter(headers: Headers, now: number): number | undefined {
  const raw = headers.get('retry-after')
  if (raw === null) {
    return undefined
  }
  const value = /^\d+(\.\d+)?$/.test(raw.trim())
    ? now + Number(raw) * 1000
    : Date.parse(raw)
  return validDeadline(value) ? value : undefined
}

function validDeadline(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= 8.64e15
}

// Retry-After and reset headers can disagree. Never retry before either deadline.
export function retryDeadline(
  headers: Headers,
  now: number
): number | undefined {
  const deadlines: number[] = []
  const retry = retryAfter(headers, now)
  if (retry !== undefined) {
    deadlines.push(retry)
  }
  for (const name of ['x-ratelimit-reset', 'ratelimit-reset']) {
    const raw = headers.get(name)
    if (raw !== null && /^\d+(\.\d+)?$/.test(raw.trim())) {
      const seconds = Number(raw)
      // shortcut: delays >= 1e9 seconds look like epochs; revisit for multi-decade waits.
      const value =
        seconds >= 1_000_000_000 ? seconds * 1000 : now + seconds * 1000
      if (validDeadline(value)) {
        deadlines.push(value)
      }
    }
  }
  return deadlines.length ? Math.max(now, ...deadlines) : undefined
}

export function isThrottled(response: Response): boolean {
  return (
    response.status === 429 ||
    (response.status === 403 &&
      (retryAfter(response.headers, Date.now()) !== undefined ||
        ['x-ratelimit-remaining', 'ratelimit-remaining'].some(
          (name) => response.headers.get(name)?.trim() === '0'
        )))
  )
}

export class SchedulingError extends Error {}

export class RequestScheduler {
  private queue: PQueue
  private hosts = new Map<string, Host>()
  private stopped: unknown
  private cursor = 0
  private dispatchPending = false

  readonly options: CheckOptions
  private report: (message: string) => void

  constructor(
    options = checkOptions(),
    report = (message: string) => console.warn(message)
  ) {
    this.options = options
    this.report = report
    this.queue = new PQueue({ concurrency: options.concurrency })
  }

  stop(error: unknown) {
    this.stopped = new SchedulingError('Scheduling stopped', { cause: error })
    for (const host of this.hosts.values()) {
      clearTimeout(host.timer)
      for (const job of host.jobs.splice(0)) {
        job.reject(this.stopped)
      }
    }
  }

  request(url: string): Promise<Response> {
    if (this.stopped) {
      return Promise.reject(this.stopped)
    }
    // URL.host normalizes case and default ports. Schemes share a host cooldown.
    const key = new URL(url).host.toLowerCase()
    let host = this.hosts.get(key)
    if (!host) {
      host = {
        jobs: [],
        active: 0,
        until: 0,
        started: 0,
        waited: 0,
        throttles: 0,
        exhausted: false,
      }
      this.hosts.set(key, host)
    }
    const state = host
    return new Promise((resolve, reject) => {
      state.jobs.push({
        resolve,
        reject,
        run: async () => {
          const controller = new AbortController()
          const timer = setTimeout(
            () =>
              controller.abort(
                new Error('HTTP attempt timed out after 30 seconds')
              ),
            30_000
          )
          try {
            const response = await fetch(url, {
              method: 'HEAD',
              redirect: 'manual',
              signal: controller.signal,
            })
            if (isThrottled(response)) {
              this.cooldown(key, state, response)
            }
            // HEAD has no body, but release a nonconforming server's body too.
            await response.body?.cancel()
            return response
          } finally {
            clearTimeout(timer)
          }
        },
      })
      this.dispatchSoon()
    })
  }

  private cooldown(key: string, host: Host, response: Response) {
    if (this.stopped || host.exhausted) {
      return
    }
    const now = Date.now()
    const supplied = retryDeadline(response.headers, now)
    const deadline =
      supplied !== undefined && supplied > now
        ? supplied
        : now + Math.min(60_000, 1000 * 2 ** Math.min(host.throttles, 6))
    host.throttles++
    if (!host.timer) {
      host.started = now
    }
    host.until = Math.max(host.until, deadline, now + 1)
    const budgetEnd = host.started + this.options.waitBudget - host.waited
    const wake = Math.min(host.until, budgetEnd)
    clearTimeout(host.timer)
    this.report(
      `${key}: HTTP ${response.status} rate limit; retry at ${new Date(host.until).toISOString()}`
    )
    const resume = () => {
      const remaining = wake - Date.now()
      if (remaining > 0) {
        host.timer = setTimeout(resume, Math.min(remaining, 2_147_483_647))
        return
      }
      host.timer = undefined
      host.waited += Date.now() - host.started
      host.exhausted =
        host.until > budgetEnd || host.waited >= this.options.waitBudget
      host.until = 0
      this.dispatchSoon()
    }
    host.timer = setTimeout(
      resume,
      Math.max(0, Math.min(wake - now, 2_147_483_647))
    )
  }

  private dispatchSoon() {
    if (this.dispatchPending) {
      return
    }
    this.dispatchPending = true
    queueMicrotask(() => {
      this.dispatchPending = false
      this.dispatch()
    })
  }

  private dispatch() {
    if (this.stopped) {
      return
    }
    const hosts = [...this.hosts.values()]
    for (const host of hosts) {
      if (host.exhausted) {
        for (const job of host.jobs.splice(0)) {
          job.reject(
            new SchedulingError('Host rate-limit waiting budget exhausted')
          )
        }
      }
    }
    let misses = 0
    while (
      hosts.length &&
      this.queue.pending + this.queue.size < this.options.concurrency &&
      misses < hosts.length
    ) {
      const host = hosts[this.cursor++ % hosts.length]
      if (
        host.timer ||
        host.exhausted ||
        host.active >= this.options.perHost ||
        !host.jobs.length
      ) {
        misses++
        continue
      }
      misses = 0
      const job = host.jobs.shift() as Job
      host.active++
      // Only ready requests enter p-queue; no host can accumulate a global backlog.
      void this.queue
        .add(job.run)
        .then(job.resolve, job.reject)
        .finally(() => {
          host.active--
          this.dispatchSoon()
        })
    }
  }
}
