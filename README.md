# Sentience Finance
### Real-time emotional intelligence for financial decisions

> **Gemini Live Agent Challenge 2026 · Category: Live Agents**

---

## The Problem

You don't make bad financial decisions because you're uninformed. You make them because you're stressed, lonely, tired — and no tool is watching out for you at the exact moment it matters.

Sentience is.

---

## What It Does

A Chrome extension that passively monitors your emotional state while you browse financial sites. The moment you hit a checkout page — or your camera detects a high-vulnerability emotion — it proactively intervenes with a Gemini Live voice session armed with your personal spending history, emotional patterns, and regret data.

**It doesn't wait to be asked. It intervenes.**

---

## The "Proactive" Edge — Why This Is a Live Agent, Not a Chatbot

Most AI tools wait for a user to ask a question. Sentience does three things no chatbot does:

**1. Page-triggered intervention** — `content.js` auto-detects checkout, banking, crypto, and shopping pages (including Daraz). When it fires, it injects a HUD overlay and primes Gemini Live with full context *before the user says anything.*

**2. Vision-triggered intervention** — Camera runs passively every 8 seconds. If it detects a high-vulnerability emotion (stressed, anxious, sad) *while the user is on a checkout page*, Sentience fires an intervention modal automatically — no button click required. The agent acts on what it sees, not what it's told.

**3. Mood-to-Action, not just "Don't buy"** — When vulnerability is high, Gemini doesn't just warn. It offers a concrete alternative: a 24-hour cool-off timer, a 2-minute breathing reset, a wishlist save. The agent proposes a *specific next action*.

---

## Quantitative Proof — The Vulnerability Score

The dashboard shows a live **Vulnerability Score (0–10)** from three behavioral signals:

| Factor | Weight | Source |
|---|---|---|
| Purchase frequency in this emotional state | 40% | Firestore spend logs |
| Average spend amount vs baseline | 30% | Historical averages |
| Regret score on past purchases in this state | 30% | User-rated regret data |

**To see it move live:** Press `Ctrl+Shift+S` in the extension sidepanel. This seeds 5 stressed purchases ($120–$340) and immediately recalculates the score. Dashboard updates from `0.0` → `8.4 / High Risk` in real time.

---

## Architecture

```
Chrome Extension (content.js)
  │ Detects: checkout, banking, crypto, investing, shopping, Daraz
  │ Injects: HUD overlay (draggable) + checkout banner on page
  │ Sends: page context to background → sidepanel
  ▼
Sidepanel — Pure Voice Agent
  │ Gemini Live WebSocket (/ws/live) — real-time audio, barge-in
  │ Camera → /vision — passive emotion detection every 8s
  │ Camera frames → Gemini Live session (agent sees you in real-time)
  │ Context banner → /context-insight — AI page analysis
  │ Vision-triggered auto-intervention on high-risk emotion + checkout
  ▼
FastAPI Backend (main.py)
  │ /ws/live    → gemini-2.5-flash-native-audio-preview-12-2025
  │ /speak      → gemini-2.5-flash  (text inference)
  │ /vision     → gemini-2.5-flash  (native multimodal vision)
  │ /insights   → behavioral pattern analysis + AI narrative
  │ /dashboard  → serves Command Center webapp
  ▼
Firebase Firestore — spend history, regret scores, session memory
  ▼
Webapp (/dashboard) — Command Center
  Ledger · Patterns · Sessions · Analytics · Log Spend
```

---

## Google Stack

| Component | Technology |
|---|---|
| Live voice (barge-in) | `gemini-2.5-flash-native-audio-preview-12-2025` |
| Text + vision | `gemini-2.5-flash` |
| SDK | `google-genai >= 1.0.0` (v1alpha) |
| Persistence | Firebase Firestore (Google Cloud) |
| Deployment | Google Cloud Run (Dockerfile included) |

No third-party AI models. All inference is Google Gemini.

---

## Quick Start

**Prerequisites:** Python 3.10+, Google Chrome, [Gemini API key](https://aistudio.google.com/apikey)

```bash
# 1. Configure
cp .env.example .env          # Add your GOOGLE_API_KEY

# 2. (Optional) Firestore persistence
# Place firebase-key.json in project root
# Without it: runs in demo mode (in-memory, data resets on restart)

# 3. Seed demo data
python seed_demo.py

# 4. Start backend
./start.sh          # Mac/Linux
start.bat           # Windows  <- UTF-8 encoding pre-configured
```

**Load the Chrome extension:**
1. `chrome://extensions` → Enable Developer mode
2. Load unpacked → select the `extension/` folder

---

## Cloud Run Deployment

```bash
export GOOGLE_API_KEY=your_key
export FIREBASE_KEY_BASE64=$(base64 -i firebase-key.json | tr -d '\n')
chmod +x deploy.sh && ./deploy.sh
```

---

## API Reference

| Endpoint | Description |
|---|---|
| `WS /ws/live` | Gemini Live bidirectional audio (barge-in supported) |
| `POST /speak` | Multimodal inference — text + optional camera frame |
| `POST /vision` | Passive emotion detection from camera frame |
| `POST /context-insight` | AI analysis of detected financial page |
| `POST /log-spend` | Log purchase with emotional context |
| `POST /regret` | Rate regret 0-10 on past purchase |
| `GET /insights` | Full behavioral ledger + AI narrative |
| `GET /pattern-report/quantitative/{emotion}` | Vulnerability score vs baseline |
| `GET /analytics/timeline` | 30-day vulnerability + spending timeline |
| `GET /sessions` | Voice session history |
| `GET /sessions/{id}/turns` | Full conversation turns for a session |
| `GET /dashboard` | Command Center webapp |

---

## Demo Shortcut

`Ctrl+Shift+S` in the extension sidepanel → seeds 5 stressed purchases → immediately recalculates vulnerability score to **8.4 / High Risk** → fires the intervention modal. Use this to populate the dashboard before recording.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | YES | From [aistudio.google.com](https://aistudio.google.com/apikey) |
| `FIREBASE_KEY_BASE64` | Optional | Base64-encoded Firebase service account JSON |

---

## Wildcard — What's Next

The current agent intervenes at the moment of purchase. The next frontier is breaking the emotional cycle before it reaches checkout:

- **Mood-Boosting Alternatives** — When Gemini detects a stress spiral, it proposes a specific circuit-breaker: a 5-minute guided breathing session, a 10-minute walk timer, or a "sleep on it" wishlist save with a next-morning reminder. Address the emotional root, not just block the symptom.

- **Predictive Intervention** — Using the 30-day vulnerability timeline, Sentience learns *when* a user is statistically most likely to make a regretted purchase (Sunday evenings, post-work stress windows) and proactively reaches out before they even open a browser.

- **Regret Loop Closure** — After a flagged purchase, Sentience follows up 48 hours later: "How do you feel about that order now?" Closing the regret loop turns the app into a true behavioral coach.

---

Built February-March 2026 for the Gemini Live Agent Challenge.
Third-party integrations: Firebase Admin SDK (Google), FastAPI, google-genai SDK.
