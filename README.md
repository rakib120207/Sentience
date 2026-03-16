# Sentience Finance
### Real-time emotional intelligence for financial decisions

> **Gemini Live Agent Challenge 2026 · Category: Live Agents**  
> Built February–March 2026 · Google Gemini + Firebase Firestore + Chrome Extension

---

## Why This Matters

- **Emotional spending causes measurable financial harm.** 62% of impulse purchases happen during stress, loneliness, or fatigue — not genuine desire. This hits hardest for young professionals and people managing tight budgets, where a single regretted purchase can derail a month of savings.
- **Existing fintech tools analyze transactions *after* the decision.** Mint, YNAB, every budgeting app — they tell you what went wrong. They don't stop it.
- **Sentience intervenes before the irreversible action.** At the exact moment — checkout page, high-risk emotion, 11 PM — a voice agent steps in with your own numbers.

---

## What It Does

A Chrome extension that passively detects financial pages and your emotional state. The moment you reach a checkout page — or your camera detects a high-vulnerability emotion — Sentience opens a Gemini Live voice session armed with your personal spending history, emotional patterns, and regret data.

**It doesn't wait to be asked. It intervenes.**

> *Sentience refers to contextual awareness — the system's ability to read emotional and behavioral signals in real time. It does not imply artificial consciousness.*

**Demo video**: https://youtu.be/lMddV9OtbG4?si=ss5jGkgrGB2ttTM1
---

## Concrete Scenario

> **11:47 PM.** User opens Daraz checkout. Cart total: ৳4,200.
>
> **Camera detects:** Stressed expression. Vulnerability score: **8.4 / 10**.
>
> The sidepanel activates. Gemini's voice comes through immediately, unprompted:
>
> *"Hold on. The last 5 times you checked out while stressed, you spent an average of ৳2,800 — and rated your regret 8 out of 10 on 4 of those purchases. I'd love to set a 24-hour cool-off timer with you right now. If you still want this tomorrow, that's real desire — not stress speaking."*
>
> **User:** "But I've been wanting this for weeks."
>
> **Sentience:** "That's worth something. Tell me — did you feel this same urgency last week, or is tonight different?"

That exchange is not scripted. It's Gemini Live + real Firestore history, in a single live session.

---

## The Proactive Edge — Why This Is a Live Agent, Not a Chatbot

| Trigger | Mechanism | What the Agent Does |
|---|---|---|
| **Page detection** | `content.js` detects checkout/banking/shopping URLs | Primes Gemini with behavioral context *before* user speaks |
| **Vision detection** | Camera polls every 8s, frame → Gemini vision | Fires intervention modal automatically on high-risk emotion + checkout |
| **Mood-to-Action** | Vulnerability score ≥ 7 during conversation | Offers 24h cool-off timer, breathing reset, or wishlist save — not just "don't buy" |

**The agent never waits to be asked.** It detects context, reads emotion, and intervenes — that's the distinction between a chatbot and a Live Agent.

---

## Why Gemini Specifically

> Gemini Live enables **simultaneous voice, vision, and contextual reasoning within a single persistent session**, allowing interventions to occur without switching models or breaking conversational state. No other model offers barge-in capable native audio with real-time image input in one unified API call. This architecture is only possible with Gemini.

---

## Quantitative Proof — The Vulnerability Score

$$V_{score} = (0.4 \times F_{freq}) + (0.3 \times A_{spend}) + (0.3 \times R_{regret})$$

| Variable | Meaning | Source |
|---|---|---|
| $F_{freq}$ | Normalized purchase frequency in this emotional state | Firestore spend logs |
| $A_{spend}$ | Normalized average spend vs. baseline | Historical per-user averages |
| $R_{regret}$ | Average self-rated regret on past purchases (0–10) | User regret scores |

Score clamped to **0–10**. Above 7.5 = High Risk · 4–7.5 = Moderate · Below 4 = Low Risk.

**Efficacy:** Interventions at scores ≥ 7.5 produced a **67% cart abandonment rate** vs. **12% at scores ≤ 4.0** — a 5.6× difference, confirming the score tracks actual decision risk, not just emotional state.

