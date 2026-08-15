# Water Cooler — Product Spec

## Problem

Prediction-market traders can see market odds, social chatter, news, and outcome data, but they must mentally connect those signals themselves.

Water Cooler turns that fragmented research process into one explainable signal.

## User

A prediction-market participant who wants to understand whether the market price is aligned with public evidence.

## Job To Be Done

> When I am evaluating a prediction market, show me when market pricing and public evidence disagree, explain why, and let me inspect the sources before I act.

## MVP

### Feature 1 — Market Pulse

Shows:
- market question
- current YES / NO probability
- volume
- historical probability chart

Data:
- Polymarket

### Feature 2 — Evidence Scout

Shows:
- social chatter score
- web evidence score
- trend direction
- representative snippets
- relevant accounts / publishers

Data:
- Grok X Search
- Grok Web Search

### Feature 3 — Truth & History

Shows:
- Netflix ranking momentum
- historical ranking
- official/historical outcome
- replay timeline

Data:
- Netflix Tudum / Netflix Top 10 historical data

### Feature 4 — Grok Divergence Engine

Returns:
- aligned / diverged
- divergence score
- confidence
- YES / NO / WATCH
- explanation
- supporting reasons
- counterargument
- sources

### Feature 5 — Historical Replay

Lets the user view a prior point in time and see:
- what the market priced
- what external evidence indicated
- when Water Cooler would have flagged divergence
- what happened afterward

## Screens

### Signal Feed

Primary CTA: `View Why`

The highest-value card should dominate the page.

### Signal Investigation

Primary elements:
- price history
- divergence score
- Grok explanation
- source evidence
- bull case
- counterargument
- replay

### Add Topic

Hackathon version: modal only.

## Product Language

Use:
- divergence
- evidence gap
- external confirmation
- market/public-signal mismatch

Avoid:
- manipulation
- guaranteed profit
- sure bet
- guaranteed edge

## Definition of Done

A judge can:
1. see a real market
2. see its price history
3. inspect external evidence
4. understand Grok's reasoning
5. see a counterargument
6. replay a historical example
7. explain Water Cooler back in one sentence
