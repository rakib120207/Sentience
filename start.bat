@echo off
title Sentience Finance v2
color 0A

REM ── Fix Windows terminal encoding so Gemini logs display cleanly ──
chcp 65001 > nul
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

echo.
echo  SENTIENCE FINANCE v2 — Gemini Live Agent + Webapp
echo  ────────────────────────────────────────────────
echo  Terminal encoding: UTF-8 (chcp 65001)
echo.
pip install -r requirements.txt -q --disable-pip-version-check
echo.
echo  Dashboard  : http://localhost:8000/dashboard
echo  API docs   : http://localhost:8000/docs
echo  Load extension/ in chrome://extensions
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
