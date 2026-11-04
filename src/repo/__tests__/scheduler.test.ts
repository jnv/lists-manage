import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { checkRepo } from '../index.ts'
import {
  checkOptions,
  isThrottled,
  RequestScheduler,
  retryDeadline,
} from '../scheduler.ts'

const tick = async () => {
  for (let i = 0; i < 4; i++) {
    await setImmediate()
  }
}
const options = { concurrency: 20, perHost: 5, retries: 3, waitBudget: 900_000 }
const response = (status = 200, headers = {}) =>
  new Response(null, { status, headers })
const url = (host: string, i = 0) => `https://${host}/${i}`
const scheduler = (overrides = {}) =>
  new RequestScheduler({ ...options, ...overrides }, () => {})

describe('request scheduling', () => {
  for (const [concurrency, perHost] of [
    [20, 5],
    [1, 1],
    [3, 1],
  ]) {
    it(`limits actual attempts to ${concurrency} globally and ${perHost} per host with a fair backlog`, async (t) => {
      const queue = scheduler({ concurrency, perHost })
      const pending: Array<{ host: string; resolve: (r: Response) => void }> =
        []
      const active = new Map<string, number>()
      const seen: string[] = []
      t.mock.method(globalThis, 'fetch', async (value: string) => {
        const host = new URL(value).host
        seen.push(host)
        active.set(host, (active.get(host) ?? 0) + 1)
        assert.ok((active.get(host) ?? 0) <= perHost)
        assert.ok(
          [...active.values()].reduce((a, b) => a + b, 0) <= concurrency
        )
        const wait = Promise.withResolvers<Response>()
        pending.push({ host, resolve: wait.resolve })
        const result = await wait.promise
        active.set(host, (active.get(host) as number) - 1)
        return result
      })
      const checks = Array.from({ length: 40 }, (_, i) =>
        checkRepo(url('github.com', i), queue)
      )
      checks.push(checkRepo(url('gitlab.com'), queue))
      await tick()
      while (seen.length < 41 || pending.length) {
        const batch = pending.splice(0)
        for (const job of batch) {
          job.resolve(response())
        }
        await tick()
      }
      await Promise.all(checks)
      assert.ok(seen.indexOf('gitlab.com') <= concurrency)
    })
  }

  it('shares and extends cooldowns, releases slots, and schedules redirect destinations through cooldowns', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1_000_000 })
    const queue = scheduler({ concurrency: 2, perHost: 2 })
    const seen: string[] = []
    let github = 0
    const release = Promise.withResolvers<void>()
    t.mock.method(globalThis, 'fetch', async (value: string) => {
      seen.push(value)
      if (new URL(value).host === 'github.com' && github++ < 2) {
        const delay = github === 1 ? '2' : '4'
        await release.promise
        return response(429, { 'retry-after': delay })
      }
      if (new URL(value).host === 'gitlab.com') {
        return response(302, { location: url('github.com', 5) })
      }
      return response()
    })
    const checks = [
      checkRepo(url('github.com'), queue),
      checkRepo(url('github.com', 1), queue),
      checkRepo(url('gitlab.com'), queue),
    ]
    await tick()
    assert.ok(seen.includes(url('gitlab.com')))
    release.resolve()
    await tick()
    assert.equal(github, 2)
    t.mock.timers.tick(2000)
    await tick()
    assert.equal(github, 2)
    t.mock.timers.tick(2000)
    await tick()
    await Promise.all(checks)
    assert.equal(github, 5)
  })

  for (const status of [403, 429]) {
    it(`waits for explicit HTTP ${status} throttling even with no ordinary retries and unlimited waiting`, async (t) => {
      t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
      let calls = 0
      t.mock.method(globalThis, 'fetch', async () =>
        ++calls === 1 ? response(status, { 'retry-after': '1000' }) : response()
      )
      const check = checkRepo(
        url('github.com'),
        scheduler({ retries: 0, waitBudget: Infinity })
      )
      await tick()
      t.mock.timers.tick(999_999)
      await tick()
      assert.equal(calls, 1)
      t.mock.timers.tick(1)
      await tick()
      await check
      assert.equal(calls, 2)
    })
  }

  for (const header of ['x-ratelimit-reset', 'ratelimit-reset']) {
    it(`resumes at an epoch ${header} deadline alongside Retry-After`, async (t) => {
      const now = Date.parse('2026-11-04T12:00:00Z')
      t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now })
      let calls = 0
      t.mock.method(globalThis, 'fetch', async () =>
        ++calls === 1
          ? response(429, {
              'retry-after': '60',
              [header]: String(now / 1000 + 60),
            })
          : response()
      )
      const check = checkRepo(url('gitlab.com'), scheduler({ retries: 0 }))
      await tick()
      t.mock.timers.tick(59_999)
      await tick()
      assert.equal(calls, 1)
      t.mock.timers.tick(1)
      await tick()
      await check
      assert.equal(calls, 2)
    })
  }

  it('does not shorten an existing cooldown when a later response asks for less time', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
    const queue = scheduler({ concurrency: 2, perHost: 2 })
    const first = Promise.withResolvers<Response>()
    const second = Promise.withResolvers<Response>()
    let calls = 0
    t.mock.method(globalThis, 'fetch', async () =>
      ++calls === 1 ? first.promise : calls === 2 ? second.promise : response()
    )
    const checks = Promise.all([
      checkRepo(url('github.com'), queue),
      checkRepo(url('github.com', 1), queue),
    ])
    await tick()
    first.resolve(response(429, { 'retry-after': '4' }))
    await tick()
    t.mock.timers.tick(1000)
    second.resolve(response(429, { 'retry-after': '1' }))
    await tick()
    t.mock.timers.tick(2000)
    await tick()
    assert.equal(calls, 2)
    t.mock.timers.tick(1000)
    await tick()
    await checks
    assert.equal(calls, 4)
  })

  it('uses a separate cumulative host wait budget without counting overlapping cooldowns twice', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
    const queue = scheduler({ waitBudget: 3000 })
    t.mock.method(globalThis, 'fetch', async (value: string) =>
      new URL(value).host === 'github.com'
        ? response(429, { 'retry-after': '2' })
        : response()
    )
    const checks = Promise.allSettled([
      checkRepo(url('github.com'), queue),
      checkRepo(url('github.com', 1), queue),
      checkRepo(url('gitlab.com'), queue),
    ])
    await tick()
    t.mock.timers.tick(2000)
    await tick()
    t.mock.timers.tick(1000)
    await tick()
    const results = await checks
    assert.deepEqual(
      results.map((r) => r.status),
      ['rejected', 'rejected', 'fulfilled']
    )
    assert.match(
      String((results[0] as PromiseRejectedResult).reason),
      /budget exhausted/
    )
  })

  it('uses increasing fallback cooldowns without consuming ordinary retries', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
    let calls = 0
    t.mock.method(globalThis, 'fetch', async () =>
      ++calls < 3 ? response(429) : response()
    )
    const check = checkRepo(url('github.com'), scheduler({ retries: 0 }))
    await tick()
    t.mock.timers.tick(1000)
    await tick()
    assert.equal(calls, 2)
    t.mock.timers.tick(1999)
    await tick()
    assert.equal(calls, 2)
    t.mock.timers.tick(1)
    await tick()
    await check
  })

  for (const status of [0, 408, 500, 502, 503, 504]) {
    it(`allows exactly three retries for ${status || 'network errors'}`, async (t) => {
      t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
      let calls = 0
      t.mock.method(globalThis, 'fetch', async () => {
        calls++
        if (!status) {
          throw new Error('Network error')
        }
        return response(status)
      })
      const check = assert.rejects(checkRepo(url('github.com'), scheduler()))
      await tick()
      for (const delay of [500, 1000, 2000]) {
        t.mock.timers.tick(delay)
        await tick()
      }
      await check
      assert.equal(calls, 4)
    })
  }

  it('aborts the actual HTTP request after 30 seconds', async (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
    let signal: AbortSignal | undefined
    t.mock.method(
      globalThis,
      'fetch',
      (_: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init.signal as AbortSignal
          signal.addEventListener('abort', () => reject(signal?.reason), {
            once: true,
          })
        })
    )
    const check = assert.rejects(
      checkRepo(url('github.com'), scheduler({ retries: 0 })),
      /timed out/
    )
    await tick()
    t.mock.timers.tick(30_000)
    await tick()
    await check
    assert.equal(signal?.aborted, true)
  })

  it('handles unlimited waiting, validated environment settings, and header deadlines', () => {
    assert.deepEqual(checkOptions({}), options)
    assert.equal(
      checkOptions({ LISTS_MANAGE_FIX_WAIT_MS: 'unlimited' }).waitBudget,
      Infinity
    )
    for (const value of ['0', '-1', 'NaN', '1.5', 'Infinity']) {
      assert.throws(() => checkOptions({ LISTS_MANAGE_FIX_CONCURRENCY: value }))
    }
    const now = Date.parse('2026-01-01T00:00:00Z')
    for (const header of ['x-ratelimit-reset', 'ratelimit-reset']) {
      for (const [seconds, deadline] of [
        [5, now + 5000],
        [999_999_999, now + 999_999_999_000],
        [1_000_000_000, now],
        [now / 1000 + 60, now + 60_000],
      ]) {
        assert.equal(
          retryDeadline(new Headers({ [header]: String(seconds) }), now),
          deadline
        )
      }
    }
    assert.equal(
      retryDeadline(
        new Headers({
          'retry-after': '2',
          'x-ratelimit-reset': String(now / 1000 + 5),
        }),
        now
      ),
      now + 5000
    )
    assert.equal(
      retryDeadline(
        new Headers({
          'retry-after': new Date(now + 4000).toUTCString(),
          'ratelimit-reset': '5',
        }),
        now
      ),
      now + 5000
    )
    assert.equal(
      retryDeadline(
        new Headers({ 'retry-after': 'broken', 'x-ratelimit-reset': 'oops' }),
        now
      ),
      undefined
    )
    assert.equal(
      isThrottled(response(403, { 'x-ratelimit-reset': '100' })),
      false
    )
    assert.equal(
      isThrottled(response(403, { 'x-ratelimit-remaining': '0' })),
      true
    )
    assert.equal(isThrottled(response(403, { 'retry-after': '2' })), true)
    assert.equal(isThrottled(response(403)), false)
  })

  it('rejects redirect cycles, malformed locations, and unexpected destination statuses', async (t) => {
    const queue = scheduler({ concurrency: 1, perHost: 1, retries: 0 })
    let calls = 0
    t.mock.method(globalThis, 'fetch', async () => {
      calls++
      return response(301, { location: '/cycle' })
    })
    await assert.rejects(checkRepo(url('github.com'), queue), /Redirect limit/)
    assert.equal(calls, 11)
    for (const location of ['http://[', 'ftp://other.com/a', '']) {
      t.mock.method(globalThis, 'fetch', async () =>
        response(302, { location })
      )
      await assert.rejects(checkRepo(url('github.com'), queue))
    }
    for (const status of [403, 401, 418, 501, 304]) {
      t.mock.method(globalThis, 'fetch', async (value: string) =>
        value === url('github.com')
          ? response(301, { location: url('gitlab.com') })
          : response(status)
      )
      await assert.rejects(
        checkRepo(url('github.com'), queue),
        /Unexpected HTTP/
      )
    }
  })
})
