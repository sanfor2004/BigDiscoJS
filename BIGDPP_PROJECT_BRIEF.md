# BigDPP project brief

BigDPP is a production-oriented Discord operations bot designed for a real
server of roughly 450 members. Its purpose is to centralize safe server
maintenance, moderation, diagnostics, announcements, logging, and future
administrative automation behind explicit, auditable commands.

## Current foundation

The existing C++20 implementation uses CMake, DPP/D++, nlohmann-json, and an
optional loopback Ollama runtime. It currently provides:

- secure environment-backed configuration with an ignored `.env` fallback
- `/ping` and `/status`
- optional `/ask` access to a local Ollama model in a dedicated AI channel
- additive `/server-setup` for baseline categories, channels, roles, and a
  restricted `mod-log` channel
- explicit owner/Administrator authorization for administrative operations
- server, channel, role, member, bounded message-purge, and audit-log commands
- confirmation gates, role-hierarchy checks, permission checks, and audit
  outcomes for high-impact actions
- offline configuration and administration tests

## Safety posture

The local AI path is prompt-only. It receives the member’s question, not
Discord state, credentials, or server-management tools. Administrative actions
are never delegated to natural-language generation. Mutations require current
authorization and validation immediately before execution, and dangerous
operations require explicit confirmation.

## Delivery status

The Discord foundation is implemented locally but still needs live test-guild
verification. PostgreSQL persistence, durable moderation history, diagnostics,
announcements, event auditing, advanced maintenance, containers, CI, and
production hardening remain roadmap work until separately delivered and tested.

## Source reference

The source project is the local `C:\www\BigDPP` checkout. The reusable
implementation instructions are in [`BIGDPP_PROMPT.md`](BIGDPP_PROMPT.md).