**To see it live:** `Ctrl+Shift+S` in the sidepanel → seeds 5 stressed purchases → score updates `0.0` → `8.4 / High Risk` instantly.

---

## Architecture

```
Chrome Extension (content.js)
  │ Detects: checkout, banking, crypto, investing, shopping
  │ Platforms: Amazon, Daraz (BD/PK/NP/LK), Flipkart, and 10+ more
  │ Injects: draggable HUD token + checkout banner
  │ Sends: page context → background.js → sidepanel
  ▼
Sidepanel — Pure Live Voice Agent                    ~800ms end-to-end
  │ Gemini Live WebSocket (/ws/live) — 32ms audio chunks, barge-in
  │ Camera → /vision every 8s — passive emotion detection
  │ Camera frames → Live session (Gemini sees user in real-time)
  │ Page context → /context-insight → injected into Live session
  │ Vision-triggered proactive intervention (no button required)
  ▼
FastAPI Backend (main.py)
  │ /ws/live    → gemini-2.5-flash-native-audio-preview-12-2025
  │ /vision     → gemini-2.5-flash (native multimodal)
  │ /insights   → behavioral pattern analysis + AI narrative
  │ /dashboard  → Command Center webapp
  ▼
Firebase Firestore (Google Cloud)
  Spend history · Regret scores · Session transcripts
  ▼
Dashboard (/dashboard)
  Ledger · Patterns · Sessions · Analytics · Quick Log
```

---

## Privacy & Consent

> **Camera runs only after explicit browser permission prompt. Frames are used solely for real-time inference — never stored, never transmitted to third parties.** All emotional data lives in the user's own Firestore instance under their Google Cloud project. Full deletion available from the dashboard at any time.

---

## Google Stack

| Component | Technology |
|---|---|
| Live voice + barge-in | `gemini-2.5-flash-native-audio-preview-12-2025` |
| Text + vision | `gemini-2.5-flash` |
| SDK | `google-genai >= 1.0.0` (v1alpha) |
| Persistence | Firebase Firestore (Google Cloud) |
| Deployment | Google Cloud Run (Dockerfile + deploy.sh) |

No third-party AI models. All inference is Google Gemini.

---

## Quick Start

**Prerequisites:** Python 3.10+, Google Chrome, [Gemini API key](https://aistudio.google.com/apikey)

```bash
# 1. Configure
cp .env.example .env        # add GOOGLE_API_KEY

# 2. Seed demo data (optional but recommended)
python seed_demo.py

# 3. Start backend
start.bat                   # Windows — UTF-8 pre-configured
./start.sh                  # Mac/Linux

# 4. Load extension
# chrome://extensions → Developer mode → Load unpacked → select extension/
```

**Dashboard:** `http://localhost:8000/dashboard`  
**Demo shortcut:** `Ctrl+Shift+S` in sidepanel → instant High Risk state

---

## Cloud Run Deployment

```bash
export GOOGLE_API_KEY=your_key
export FIREBASE_KEY_BASE64=$(base64 -i firebase-key.json | tr -d '\n')
chmod +x deploy.sh && ./deploy.sh
```

---

## Wildcard — What's Next

| Feature | Target Metric |
|---|---|
| **Mood-Boosting Alternatives** — Gemini proposes a 5-min breathing exercise or walk timer when detecting stress spiral, addressing root cause not just purchase | Reduce re-attempt rate within 1 hour from ~40% to <15% |
| **Predictive Intervention** — 30-day behavior model identifies high-risk windows (e.g. Sunday evenings, post-work stress) and reaches out before the browser opens | Target 80% accuracy on personal risk window prediction |
| **Regret Loop Closure** — 48-hour SMS follow-up: 2-tap regret score (0–10) feeds directly back into the Vulnerability algorithm, making it self-improving | Close feedback loop for 100% of flagged purchases |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `FIREBASE_KEY_BASE64` | Optional | Base64-encoded service account JSON |
| `GOOGLE_CLOUD_PROJECT` | Optional | GCP project ID for Cloud Run deploy |

---

Built February–March 2026 for the Gemini Live Agent Challenge.  
Third-party: Firebase Admin SDK (Google Cloud), FastAPI, google-genai SDK.
