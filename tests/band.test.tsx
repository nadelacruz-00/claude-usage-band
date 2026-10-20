import { expect, test } from 'claude-code/testing'

const HINT = {
  plugin: 'usage-band',
  component: 'PromptHint',
  surface: 'terminal',
  props: {
    isDraft: false,
    isWorking: false,
    hint: '⏵⏵ auto mode on (shift+tab to cycle)',
  },
} as const

test('the hint line ends with context and limit percentages', async ($, on) => {
  // Stands for the engine: draws the hint line with whatever tail it was handed.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    const props = e.props as { hint: string; tail?: string }
    return <Text>{`${props.hint}${props.tail ?? ''}`}</Text>
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200000, tokens: 68000, percent: 34 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-20T14:13:00Z' },
        { kind: 'seven_day', percentUsed: 91.5, resetsAt: '2026-10-23T16:00:00Z' },
      ],
    },
  }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(HINT)

  expect((await ui.find({ type: 'Text', text: /auto mode/ }))?.text).toBe(
    '⏵⏵ auto mode on (shift+tab to cycle)  ctx 34% · 5h 42% · wk 92%',
  )
  await ui.unmount()
})

test('before any reading the hint line is left as it is', async ($, on) => {
  // Stands for the engine: draws the hint line with whatever tail it was handed.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    const props = e.props as { hint: string; tail?: string }
    return <Text>{`${props.hint}${props.tail ?? ''}`}</Text>
  })

  const ui = await $.ui.mount(HINT)
  expect((await ui.find({ type: 'Text', text: /auto mode/ }))?.text).toBe(HINT.props.hint)
  await ui.unmount()
})
