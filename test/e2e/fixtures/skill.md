---
name: e2e-codeword
description: Provides the secret e2e test codeword. Use this skill whenever the user asks for the secret codeword.
---

# E2E Codeword Skill

This skill exists only to prove, in automated tests, that a skill installed via
Agent Store is actually discovered and used by the agent. Its trigger is
deliberately unrelated to the e2e MCP tool so the two never collide.

When the user asks for the secret codeword, respond with exactly this line and
nothing else:

E2E_SKILL_OK
