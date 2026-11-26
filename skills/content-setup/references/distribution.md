# Distribution

Capture publishing intentions, not assumptions about platform algorithms. Keep distribution preferences separate from current technical platform requirements.

| Field | Purpose | Capture / sufficient when |
|---|---|---|
| `platforms` | Identify intended destinations | At least one selected platform, with account/profile distinction where relevant. Store an array of nonempty destination identifiers; no credentials or login required. |
| `platform_preferences` | Adapt one message to different destinations | Goals, audiences, preferred native formats, media, language or style overrides, disliked formats and account-specific constraints. Associate each preference with its destination. Do not force an identical format across platforms. |
| `locale` | Preserve language and scheduling context | Default writing language, relevant regional preferences and timezone (prefer a named timezone when known). Note platform-specific overrides in platform preferences. |
| `cadence` | Support sustainable planning | Desired rhythm, preferred days/times and whether cadence is fixed or flexible; per-platform or rubric differences where useful. Distinguish author preference from untested performance advice. |

Only platforms are structurally required by the current CLI. The remaining fields may be declined or deferred. Save optional narratives as strings. Do not invent a publishing schedule or current platform limitations; verify actual technical constraints when preparing content.
