# Operations

| Field | Purpose | Capture / sufficient when |
|---|---|---|
| `memory_enabled` | Decide whether to retain editorial learnings across ideas | Explicit yes/no. Evidence-based recommendations are advisory; enabling memory does not authorize changing the editorial profile. |
| `startup_status` | Decide whether the guide should report outstanding work at startup | Explicit yes/no. On-demand status remains separate; no background job implied. |
| `tools` | Reuse available capabilities without imposing providers | Existing media/rendering or publication tools (e.g. n8n), intended purpose, whether available or actually configured. Availability does not imply authorization to run, publish, or incur costs. Store a narrative string, never credentials or webhook secrets. |
| `memory_support_threshold`, `memory_contrary_threshold` | Configure promotion and reconsideration of editorial findings | Discuss only if memory is enabled. Offer CLI defaults; overrides are positive integers counting distinct eligible posts, not repeated captures or proof of causality. |

Local tracking is standard. Manual publishing is the default. Existing integrations are optional and need explicit configuration and permission before use. The current setup stores preferences only; it does not provision integrations, publish, or start a monitor or memory service.
