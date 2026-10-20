# usage-band

A Claude Code plugin that adds your context window fill and plan usage limits, as small percentages, to the end of the hint line under the text input:

```
⏵⏵ auto mode on (shift+tab to cycle)  ctx 34% · 5h 42% · wk 12%
```

- `ctx`: how full the current conversation's context window is, as `/context` reports it.
- `5h` and `wk`: the 5-hour session and weekly limits, as `/usage` reports them.
- Updates live after each response. Claude Code's own hint line, including the auto mode indicator, is left as it is.
- In a new conversation, `5h` and `wk` start from the last reading of any earlier session (they are account-wide) and `ctx` shows `–%` until the first response.

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
