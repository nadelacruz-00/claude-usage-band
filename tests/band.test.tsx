import { expect, test } from 'claude-code/testing'

const NOW = Date.parse('2026-10-20T12:00:00Z')

const BAND = {
  plugin: 'usage-band',
  component: 'PromptHint',
  surface: 'terminal',
  props: {
    isDraft: false,
    isWorking: false,
    hint: '⏵⏵ auto mode on (shift+tab to cycle)',
  },
} as const

test('the band shows each limit with its reset countdown', async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('clock.now', () => ({ value: NOW }))
  on('clock.every', () => ({ value: undefined }))
  on('session.usage', () => ({
    value: {
      startedAt: NOW,
      context: {},
      rateLimits: [
        { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-20T14:13:00Z' },
        { kind: 'seven_day', percentUsed: 91.5, resetsAt: '2026-10-23T16:00:00Z' },
      ],
    },
  }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(BAND)

  expect((await ui.find({ type: 'Text', text: /^Session$/ }))?.text).toBe('Session')
  expect((await ui.find({ type: 'Text', text: /^42%$/ }))?.text).toBe('42%')
  expect((await ui.find({ type: 'Text', text: /2h 13m/ }))?.text).toBe('resets in 2h 13m')
  expect((await ui.find({ type: 'Text', text: /^92%$/ }))?.text).toBe('92%')
  expect((await ui.find({ type: 'Text', text: /3d 4h/ }))?.text).toBe('resets in 3d 4h')
  expect((await ui.find({ type: 'Text', text: /auto mode/ }))?.text).toBe(BAND.props.hint)
  await ui.unmount()
})

test('before any reading the row says so and keeps the hint', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))

  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Text', text: /no reading yet/ }))?.text).toMatch(/^Usage:/)
  expect((await ui.find({ type: 'Text', text: /auto mode/ }))?.text).toBe(BAND.props.hint)
  await ui.unmount()
})
