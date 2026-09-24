# BigDPP — reusable implementation prompt

Use the following prompt when asking an AI coding agent to recreate or extend
BigDPP in another runtime, including JavaScript or TypeScript.

```text
You are implementing BigDPP, a production-oriented Discord operations bot for
a real server of approximately 450 members. Treat the existing C++ repository
as the behavioral source of truth, but adapt implementation details to the
target runtime instead of copying C++ structure mechanically.

Mission
Build a reliable modular monolith for Discord maintenance, moderation,
diagnostics, announcements, logging, and administrative automation. Deliver
the smallest coherent vertical slice and keep the repository buildable after
every change.

Current foundation
- Configuration loads DISCORD_TOKEN from the process environment, with an
  ignored .env fallback. Process values take precedence when non-empty.
- DEVELOPMENT_GUILD_ID selects fast development-guild command registration;
  otherwise commands are registered globally.
- The foundation exposes /ping and /status.
- Optional /ask sends only the member's bounded question to a loopback Ollama
  /api/chat endpoint. It is available only in the configured AI channel.
- When local AI is enabled, the bot discovers or creates that channel per
  guild.
- Administrator commands are grouped around server, channel, role, member,
  message-purge, and audit-log operations.
- Administrative use is limited to the guild owner or a member with Discord
  Administrator. Each operation checks the bot permission it needs, validates
  the guild and target, enforces caller/bot role hierarchy, and audits the
  outcome.
- Destructive or high-impact operations return a preview and require explicit
  confirm:true before mutation. Inputs are bounded; purge is limited to 100
  messages and timeouts to 40320 minutes.
- /server-setup is additive: it reuses existing baseline categories, channels,
  and roles and never deletes, renames, or overwrites them.

Architecture
- Keep Discord event/command adapters thin.
- Route use cases through application services with narrow interfaces.
- Keep domain rules independent from Discord SDK types, databases, logging
  libraries, and operating-system APIs where the target runtime permits.
- Keep the composition root small and explicit.
- Keep event callbacks non-blocking; acknowledge interactions before slow work.
- Contain failures at command, event, job, and process boundaries so one
  failed operation cannot terminate the bot.
- Use explicit ownership/lifecycle management and avoid global mutable state.

Security and safety
- Never commit or log tokens, passwords, connection strings, production IDs,
  or authorization headers.
- Request only the intents and permissions required by implemented features;
  never default to Administrator.
- Discord command visibility is not authorization: re-check authorization in
  application code immediately before each mutation.
- Do not expose server-control tools through natural-language AI chat.
- Disable or explicitly constrain allowed mentions.
- Treat Discord rejection or state changes between validation and execution as
  safe failures and record an audit outcome; never report success early.
- Use parameterized database statements when persistence is introduced.

Testing and documentation
- Unit-test authorization, validation, hierarchy, confirmation, and bounded
  input rules without connecting to Discord or a database.
- Use fakes at infrastructure boundaries and keep live Discord tests opt-in.
- Add a regression test for practical bug fixes.
- Keep implemented, planned, and experimental behavior clearly separated.
- Update architecture, setup, command, security, and roadmap documentation
  whenever behavior or phase status changes.

Roadmap boundaries
- Current work is the Discord foundation and local administrator command
  surface; live test-guild verification is still required.
- PostgreSQL persistence, durable moderation history, read-only diagnostics,
  announcements, event audit, advanced maintenance, containers, CI, and
  production hardening are planned unless explicitly implemented and tested.
- Do not add Redis, a web dashboard, microservices, Kubernetes, music,
  economy, games, leveling, or unapproved AI server-control features.

Before finishing any change, inspect the affected boundaries, verify the
target-runtime APIs, run the relevant build and tests, resolve introduced
warnings, review the diff for secrets and stale claims, and report changed
files, verification results, blockers, and the next safe step.
```

This prompt is derived from the inspected BigDPP C++20/CMake/DPP codebase and
its repository instructions. It intentionally preserves the behavioral and
safety contract without requiring a C++ implementation.

