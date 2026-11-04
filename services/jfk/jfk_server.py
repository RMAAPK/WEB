#!/usr/bin/env python3
"""
JFK (Jellyfin Fabric Kernel) - High Performance Media Streaming Router
Zero-RAM, Zero-Egress Streaming Fabric for S3 (Cloudflare R2) and IPFS Shards.
Part of RMAA Core Server Infrastructure (https://rmaa.pk).
"""

import os
import sys
import json
import urllib.parse
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver

try:
    import boto3
    from botocore.config import Config
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

PORT = int(os.environ.get("JFK_PORT", "8098"))
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "d547e9e8f4676375248a3b8d82e3f752")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT", f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "6df8fd748144a9466378955c04525965")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "bd3b4c8beea28d3f04ac47ccfc6d50de34dd9be1a0d754e19807e2dd1a9bd1db")
R2_BUCKET = os.environ.get("R2_BUCKET_NAME", "jfk-bkt")

IPFS_GATEWAYS = [
    "https://dweb.link/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/"
]

s3_client = None
if HAS_BOTO3 and R2_ACCESS_KEY and R2_SECRET_KEY:
    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name='auto',
            config=Config(signature_version='s3v4')
        )
    except Exception as e:
        print(f"[JFK] Failed to initialize S3 client: {e}", file=sys.stderr)

class ThreadingSimpleServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True

class JFKHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Concise access log
        sys.stdout.write(f"[JFK] {self.address_string()} - {format%args}\n")
        sys.stdout.flush()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Healthcheck
        if path in ("/healthz", "/jfk/healthz"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "JFK Streaming Router",
                "r2_bucket": R2_BUCKET,
                "has_s3": s3_client is not None
            }).encode())
            return

        # S3 / R2 Stream Redirect (302 Found)
        if path in ("/stream/r2", "/jfk/stream/r2"):
            key = query.get("key", [""])[0]
            bucket = query.get("bucket", [R2_BUCKET])[0]
            if not key:
                self.send_error(400, "Missing 'key' parameter")
                return

            if not s3_client:
                self.send_error(503, "S3 client not initialized")
                return

            try:
                # Generate 6-hour pre-signed direct URL
                presigned_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': key},
                    ExpiresIn=21600
                )
                self.send_response(302)
                self.send_header("Location", presigned_url)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                return
            except Exception as e:
                self.send_error(500, f"Error generating presigned URL: {e}")
                return

        # IPFS Stream Redirect (302 Found)
        if path in ("/stream/ipfs", "/jfk/stream/ipfs"):
            cid = query.get("cid", [""])[0]
            filename = query.get("filename", [""])[0]
            if not cid:
                self.send_error(400, "Missing 'cid' parameter")
                return

            # Primary gateway with fast redirect
            target_url = f"{IPFS_GATEWAYS[0]}{cid}"
            if filename:
                target_url += f"/{urllib.parse.quote(filename)}"

            self.send_response(302)
            self.send_header("Location", target_url)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            return

        # Probe byte-range passthrough (for ffprobe scanning if 302 not followed)
        if path in ("/probe/r2", "/jfk/probe/r2"):
            key = query.get("key", [""])[0]
            bucket = query.get("bucket", [R2_BUCKET])[0]
            range_hdr = self.headers.get("Range", "bytes=0-2097151") # Default 2MB header probe

            if not s3_client or not key:
                self.send_error(400, "Invalid probe parameters")
                return

            try:
                presigned_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': key},
                    ExpiresIn=1800
                )
                req = urllib.request.Request(presigned_url, headers={"Range": range_hdr})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    self.send_response(resp.status)
                    for h in ["Content-Range", "Content-Length", "Content-Type", "Accept-Ranges"]:
                        val = resp.headers.get(h)
                        if val: self.send_header(h, val)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(resp.read())
                return
            except Exception as e:
                self.send_error(500, f"Probe error: {e}")
                return

        # Library Manifest & Sync Generator
        if path in ("/sync/strm", "/jfk/sync/strm"):
            target_dir = query.get("target_dir", ["/data/jellyfin/media"])[0]
            base_url = query.get("base_url", ["http://127.0.0.1:10000/jfk"])[0]

            if not s3_client:
                self.send_error(503, "S3 client not initialized")
                return

            try:
                res = s3_client.list_objects_v2(Bucket=R2_BUCKET)
                items = res.get('Contents', [])
                generated = []

                for obj in items:
                    key = obj['Key']
                    if any(key.lower().endswith(ext) for ext in ['.mp4', '.mkv', '.avi', '.webm', '.mov']):
                        # Build standard movie folder structure
                        clean_name = os.path.splitext(os.path.basename(key))[0]
                        movie_dir = os.path.join(target_dir, clean_name)
                        os.makedirs(movie_dir, exist_ok=True)
                        strm_path = os.path.join(movie_dir, f"{clean_name}.strm")

                        # The STRM content points directly to JFK router
                        strm_content = f"{base_url}/stream/r2?key={urllib.parse.quote(key)}"
                        with open(strm_path, "w", encoding="utf-8") as f:
                            f.write(strm_content)

                        generated.append({
                            "key": key,
                            "strm": strm_path,
                            "stream_url": strm_content,
                            "size_bytes": obj['Size']
                        })

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "total_synced": len(generated),
                    "items": generated
                }, indent=2).encode())
                return
            except Exception as e:
                self.send_error(500, f"Sync error: {e}")
                return

        self.send_error(404, "Endpoint not found")

def main():
    print(f"=== [JFK Media Streaming Fabric] Listening on port {PORT} ===")
    print(f"[*] R2 Endpoint: {R2_ENDPOINT} | Bucket: {R2_BUCKET}")
    server = ThreadingSimpleServer(("0.0.0.0", PORT), JFKHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[JFK] Shutting down...")
        server.server_close()

if __name__ == "__main__":
    main()
