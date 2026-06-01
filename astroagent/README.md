# ✦ AstroAgent — Aradhana

> A full-stack agentic AI astrologer. Computes real birth charts from Swiss Ephemeris, reasons over live planetary data with LangGraph, and answers your questions with warmth and care.

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              LangGraph Agent                 │
                    │                                             │
  User Input ──► [router_node]                                    │
                    │                                             │
          ┌─────────┴──────────┐                                  │
          ▼                    ▼                                  │
    [guardrail_node]     [reason_node] ◄──────────────────┐       │
    (off-topic /         (LLM with tools bound)           │       │
     sensitive)               │                           │       │
          │            tool_calls?                        │       │
          │           /         \                         │       │
          ▼          ▼           ▼                        │       │
        [END]    [tool_node]   [END]                      │       │
                     │                                    │       │
                     └────────────────────────────────────┘       │
                    (observe output, loop back to reason)          │
                    └─────────────────────────────────────────────┘

Tools:
  geocode_place()       → geopy + timezonefinder
  compute_birth_chart() → pyswisseph (Swiss Ephemeris — real positions!)
  get_daily_transits()  → pyswisseph + aspect detection
  knowledge_lookup()    → ChromaDB RAG over curated astrology notes
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Anthropic or OpenAI API key

### 1. Clone & configure

```bash
git clone <repo-url>
cd astroagent
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your API key

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Build the knowledge base (one-time)
python -m rag.vectorstore

# Start the server
uvicorn api.main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Running Evals

```bash
cd backend
source venv/bin/activate
python eval/run_evals.py
```

This will:
- Load 25 golden-set cases from `eval/golden_set.jsonl`
- Run each through the full agent graph
- Print a scorecard table (deterministic + LLM-judge scores)
- Append results to `eval/scorecard_history.csv`
- Save full results JSON to `eval/latest_results.json`

---

## Project Structure

```
astroagent/
├── backend/
│   ├── agent/
│   │   ├── state.py          # AstroState TypedDict
│   │   ├── tools.py          # 4 tools (geocode, chart, transits, RAG)
│   │   ├── nodes.py          # LangGraph nodes + routing logic
│   │   └── graph.py          # Compiled LangGraph graph
│   ├── api/
│   │   └── main.py           # FastAPI + SSE streaming endpoint
│   ├── rag/
│   │   ├── notes/            # Astrology reference .txt files
│   │   └── vectorstore.py    # ChromaDB setup + query
│   ├── eval/
│   │   ├── golden_set.jsonl  # 25 versioned test cases
│   │   ├── run_evals.py      # One-command eval harness
│   │   └── scorecard_history.csv  (generated on first run)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── StarField.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── BirthDetailsForm.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── ChatInput.jsx
    │   │   └── ToolActivityPanel.jsx
    │   ├── hooks/
    │   │   └── useChat.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── index.css
    └── package.json
```

---

## LLM Provider

Set `LLM_PROVIDER=anthropic` (uses `claude-sonnet-4-20250514`) or `LLM_PROVIDER=openai` (uses `gpt-4o`) in your `.env`.

The eval judge uses `claude-haiku-4-5-20251001` for cost efficiency.

---

## Known Limitations

- Sessions are stored in memory — restarts lose conversation history. Add Redis or SQLite for persistence.
- Birth chart computations use Moshier ephemeris (built into pyswisseph); for maximum accuracy, download Swiss Ephemeris data files and set `swe.set_ephe_path('/path/to/ephe')`.
- The eval harness estimates token counts by word count; for exact costs, integrate the Anthropic token counting API.
- `get_daily_transits` requires a pre-computed natal chart in state; if the user asks for daily transits without providing birth details, the agent will ask for them first.

---

## Evaluation Summary

See `eval/EVALUATION.md` for a full reflection on what the eval revealed.

---

## Guardrails

The agent will never:
- Present readings as medical, legal, or financial advice
- Follow prompt injection attempts that try to override its persona
- Predict death or specific future events with certainty
- Give specific investment, medication, or legal recommendations

These behaviors are tested in `golden_set.jsonl` cases EV011–EV025.
