# Drift — Architecture

## System

```text
             ┌──────────────────┐
             │    Polymarket    │
             └────────┬─────────┘
                      │
                      ▼
               Market Pulse
                      │
                      │
┌──────────────────┐  │  ┌──────────────────┐
│ Grok X/Web Search│──┼──│ Netflix Top 10   │
└────────┬─────────┘  │  └────────┬─────────┘
         ▼            │           ▼
   Evidence Scout     │     Truth & History
         │            │           │
         └────────────┼───────────┘
                      ▼
               Grok Correlator
                      │
                      ▼
          Divergence + Explanation
                      │
                      ▼
                  Frontend
```

> **Contract note:** the per-component JSON below predates the multi-outcome fix and still uses `yes_price`/`no_price`. The live contract is in [AGENTS.md](../../AGENTS.md). Build against that; read this for the component split only.

## Component Responsibilities

### Market Pulse

Input:
- market/event identifier

Output:
```json
{
  "id": "string",
  "title": "string",
  "yes_price": 0.62,
  "no_price": 0.38,
  "history": [],
  "volume_24h": 0,
  "timestamp": "ISO8601"
}
```

### Evidence Scout

Input:
- market question
- candidate outcome/show
- time window

Output:
```json
{
  "social_score": 86,
  "web_score": 74,
  "trend": "rising",
  "top_sources": [],
  "snippets": [],
  "timestamp": "ISO8601"
}
```

### Truth & History

Input:
- show/title
- week

Output:
```json
{
  "current_rank": 2,
  "previous_rank": 5,
  "history": [],
  "score": 82,
  "source": "netflix_tudum"
}
```

### Grok Correlator

Input:
- Market Pulse output
- Evidence Scout output
- Truth & History output

Output:
```json
{
  "verdict": "diverged",
  "suggested_side": "YES",
  "divergence_score": 78,
  "confidence": 73,
  "explanation": "External evidence is strengthening faster than market pricing.",
  "supporting_reasons": [],
  "counterargument": "",
  "sources": []
}
```

## Integration Rules

1. Each owner must be able to return fixture data using the same contract as real data.
2. UI must work with fixtures before integrations are complete.
3. No silent schema changes.
4. Every agent call should fail gracefully.
5. Historical replay may use a precomputed real-data snapshot for reliability.

## Suggested Repo Layout

```text
drift/
├── README.md
├── CONTEXT.md
├── AGENTS.md
├── PRODUCT_SPEC.md
├── ARCHITECTURE.md
├── DATA_SOURCES.md
├── TEAM_PLAN.md
├── DEMO_SCRIPT.md
├── JUDGING_STRATEGY.md
├── .env.example
│
├── frontend/
│   └── ...
├── backend/
│   └── ...
└── shared/
    ├── types/
    └── fixtures/
        └── demo-market.json
```
