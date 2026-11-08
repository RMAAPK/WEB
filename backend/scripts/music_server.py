"""
RMAA MusicAI Microservice & Streaming Audio Engine.
Serves:
1. /music/api/status - Engine health & codebook status
2. /music/api/catalog - Tracks catalog from music.tracks
3. /music/api/codebooks - Discrete harmonic codebooks
4. /music/api/graft - Real-time Acoustic-RAG spectral post-processing
"""

import os
import json
import sqlite3
import numpy as np
import psycopg2
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

PORT = int(os.getenv("MUSIC_PORT", "9090"))
DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_db():
    if not DATABASE_URL:
        db_user = os.getenv("GTS_DB_USER", "postgres.qcgumwmldtlcykmcxqjz")
        db_pass = os.getenv("GTS_DB_PASSWORD", "ZgBEOFGDZM1oYGtZ")
        db_host = os.getenv("GTS_DB_ADDRESS", "aws-0-ap-southeast-1.pooler.supabase.com")
        db_port = os.getenv("GTS_DB_PORT", "5432")
        db_name = os.getenv("GTS_DB_DATABASE", "postgres")
        return psycopg2.connect(f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?sslmode=disable")
    return psycopg2.connect(DATABASE_URL)

class MusicHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/music/api/status", "/music/status", "/status"]:
            self._send_json(200, {
                "service": "RMAA MusicAI Engine",
                "label": "RMAA Records (AI K-Pop Division)",
                "doi": "10.5281/zenodo.23859117",
                "license": "BSL-1.1",
                "sampling_rate": 40000,
                "nyquist_hz": 20000,
                "linear_bins": 2000,
                "cyclic_states": 1500,
                "status": "online"
            })
            return

        if path in ["/music/api/catalog", "/music/catalog"]:
            try:
                conn = get_db()
                cur = conn.cursor()
                cur.execute("""
                    SELECT id, title, artist, genre, bpm, musical_key, duration_seconds, master_audio_url, stream_count, billboard_rank 
                    FROM music.tracks 
                    ORDER BY stream_count DESC, created_at DESC;
                """)
                rows = cur.fetchall()
                conn.close()
                tracks = []
                for r in rows:
                    tracks.append({
                        "id": r[0], "title": r[1], "artist": r[2], "genre": r[3],
                        "bpm": r[4], "key": r[5], "duration": r[6], "url": r[7],
                        "streams": r[8], "billboard_rank": r[9]
                    })
                self._send_json(200, {"tracks": tracks, "total": len(tracks)})
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return

        if path in ["/music/api/codebooks", "/music/codebooks"]:
            try:
                conn = get_db()
                cur = conn.cursor()
                cur.execute("SELECT category_id, name, description, linear_bins, cyclic_states FROM music.codebooks ORDER BY category_id;")
                rows = cur.fetchall()
                conn.close()
                codebooks = [{"category_id": r[0], "name": r[1], "description": r[2], "bins": r[3], "states": r[4]} for r in rows]
                self._send_json(200, {"codebooks": codebooks})
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return

        self._send_json(404, {"error": "Not Found"})

def run_server():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, MusicHandler)
    print(f"[MusicAI] Service running on http://127.0.0.1:{PORT}...")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
