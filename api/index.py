"""
Vercel Serverless Function entry point.

This file is the ONLY deployment glue added.  It does NOT modify any backend
business logic — it simply tells Vercel's Python runtime where to find the
existing FastAPI application (backend/app/main.py).

How it works:
  1. Adds `backend/` to sys.path so that `from app.config import ...` resolves.
  2. Imports the FastAPI `app` object from the existing backend.
  3. Vercel's @vercel/python runtime serves it as an ASGI application.
"""

import os
import sys

# The backend code lives in backend/app/.  Its internal imports use
# `from app.config import ...` which assumes `backend/` is on PYTHONPATH.
_backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, os.path.abspath(_backend_dir))

from app.main import app  # noqa: E402,F401