from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import requests
import uuid
import datetime
import bcrypt
from icalendar import Calendar

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "mindlink.db")
GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # USERS
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        created_at TEXT
    )
    ''')

    # MOODS
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS moods (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        mood TEXT NOT NULL,
        note TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(username) REFERENCES users(username)
    )
    ''')

    # GOALS
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY(username) REFERENCES users(username)
    )
    ''')

    # CALENDAR EVENTS
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        event_date TEXT NOT NULL,
        is_stressful INTEGER DEFAULT 0,
        stress_reason TEXT,
        synced_at TEXT NOT NULL,
        FOREIGN KEY(username) REFERENCES users(username)
    )
    ''')

    conn.commit()
    conn.close()


# Initialize Database on startup
init_db()

app = Flask(__name__)
CORS(app)  # Allow all origins for the frontend to communicate with backend


def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    conn.close()
    return (rv[0] if rv else None) if one else rv


# ─── AUTH ──────────────────────────────────────────────────────────────────────

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    existing = query_db('SELECT * FROM users WHERE username=?', [username], one=True)
    if existing:
        return jsonify({"success": False, "message": "User already exists"}), 409

    user_id = str(uuid.uuid4())
    created_at = datetime.datetime.now().isoformat()
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    query_db('''
        INSERT INTO users (id, username, password, created_at)
        VALUES (?, ?, ?, ?)
    ''', [user_id, username, hashed, created_at])

    return jsonify({"success": True})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = query_db('SELECT * FROM users WHERE username=?', [username], one=True)

    if not user or not bcrypt.checkpw(password.encode(), user['password']):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"]
        }
    })


# ─── MOODS ─────────────────────────────────────────────────────────────────────

@app.route('/api/moods/get', methods=['GET'])
def get_moods():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "username required"}), 400

    moods = query_db('SELECT * FROM moods WHERE username = ? ORDER BY timestamp DESC', [username])
    result = []
    for row in moods:
        result.append({
            "id": row["id"],
            "mood": row["mood"],
            "note": row["note"],
            "timestamp": row["timestamp"]
        })
    return jsonify(result)


@app.route('/api/moods/add', methods=['POST'])
def add_mood():
    data = request.json
    username = data.get('username')
    mood = data.get('mood')
    note = data.get('note', '')
    timestamp = data.get('timestamp')
    entry_id = data.get('id', str(uuid.uuid4()))

    if not username or not mood or not timestamp:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    query_db('INSERT INTO moods (id, username, mood, note, timestamp) VALUES (?, ?, ?, ?, ?)',
             [entry_id, username, mood, note, timestamp])
    return jsonify({"success": True})


# ─── GOALS ─────────────────────────────────────────────────────────────────────

@app.route('/api/goals/get', methods=['GET'])
def get_goals():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "username required"}), 400
    goals = query_db('SELECT * FROM goals WHERE username = ? ORDER BY created_at DESC', [username])
    result = [{"id": r["id"], "title": r["title"], "completed": bool(r["completed"]), "created_at": r["created_at"]} for r in goals]
    return jsonify(result)


@app.route('/api/goals/add', methods=['POST'])
def add_goal():
    data = request.json
    username = data.get('username')
    title = data.get('title')
    goal_id = data.get('id', str(uuid.uuid4()))
    created_at = data.get('created_at', datetime.datetime.now(datetime.timezone.utc).isoformat())

    if not username or not title:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    query_db('INSERT INTO goals (id, username, title, completed, created_at) VALUES (?, ?, ?, 0, ?)',
             [goal_id, username, title, created_at])
    return jsonify({"success": True})


@app.route('/api/goals/toggle', methods=['POST'])
def toggle_goal():
    data = request.json
    goal_id = data.get('id')
    completed = 1 if data.get('completed') else 0
    if not goal_id:
        return jsonify({"success": False, "message": "Missing ID"}), 400
    query_db('UPDATE goals SET completed = ? WHERE id = ?', [completed, goal_id])
    return jsonify({"success": True})


@app.route('/api/goals/delete', methods=['POST'])
def delete_goal():
    data = request.json
    goal_id = data.get('id')
    if not goal_id:
        return jsonify({"success": False, "message": "Missing ID"}), 400
    query_db('DELETE FROM goals WHERE id = ?', [goal_id])
    return jsonify({"success": True})


# ─── CALENDAR ──────────────────────────────────────────────────────────────────

