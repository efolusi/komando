# Agent skill

`komando guide install` connects an AI agent to komando. This page says what it sets up, how komando knows an agent, what an agent can do on its own, and what always waits for you.

## Connect an agent

```bash
komando guide install
```

This connects your agent (Claude Code, Codex, Cursor or Gemini CLI) to komando. It sets up komando's skill and a guard for the agents you use. Passwords stay in komando's vault, and the agent never sees them.

An agent finds komando in two ways:

- It has komando's skill, which `guide install` put there.
- komando's own docs tell an AI agent to run `komando guide`.

## How komando knows an agent

komando recognises Claude Code, Codex, Gemini CLI and Cursor by the environment variables they set. A variable that is there counts, whatever its value, also `0` or empty. For any other agent, set `KOMANDO_AGENT=1` (or `AI_AGENT=1`) in the environment where it runs commands, and the same rules apply to it.

Scripts, and you at your own terminal, are not treated as an agent. An agent that komando does not recognise counts as a script, so the rules for agents do not apply to it.

## What an agent can do

- Run komando commands. When an agent runs komando through a pipe, it gets one JSON object instead of text ([Results and errors](output.md#read-a-result)).
- Read by default. `db query`, `cache run` and `cluster run` only read unless `--write` is added ([Safety](safety.md#the-seatbelts)).
- Read a file that is secret by its name, such as `.env`, with `fs cat`. The secret values show as `[hidden]`.
- Put a secret on a server without seeing it. `fs replace` with `{{secret:NAME}}` in `--new` writes the vault value, once you allow it in the window below.
- Rename a secret with `secret rename`, without seeing it. Every reference follows.

## What always asks you first

When an agent adds `--yes`, `--allow-dangerous` or `--reveal`, komando opens a window on your screen. It shows the whole command and why komando stopped it. The command runs only when you click **Allow once**, and the agent cannot click it.

- With `komando config approval-code`, the window also asks for a code from your authenticator app, so a click alone is not enough ([Settings](settings.md#ask-for-a-code-before-an-agents-risky-command)).
- With no screen to open the window on (an SSH session, a server, or `KOMANDO_NO_DIALOG` set), the agent is refused and asks you to run the command in your own terminal.
- A window nobody answers closes. The agent is told that nobody answered, and asks you whether to try again.
- When an agent sends a secret to a new place, it needs `--yes`, and the window names the secret and the place.

Some commands only a person runs, at their own terminal: `secret set` and `secret check` for an agent, `secret keychain`, `secret passphrase`, setting up `config approval-code`, and replacing a pinned host key with `host trust --reset`. The agent gets `NEEDS_PERSON` and asks you to run it.

More in [Safety](safety.md#seatbelts-for-ai-agents).

## What an agent never sees

- Passwords, keys and tokens in any output show as `[hidden]`. You and your scripts see the real values.
- `secret show --reveal` is for a person. An AI agent never can.
- An agent cannot copy a file that is secret by its name (`.env`, private keys, `credentials`) to this computer.
- When a command takes a local file, komando does not read `~/.komando`, private keys, credential stores or files that are secret by name for an agent.

## The guard

The guard checks what an agent is about to do on this computer. Before the agent reads a file or runs a shell command, komando checks it, and stops:

- reading `~/.komando`, private keys, `.env` files and credential stores (`~/.kube`, `~/.aws`, the keychain);
- listing all environment variables;
- changing or clearing the variables komando knows an agent by, or `KOMANDO_HOME`;
- running `ssh` or `scp` around komando.

`komando guide install --no-guard` skips it. The guard runs only where the agent's harness asks for it. `guide install` sets it up for Claude Code, Cursor, Gemini CLI and Codex (approve it once in `/hooks`). An agent without hooks gets only the approval window and the masking, and only when komando recognises it.

## Update or remove

After `komando update`, run `komando guide install` again, without `sudo`, so your agents get the skill of the new version. Until then, `komando doctor` says the skill is from another version ([Install, update, remove](install.md#update)).

To take the skill and the guard out of your agents, run `komando guide uninstall`. Add `--project` in a folder where you ran `guide install --project` ([Install, update, remove](install.md#remove-komando)). An AI agent that runs `guide uninstall` needs `--yes`, because it takes the guard out of the agent's settings.
