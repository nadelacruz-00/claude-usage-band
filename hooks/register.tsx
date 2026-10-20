import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'usage-band', key: 'limits' } as const, [] as Limit[])
const context = atom({ plugin: 'usage-band', key: 'context' } as const, null as number | null)

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: 'wk',
  spend_limit: 'spend',
}
const PLACEHOLDER_KINDS = ['five_hour', 'seven_day']
const STORE_KEY = 'limits'

// Plan limits are account-wide, so the last reading from any session stands in
// until this one gets its own; a window whose reset has passed starts over at 0.
const restore = (saved: unknown, nowMs: number): Limit[] =>
  (Array.isArray(saved) ? (saved as Limit[]) : []).map(limit =>
    limit.resetsAt && Date.parse(limit.resetsAt) <= nowMs
      ? { kind: limit.kind, percentUsed: 0 }
      : limit,
  )

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    const current =
      usage.rateLimits.length > 0
        ? usage.rateLimits
        : restore(await $.store.get(STORE_KEY), await $.clock.now())
    await update($, limits, () => current)
    await update($, context, () => usage.context.percent ?? null)
    return result
  })

  // Pushed after each turn and whenever a rate-limit window moves a point.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits') && e.rateLimits.length > 0) {
      await update($, limits, () => e.rateLimits)
      await $.store.set(STORE_KEY, e.rateLimits)
    }
    if (e.changed.includes('context')) {
      await update($, context, () => e.context.percent ?? null)
    }
    return next(e)
  })

  // Keep the engine's hint line (and its auto mode pill) and add the usage, dim, at its end.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const contextPercent = await read($, context)
    const current = await read($, limits)
    const shown =
      current.length > 0
        ? current.map(limit => `${LABELS[limit.kind] ?? limit.kind} ${Math.round(limit.percentUsed)}%`)
        : PLACEHOLDER_KINDS.map(kind => `${LABELS[kind]} –%`)
    const parts = [contextPercent === null ? 'ctx –%' : `ctx ${Math.round(contextPercent)}%`, ...shown]

    return next({ ...e, props: { ...e.props, tail: `  ${parts.join(' · ')}` } })
  })
}
