# Sentience Finance
### Real-time emotional intelligence for financial decisions

> **Gemini Live Agent Challenge 2026 · Category: Live Agents**

---

## The Problem

You don't make bad financial decisions because you're uninformed. You make them because you're stressed, lonely, tired — and no tool is watching out for you at the exact moment it matters.

Sentience is.

---

## What It Does

A Chrome extension that passively monitors your emotional state while you browse financial sites. The moment you hit a checkout page, it opens a voice session with Gemini Live — armed with your personal spending history, emotional patterns, and regret data — and speaks to you before you click buy.

It doesn't wait to be asked. It intervenes.

---

## Architecture

```
Chrome Extension (content.js)
  │ Detects: checkout, banking, crypto, investing, shopping
  │ Injects: HUD overlay + checkout banner on page
  │ Sends: page context to background → sidepanel
  ▼
Sidepanel — Pure Voice Agent
  │ Gemini Live WebSocket (/ws/live) — real-time audio, barge-in
  │ Camera → /vision — passive emotion detection every 8s
  │ Context banner → /context-insight — AI page analysis
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
start.bat           # Windows

# Dashboard: http://localhost:8000/dashboard
# API docs:  http://localhost:8000/docs
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
| `POST /regret` | Rate regret 0–10 on past purchase |
| `GET /insights` | Full behavioral ledger + AI narrative |
| `GET /pattern-report/quantitative/{emotion}` | Vulnerability score vs baseline |
| `GET /analytics/timeline` | 30-day vulnerability + spending timeline |
| `GET /sessions` | Voice session history |
| `GET /sessions/{id}/turns` | Full conversation turns for a session |
| `GET /dashboard` | Command Center webapp |

---

## Demo Shortcut

`Ctrl+Shift+S` in the extension → seeds stressed spending data + triggers a live intervention modal. Use this to populate the dashboard before recording.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | From [aistudio.google.com](https://aistudio.google.com/apikey) |
| `FIREBASE_KEY_BASE64` | Optional | Base64-encoded Firebase service account JSON |

---

Built February–March 2026 for the Gemini Live Agent Challenge.
