"""
Backend for the AI Career & Learning Companion.

Replaces two things the frontend used to do in-browser:
  1. window.storage.get/set  -> now a small SQLite key-value store
  2. direct fetch() to api.anthropic.com  -> now proxied through this
     server, so the real Anthropic API key stays secret and is never
     shipped to the browser.

Run it with:
    pip install -r requirements.txt
    cp .env.example .env      # then put your real key in .env
    python app.py

It listens on http://localhost:5000 by default. The frontend's
vite.config.js proxies "/api" requests here during development.
"""

import os
import sqlite3
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "storage.db"

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

app = Flask(__name__)
CORS(app)  # relaxed for local dev; tighten this before deploying publicly


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS kv_store (
            key        TEXT PRIMARY KEY,
            value      TEXT NOT NULL,
            shared     INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "anthropic_key_configured": bool(ANTHROPIC_API_KEY)})


# ---------------------------------------------------------------------------
# Storage endpoints (mirror window.storage.get / .set / .delete / .list)
# ---------------------------------------------------------------------------

@app.route("/api/storage/get", methods=["GET"])
def storage_get():
    key = request.args.get("key", "")
    if not key:
        return jsonify({"error": "key is required"}), 400

    db = get_db()
    row = db.execute("SELECT value FROM kv_store WHERE key = ?", (key,)).fetchone()
    if row is None:
        return jsonify({"error": "not found"}), 404
    return jsonify({"key": key, "value": row["value"]})


@app.route("/api/storage/set", methods=["POST"])
def storage_set():
    data = request.get_json(silent=True) or {}
    key = data.get("key")
    value = data.get("value")
    shared = bool(data.get("shared", False))

    if not key or value is None:
        return jsonify({"error": "key and value are required"}), 400

    db = get_db()
    db.execute(
        """
        INSERT INTO kv_store (key, value, shared, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            shared = excluded.shared,
            updated_at = CURRENT_TIMESTAMP
        """,
        (key, value, int(shared)),
    )
    db.commit()
    return jsonify({"key": key, "ok": True})


@app.route("/api/storage/delete", methods=["POST"])
def storage_delete():
    data = request.get_json(silent=True) or {}
    key = data.get("key")
    if not key:
        return jsonify({"error": "key is required"}), 400

    db = get_db()
    db.execute("DELETE FROM kv_store WHERE key = ?", (key,))
    db.commit()
    return jsonify({"key": key, "deleted": True})


@app.route("/api/storage/list", methods=["GET"])
def storage_list():
    prefix = request.args.get("prefix", "")
    db = get_db()
    rows = db.execute(
        "SELECT key FROM kv_store WHERE key LIKE ? ORDER BY key",
        (f"{prefix}%",),
    ).fetchall()
    return jsonify({"keys": [r["key"] for r in rows], "prefix": prefix})


# ---------------------------------------------------------------------------
# Claude proxy — keeps the real API key server-side
# ---------------------------------------------------------------------------

@app.route("/api/claude/message", methods=["POST"])
def claude_message():
    if not ANTHROPIC_API_KEY:
        return jsonify({"error": "Server is missing ANTHROPIC_API_KEY. Set it in backend/.env"}), 500

    body = request.get_json(silent=True) or {}
    content_blocks = body.get("content")
    max_tokens = body.get("max_tokens", 1000)

    if not content_blocks:
        return jsonify({"error": "content is required"}), 400

    try:
        resp = requests.post(
            ANTHROPIC_URL,
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": ANTHROPIC_VERSION,
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": content_blocks}],
            },
            timeout=60,
        )
    except requests.RequestException as exc:
        return jsonify({"error": f"Could not reach Anthropic API: {exc}"}), 502

    if resp.status_code != 200:
        return jsonify({"error": "Anthropic API error", "details": resp.text}), resp.status_code

    return jsonify(resp.json())


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
