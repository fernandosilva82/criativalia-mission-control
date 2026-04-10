#!/usr/bin/env python3
"""
API de Memória do OpenClaw
Permite consultar e atualizar memórias persistentes
"""

import sqlite3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import os

DB_PATH = os.path.expanduser("~/memory/brain.db")

class MemoryAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            if path == '/api/memory/preferences':
                cursor.execute("SELECT * FROM user_preferences ORDER BY key")
                data = [dict(row) for row in cursor.fetchall()]
                response = {"status": "ok", "data": data}
                
            elif path == '/api/memory/learnings':
                category = params.get('category', [None])[0]
                if category:
                    cursor.execute("SELECT * FROM learnings WHERE category = ? ORDER BY importance DESC", (category,))
                else:
                    cursor.execute("SELECT * FROM learnings ORDER BY importance DESC")
                data = [dict(row) for row in cursor.fetchall()]
                response = {"status": "ok", "data": data}
                
            elif path == '/api/memory/tasks':
                status = params.get('status', [None])[0]
                if status:
                    cursor.execute("SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC", (status,))
                else:
                    cursor.execute("SELECT * FROM tasks ORDER BY priority DESC, created_at DESC")
                data = [dict(row) for row in cursor.fetchall()]
                response = {"status": "ok", "data": data}
                
            elif path == '/api/memory/stats':
                stats = {}
                cursor.execute("SELECT COUNT(*) FROM learnings")
                stats['learnings'] = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM tasks")
                stats['tasks'] = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'pending'")
                stats['pending_tasks'] = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM user_preferences")
                stats['preferences'] = cursor.fetchone()[0]
                response = {"status": "ok", "stats": stats}
                
            elif path == '/api/memory/about':
                cursor.execute("SELECT value FROM user_preferences WHERE key = 'user_name'")
                user = cursor.fetchone()
                cursor.execute("SELECT value FROM user_preferences WHERE key = 'company'")
                company = cursor.fetchone()
                response = {
                    "status": "ok",
                    "user": user[0] if user else "Unknown",
                    "company": company[0] if company else "Unknown",
                    "agent": "OpenClaw",
                    "memory_location": DB_PATH
                }
                
            else:
                response = {"status": "ok", "message": "Memory API is running", "endpoints": [
                    "/api/memory/about",
                    "/api/memory/preferences",
                    "/api/memory/learnings",
                    "/api/memory/tasks",
                    "/api/memory/stats"
                ]}
                
        except Exception as e:
            response = {"status": "error", "message": str(e)}
        finally:
            conn.close()
        
        self.wfile.write(json.dumps(response, indent=2, default=str).encode())
    
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode()
        
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        try:
            if path == '/api/memory/tasks':
                title = data.get('title')
                description = data.get('description', '')
                priority = data.get('priority', 3)
                if title:
                    cursor.execute(
                        "INSERT INTO tasks (title, description, priority, status) VALUES (?, ?, ?, 'pending')",
                        (title, description, priority)
                    )
                    conn.commit()
                    response = {"status": "ok", "message": "Task created", "id": cursor.lastrowid}
                else:
                    response = {"status": "error", "message": "Title required"}
                    
            elif path == '/api/memory/learnings':
                content = data.get('content')
                category = data.get('category', 'general')
                importance = data.get('importance', 5)
                if content:
                    cursor.execute(
                        "INSERT INTO learnings (content, category, importance) VALUES (?, ?, ?)",
                        (content, category, importance)
                    )
                    conn.commit()
                    response = {"status": "ok", "message": "Learning saved", "id": cursor.lastrowid}
                else:
                    response = {"status": "error", "message": "Content required"}
            else:
                response = {"status": "error", "message": "Unknown endpoint"}
                
        except Exception as e:
            response = {"status": "error", "message": str(e)}
        finally:
            conn.close()
        
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def log_message(self, format, *args):
        # Silenciar logs
        pass

if __name__ == '__main__':
    PORT = 4444
    server = HTTPServer(('0.0.0.0', PORT), MemoryAPIHandler)
    print(f"🧠 Memory API running on port {PORT}")
    server.serve_forever()
