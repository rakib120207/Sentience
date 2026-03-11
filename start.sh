#!/bin/bash
set -e
echo ""
echo "  ╔════════════════════════════════════════╗"
echo "  ║     SENTIENCE FINANCE v2               ║"
echo "  ║     Gemini Live Agent + Webapp         ║"
echo "  ╚════════════════════════════════════════╝"
echo ""
if ! command -v python3 &>/dev/null; then echo "[ERROR] Python 3 not found"; exit 1; fi
echo "  Installing dependencies…"
pip3 install -r requirements.txt -q
echo ""
echo "  ┌─────────────────────────────────────────────────┐"
echo "  │  Dashboard  : http://localhost:8000/dashboard    │"
echo "  │  API docs   : http://localhost:8000/docs         │"
echo "  │  Health     : http://localhost:8000/health       │"
echo "  │                                                   │"
echo "  │  Chrome ext : Load extension/ folder in Chrome   │"
echo "  └─────────────────────────────────────────────────┘"
echo ""
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
