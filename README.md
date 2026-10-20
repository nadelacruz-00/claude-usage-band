# usage-band

A Claude Code plugin that keeps your context window fill and plan usage limits on screen, in a row directly under the text input:

```
Context ███░░░░░░░ 34%   Session ████░░░░░░ 42% resets in 2h 13m   Week █████████░ 92% resets in 3d 4h
⏵⏵ auto mode on (shift+tab to cycle)
```

- Percentages update live as Claude Code receives new usage figures after each response; reset countdowns tick every 30 seconds.
- Bars are green under 70%, yellow from 70%, red from 90%.
- Context is how full the current conversation's context window is, as `/context` reports it.
- Session and Week are the same 5-hour and weekly windows as `/usage`. Before the first response of a session it says "no reading yet".

The row replaces Claude Code's hint line and redraws that line's text, dim, beneath it, so the hint line's own colors are not kept.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install usage-band --marketplace nadelacruz-00/claude-usage-band
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```
claude plugin install usage-band --marketplace nadelacruz-00/claude-usage-band
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `nadelacruz-00/claude-usage-band`, then Add plugin.

## Develop

```
claude --plugin-dir .          # run Claude Code with this folder loaded
claude plugin validate .
claude plugin test .
```
