"""
seed_demo.py — Sentience Finance Demo Seeder
=============================================
Run this ONCE before your hackathon demo to pre-populate Firestore
with realistic stressed-spending data.

Usage:
    python seed_demo.py

Requirements:
    pip install firebase-admin
    firebase-key.json must be in the same folder as this script.
"""

import json
import os
import uuid
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, firestore

# ── Firebase init (reads file directly — no base64, no BOM issues) ──
KEY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase-key.json")

if not os.path.exists(KEY_FILE):
    print(f"\n❌ firebase-key.json not found at:\n   {KEY_FILE}")
    print("\nSteps to fix:")
    print("  1. Firebase Console → Project Settings → Service Accounts")
    print("  2. Click 'Generate new private key'")
    print("  3. Save as 'firebase-key.json' in the sentience_v2 folder\n")
    raise SystemExit(1)

try:
    with open(KEY_FILE, "r", encoding="utf-8-sig") as f:
        key_dict = json.load(f)
    print(f"✅ Firebase key loaded  (project: {key_dict.get('project_id','?')})")
except json.JSONDecodeError as e:
    print(f"\n❌ firebase-key.json is not valid JSON: {e}")
    print("   Re-download from Firebase Console → Service Accounts\n")
    raise SystemExit(1)

cred = credentials.Certificate(key_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()
print("✅ Firestore connected\n")

# ── Demo spending data ─────────────────────────────────────────────

STRESSED_PURCHASES = [
    {"amount": 189.99, "category": "Technology",    "description": "Mechanical keyboard",  "regret": 9},
    {"amount": 134.00, "category": "Shopping",      "description": "Sneakers (impulse)",   "regret": 8},
    {"amount": 94.99,  "category": "Entertainment", "description": "Gaming subscription",  "regret": 7},
    {"amount": 119.00, "category": "Technology",    "description": "Smart watch band",     "regret": 8},
    {"amount": 102.00, "category": "Shopping",      "description": "Jacket I never wore",  "regret": 8},
]

HAPPY_PURCHASES = [
    {"amount": 5.50,  "category": "Food & Dining",  "description": "Coffee treat",   "regret": 1},
    {"amount": 24.99, "category": "Entertainment",  "description": "Movie night",     "regret": 2},
    {"amount": 14.00, "category": "Food & Dining",  "description": "Birthday lunch",  "regret": 0},
]

NEUTRAL_PURCHASES = [
    {"amount": 67.50, "category": "Health",         "description": "Gym supplement",  "regret": 3},
    {"amount": 42.00, "category": "Subscriptions",  "description": "Annual app sub",  "regret": 2},
]

# ── Write to Firestore ─────────────────────────────────────────────

def seed_purchases(purchases, emotion, days_ago_start=30):
    count = 0
    for i, p in enumerate(purchases):
        spend_id = f"demo_{emotion}_{i}_{uuid.uuid4().hex[:8]}"
        days_offset = days_ago_start - (i * 4)
        ts = datetime.utcnow() - timedelta(days=days_offset, hours=(i * 3))
        db.collection("spend_logs").document(spend_id).set({
            "amount":           round(p["amount"], 2),
            "category":         p["category"],
            "description":      p["description"],
            "emotion_hint":     emotion,
            "visual_context":   "",
            "session_id":       "demo_seed",
            "regret_score":     p.get("regret"),
            "regret_logged_at": ts + timedelta(days=1),
            "timestamp":        ts,
            "spend_id":         spend_id,
        })
        count += 1
        print(f"  ✓ [{emotion:10s}]  ${p['amount']:7.2f}  —  {p['description']:<30}  regret={p.get('regret')}/10")
    return count


print("🌱 Sentience Demo Seeder")
print("=" * 55)

print("\n📍 Seeding STRESSED purchases (core demo data):")
n = seed_purchases(STRESSED_PURCHASES, "stressed")

print("\n📍 Seeding HAPPY purchases (contrast):")
n += seed_purchases(HAPPY_PURCHASES, "happy")

print("\n📍 Seeding NEUTRAL purchases:")
n += seed_purchases(NEUTRAL_PURCHASES, "neutral")

print(f"\n✅ Done — {n} transactions written to Firestore.")
print("\nExpected results:")
print("  • Vulnerability (stressed): ~8.2 / 10")
print("  • Danger Emotion: 😰 Stressed")
print("  • Ledger: 10 transactions")
print("\nRun backend:  python -m uvicorn main:app --reload")
print("Dashboard:    http://localhost:8000/dashboard\n")