def classify_events_with_ai(events):
    """Use Groq AI to classify which events are stressful."""
    if not events:
        return []

    events_text = "\n".join([f"- {e['title']} on {e['date']}" for e in events])

    prompt = f"""You are a mental wellness AI. Analyze these upcoming calendar events and identify which ones are likely stressful (e.g., exams, deadlines, interviews, medical appointments, presentations, reviews, submissions).

Events:
{events_text}

Return a JSON array ONLY, no extra text:
[
  {{"title": "event name", "is_stressful": true/false, "reason": "short reason why stressful or not"}}
]"""

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {GROQ_API_KEY}',
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        text = response.json()['choices'][0]['message']['content']

        import json
        # Try to parse as object with array, or direct array
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        # Look for any list key in the object
        for val in parsed.values():
            if isinstance(val, list):
                return val
        return []
    except Exception as e:
        print("AI classification error:", e)
        # Fallback: mark all as potentially stressful
        return [{"title": e['title'], "is_stressful": True, "reason": "Could not classify"} for e in events]


@app.route('/api/calendar/sync', methods=['POST'])
def sync_calendar():
    data = request.json
    username = data.get('username')
    ics_url = data.get('ics_url', '').strip()

    if not username or not ics_url:
        return jsonify({"success": False, "message": "username and ics_url are required"}), 400

    # Fetch the .ics feed
    try:
        resp = requests.get(ics_url, timeout=15)
        resp.raise_for_status()
        cal = Calendar.from_ical(resp.content)
    except Exception as e:
        print("Calendar fetch error:", e)
        return jsonify({"success": False, "message": "Failed to fetch or parse calendar. Make sure the URL is a valid public .ics link."}), 400

    # Extract events in the next 30 days
    now = datetime.datetime.now(datetime.timezone.utc).date()
    cutoff = now + datetime.timedelta(days=30)

    upcoming = []
    for component in cal.walk():
        if component.name != 'VEVENT':
            continue
        summary = str(component.get('SUMMARY', 'Untitled Event'))
        dtstart = component.get('DTSTART')
        if not dtstart:
            continue

        dt = dtstart.dt
        event_date = dt if isinstance(dt, datetime.date) and not isinstance(dt, datetime.datetime) else (dt.date() if hasattr(dt, 'date') else None)
        if not event_date:
            continue

        if now <= event_date <= cutoff:
            upcoming.append({"title": summary, "date": event_date.isoformat()})

    if not upcoming:
        return jsonify({"success": True, "message": "No upcoming events found in the next 30 days.", "saved": 0})

    # Classify with AI
    classified = classify_events_with_ai(upcoming)

    # Build a lookup for classification results
    classification_map = {}
    for item in classified:
        classification_map[item.get('title', '')] = item

    # Clear old events for this user and save new ones
    query_db('DELETE FROM calendar_events WHERE username = ?', [username])

    synced_at = datetime.datetime.now().isoformat()
    saved_count = 0

    for event in upcoming:
        classification = classification_map.get(event['title'], {})
        is_stressful = 1 if classification.get('is_stressful', False) else 0
        stress_reason = classification.get('reason', '')
        event_id = str(uuid.uuid4())

        query_db('''
            INSERT INTO calendar_events (id, username, title, event_date, is_stressful, stress_reason, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', [event_id, username, event['title'], event['date'], is_stressful, stress_reason, synced_at])
        saved_count += 1

    stressful_count = sum(1 for e in upcoming if classification_map.get(e['title'], {}).get('is_stressful', False))

    return jsonify({
        "success": True,
        "message": f"Synced {saved_count} events, identified {stressful_count} potentially stressful.",
        "total": saved_count,
        "stressful": stressful_count
    })


@app.route('/api/calendar/events', methods=['GET'])
def get_calendar_events():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "username required"}), 400

    # Only return future events
    today = datetime.datetime.now().date().isoformat()
    events = query_db(
        'SELECT * FROM calendar_events WHERE username = ? AND event_date >= ? ORDER BY event_date ASC',
        [username, today]
    )
    result = []
    for row in events:
        result.append({
            "id": row["id"],
            "title": row["title"],
            "event_date": row["event_date"],
            "is_stressful": bool(row["is_stressful"]),
            "stress_reason": row["stress_reason"],
            "synced_at": row["synced_at"]
        })
    return jsonify(result)


# ─── AI ────────────────────────────────────────────────────────────────────────

@app.route('/api/ai/groq', methods=['POST'])
def call_ai():
    data = request.json
    messages = data.get('messages', [])
    max_tokens = data.get('maxTokens', 500)
    temperature = data.get('temperature', 0.7)
    response_format = data.get('response_format')

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {GROQ_API_KEY}',
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    if response_format:
        payload["response_format"] = response_format

    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        resp_data = response.json()
        text = resp_data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return jsonify({"success": True, "text": text})
    except requests.exceptions.RequestException as e:
        print("API Error:", e)
        return jsonify({"success": False, "message": "Failed to generate AI response"}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
