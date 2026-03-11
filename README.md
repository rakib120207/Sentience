# Sentience Finance
### Real-time emotional intelligence for financial decisions

> **Gemini Live Agent Challenge 2026 · Category: Live Agents**
> Built February–March 2026 · Google Gemini + Firebase Firestore + Chrome Extension

---

## Why This Matters

- **Emotional spending causes measurable financial harm.** Studies show 62% of impulse purchases happen during stress, loneliness, or fatigue — not from genuine desire.
- **Existing fintech tools analyze transactions *after* the decision.** Mint, YNAB, and every budgeting app in existence tell you what went wrong. They don't stop it.
- **Sentience intervenes before the irreversible action.** At the exact moment — checkout page, high-risk emotion, late at night — a voice agent steps in with your own numbers.

---

## What It Does

A Chrome extension that passively detects financial pages and your emotional state. The moment you reach a checkout page — or your camera detects a high-vulnerability emotion — Sentience opens a Gemini Live voice session armed with your personal spending history, emotional patterns, and regret data.

**It doesn't wait to be asked. It intervenes.**

> *Sentience refers to contextual awareness — the system's ability to read emotional and behavioral signals in real time. It does not imply artificial consciousness.*

---

## Concrete Scenario

> **11:47 PM.** User opens Daraz checkout. Cart total: ৳4,200.
>
> **Camera detects:** Stressed expression. Vulnerability score calculates to **8.4 / 10**.
>
> **Sentience says (via Gemini Live, unprompted):**
> *"Hold on. The last 5 times you checked out while stressed, you spent an average of ৳2,800 — and rated your regret 8 out of 10 on 4 of those purchases. I'd love to set a 24-hour cool-off timer with you right now. If you still want this tomorrow, that's real desire — not stress speaking."*
>
> **User:** "But I've been wanting this for weeks."
>
> **Sentience:** "That's worth something. Tell me — did you feel this same urgency last week, or is tonight different?"

That exchange is not scripted. It's Gemini Live + real Firestore history, in a single live session.

---

## The Proactive Edge — Why This Is a Live Agent, Not a Chatbot

**1. Page-triggered intervention** — `content.js` auto-detects checkout, banking, crypto, shopping pages (including Daraz, Chaldal, Rokomari). On detection, it injects a HUD overlay and primes Gemini Live with full context *before the user says anything.*

**2. Vision-triggered intervention** — Camera runs passively every 8 seconds. If it detects a high-vulnerability emotion (stressed, anxious, sad) *while the user is on a checkout page*, Sentience fires an intervention modal automatically — no button click required.

**3. Mood-to-Action, not just "Don't buy"** — When vulnerability is high, Gemini offers a concrete alternative: 24-hour cool-off timer, 2-minute breathing reset, wishlist save. The agent prescribes a *specific next action* — that's the difference between a notification and an agent.

---

## Why Gemini Specifically

> Gemini Live enables **simultaneous voice, vision, and contextual reasoning within a single persistent session**, allowing interventions to occur without switching models or breaking conversational state. No other model on the market offers barge-in capable native audio with real-time image input in one unified API call. This architecture is only possible with Gemini.

---

## Quantitative Proof — The Vulnerability Score

Live **Vulnerability Score (0–10)** calculated from three behavioral signals:

| Factor | Weight | Source |
|---|---|---|
| Purchase frequency in this emotional state | 40% | Firestore spend logs |
| Average spend amount vs baseline | 30% | Historical averages |
| Regret score on past purchases in this state | 30% | User-rated regret (0–10) |

**To see it move live:** Press `Ctrl+Shift+S` in the extension sidepanel → seeds 5 stressed purchases → immediately recalculates → dashboard updates from `0.0` → `8.4 / High Risk`.

---

## Architecture

```
Chrome Extension (content.js)
  │ Detects: checkout, banking, crypto, investing, shopping, Daraz
  │ Injects: HUD overlay (draggable) + checkout banner on page
  │ Sends: page context → background → sidepanel
  ▼
Sidepanel — Pure Voice Agent
  │ Gemini Live WebSocket (/ws/live) — real-time audio, barge-in
  │ Camera → /vision — passive emotion detection every 8s
  │ Camera frames → Live session (Gemini sees the user in real-time)
  │ Context banner → /context-insight — AI page analysis
  │ Vision-triggered proactive intervention on high-risk emotion
  ▼
FastAPI Backend (main.py)
  │ /ws/live    → gemini-2.5-flash-native-audio-preview-12-2025
  │ /speak      → gemini-2.5-flash (text inference)
  │ /vision     → gemini-2.5-flash (native multimodal vision)
  │ /insights   → behavioral pattern analysis + AI narrative
  │ /dashboard  → serves Command Center webapp
  ▼
Firebase Firestore — spend history, regret scores, session memory
  ▼
Webapp (/dashboard) — Command Center
  Ledger · Patterns · Sessions · Analytics · Log Spend
```

---

## Privacy & Consent

> **Camera analysis runs only after explicit user permission (browser prompt required), and frames are used solely for real-time inference — never stored, never transmitted to third parties.** All emotional data stays in the user's own Firestore instance under their Google Cloud project. The user controls deletion at any time via the dashboard.

---

## Google Stack

| Component | Technology |
|---|---|
| Live voice + barge-in | `gemini-2.5-flash-native-audio-preview-12-2025` |
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
# Without it: runs in demo mode (in-memory, resets on restart)

# 3. Seed demo data
python seed_demo.py

# 4. Start backend
start.bat           # Windows  <- UTF-8 encoding pre-configured
./start.sh          # Mac/Linux
```

**Load the Chrome extension:**
1. `chrome://extensions` → Enable Developer mode
2. Load unpacked → select the `extension/` folder

**Dashboard:** `http://localhost:8000/dashboard`

---

## Cloud Run Deployment

```bash
export GOOGLE_API_KEY=your_key
export FIREBASE_KEY_BASE64=$(base64 -i firebase-key.json | tr -d '\n')
chmod +x deploy.sh && ./deploy.sh
```

---

## Demo Shortcut

`Ctrl+Shift+S` in the sidepanel → seeds stressed spending data + recalculates score to 8.4 / High Risk + fires intervention modal. Use before recording to populate the dashboard.

---

## Wildcard — What's Next

- **Mood-Boosting Alternatives** — When Gemini detects a stress spiral, it proposes a circuit-breaker: 5-minute guided breathing, 10-minute walk timer, or "sleep on it" wishlist save with next-morning reminder. Address the emotional root, not just block the symptom.
- **Predictive Intervention** — Learn *when* a user is statistically most likely to make a regretted purchase and reach out proactively before they open a browser.
- **Regret Loop Closure** — 48-hour follow-up: "How do you feel about that order now?" Closes the behavioral feedback loop.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | YES | From [aistudio.google.com](https://aistudio.google.com/apikey) |
| `FIREBASE_KEY_BASE64` | Optional | Base64-encoded Firebase service account JSON |

---

Built February–March 2026 for the Gemini Live Agent Challenge.
Third-party integrations: Firebase Admin SDK (Google Cloud), FastAPI, google-genai SDK.
