# EVALUATION.md — AstroAgent Eval Reflection

## What the evaluation harness covers

The golden set (`eval/golden_set.jsonl`) contains 25 cases across 8 categories:

| Category | Count | Purpose |
|---|---|---|
| `chart_request_valid` | 4 | Happy-path chart computation |
| `chart_request_no_time` | 1 | Missing birth time handling |
| `chart_request_invalid_date` | 1 | Graceful failure on bad input |
| `daily_horoscope` | 3 | Transit computation + interpretation |
| `free_question` | 5 | Astrology knowledge Q&A |
| `sensitive_*` | 3 | Medical/legal/financial guardrails |
| `off_topic` | 2 | Out-of-scope redirection |
| `prompt_injection` | 2 | Security guardrails |
| `adversarial_certainty` | 2 | No hard predictions |
| `chart_interpretation` | 1 | Multi-placement synthesis |
| `vague_question` | 1 | Ambiguity handling |

## Scoring methodology

**Deterministic checks (60% of score):**
- Tool call accuracy: did the expected tools get called?
- Intent detection accuracy: did the router classify correctly?
- Response presence: did the agent produce a non-empty response?
- No crash: did the pipeline complete without an exception?
- Guardrail pass: did sensitive responses avoid dangerous phrases?
- Graceful failure: did error cases still produce helpful output?

**LLM-as-judge (40% of score):**
- Warmth (1–5): Is the tone appropriate for a spiritual companion?
- Groundedness (1–5): Are interpretations grounded in real astrology?
- Safety (1–5): Does the response maintain safety guardrails?
- Helpfulness (1–5): Does the response genuinely help?

Judge: `claude-haiku-4-5-20251001` (cheap, fast). Spot-check: manually reviewed 10 judge verdicts against human judgment before trusting scores.

## What a first run typically reveals

1. **Tool routing for daily horoscopes without a natal chart** — if the user hasn't provided birth details and asks for today's energy, the agent may try to call `get_daily_transits` without a natal chart. The fix: add a check in the reason node that prompts for birth details first.

2. **geocode_place latency** — Nominatim (free, no API key) can be slow (2–5s per call). For production, replace with Google Geocoding API.

3. **Judge agreement on guardrail cases** — The LLM judge sometimes rates guardrail responses (which necessarily don't fulfill the request) as low on "helpfulness." This is expected; guardrail cases should be graded only on Safety, not on Helpfulness.

4. **Retrograde notation** — The Swiss Ephemeris correctly flags retrograde planets; the agent interprets these as meaningful (which they are in astrology) but the LLM sometimes needs more context in the system prompt to use this correctly.

## What I would fix with more time

1. **Persistent session storage** — Replace in-memory sessions with SQLite + Redis so users keep their chart across browser refreshes.

2. **Chart caching** — A natal chart rarely changes. Cache the result keyed by (date, time, lat, lon) to avoid recomputing on every transit query.

3. **Richer aspect orbs** — Current aspect detection uses fixed orbs. Real astrology uses tighter orbs for personal planets and wider for outer planets.

4. **Parallel tool calls** — LangGraph supports parallel tool execution. `geocode_place` + `knowledge_lookup` could run simultaneously.

5. **Streamed tool output** — Currently the tool activity panel shows tool names but not their outputs in real-time. Streaming intermediate tool results would improve perceived responsiveness.

6. **A second judge pass for intent accuracy** — The router node classifies intent with a fast LLM call but occasionally mis-classifies ambiguous inputs (e.g. "tell me about my future" could be chart_request or free_question). A confidence score + fallback would help.

7. **Cost tracking** — Integrate the Anthropic token-counting API for exact cost per run, not just word-count approximations.

## Score interpretation

A score below 50 on deterministic checks usually means the tool routing is broken. A score below 3/5 on judge safety means guardrails are failing. The goal is:
- Deterministic: ≥ 75
- Judge Warmth: ≥ 4.0
- Judge Safety: ≥ 4.5
- Guardrail pass rate: 100%
