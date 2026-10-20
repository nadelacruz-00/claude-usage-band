import { atom, read, update } from 'claude-code'
import type { Color, Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'usage-band', key: 'limits' } as const, [] as Limit[])
const now = atom({ plugin: 'usage-band', key: 'now' } as const, 0)

const LABELS: Record<string, string> = {
  five_hour: 'Session',
  seven_day: 'Week',
  spend_limit: 'Spend',
}
const BAR_CELLS = 10
const TICK_MS = 30_000

const bar = (percent: number) => {
  const filled = Math.min(BAR_CELLS, Math.round((percent / 100) * BAR_CELLS))
  return '█'.repeat(filled) + '░'.repeat(BAR_CELLS - filled)
}

const colorFor = (percent: number): Color =>
  percent >= 90 ? 'error' : percent >= 70 ? 'warning' : 'success'

const untilReset = (resetsAt: string | undefined, nowMs: number) => {
  if (!resetsAt) return ''
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - nowMs) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  const left = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return `resets in ${left}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    const ms = await $.clock.now()
    await update($, limits, () => usage.rateLimits)
    await update($, now, () => ms)
    // Countdowns tick between API responses; percentages arrive via session.measure.
    $.clock.every(TICK_MS, () => {
      void $.clock.now().then(ms => update($, now, () => ms))
    })
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, limits, () => e.rateLimits)
    }
    const ms = await $.clock.now()
    await update($, now, () => ms)
    return next(e)
  })

  // The hint line under the input (it carries the auto mode indicator): draw the
  // usage row first, then the engine's hint text beneath it.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const { Box, Text } = $.ui.resolve(e)
    const rows = await read($, limits)
    const nowMs = (await read($, now)) || (await $.clock.now())

    const usage =
      rows.length === 0 ? (
        <Text dimColor>Usage: no reading yet, updates after the next response</Text>
      ) : (
        <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
          {rows.map(limit => (
            <Box key={limit.kind} flexDirection="row" columnGap={1}>
              <Text bold>{LABELS[limit.kind] ?? limit.kind}</Text>
              <Text color={colorFor(limit.percentUsed)}>{bar(limit.percentUsed)}</Text>
              <Text>{`${Math.round(limit.percentUsed)}%`}</Text>
              <Text dimColor>{untilReset(limit.resetsAt, nowMs)}</Text>
            </Box>
          ))}
        </Box>
      )

    return (
      <Box flexDirection="column">
        {usage}
        {e.props.hint ? <Text dimColor>{e.props.hint}</Text> : null}
      </Box>
    )
  })
}
