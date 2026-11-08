# WA-DB: Dual WhatsApp Archiving, Anti-Delete & Sentinel Daemon

High-performance, fault-tolerant WhatsApp archiving sentinel built with Node.js and Baileys. Designed for 24/7 continuous deployment on **Render Free Tier** paired with **Supabase PostgreSQL & S3-compatible Storage**.

---

## ⚡ Core Features

* **Dual-Account Concurrent Monitoring**: Simultaneously runs both **Personal** (`+92 330 9246239`) and **Business** (`+92 344 0708494`) in isolated PostgreSQL schemas (`personal.*` and `business.*`).
* **Anti-Delete Ledger**: Intercepts WhatsApp `protocolMessage REVOKE` (Delete for Everyone) packets in real-time. Marks `is_deleted = true` and `deleted_at = NOW()`, preserving all original messages, text, and metadata permanently in PostgreSQL.
* **View-Once Media Vault**: Automatically detects View-Once photos, videos, and voice notes. Extracts and uploads them to Supabase Storage (`wa-vault`) and saves persistent public URLs.
* **Automated Call Cutter**: Detects incoming voice/video calls in under 50ms, rejects them (`sock.rejectCall()`), sends an instant cold reply (*"Plz Refrain To Msges Only"*), and logs caller metadata into `rejected_calls`.
* **Render Free Tier 15-Minute Timeout Bypass**: Built-in 14-minute recursive self-ping sentinel (`GET /ping`) prevents Render idle shutdowns.
* **Stateless Docker Container**: Restores authentication credentials seamlessly on ephemeral cloud containers via Base64 environment variables (`WA_AUTH_PERSONAL_B64` & `WA_AUTH_BUSINESS_B64`).

---

## 🏗️ Architecture

```
                   ┌────────────────────────────────────────┐
                   │         Render Web Service (Docker)    │
                   │                                        │
                   │   Boot: Unpack Base64 Auth to /tmp     │
                   │   Keep-Alive: 14-min self-ping cron    │
                   │   HTTP Server: /health & /metrics      │
                   └───────────────┬────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌───────────────────────┐               ┌────────────────────────┐
   │  Personal Sentinel    │               │   Business Sentinel    │
   │  (+92 330 9246239)    │               │   (+92 344 0708494)    │
   ├───────────────────────┤               ├────────────────────────┤
   │ • Anti-Delete Ledger  │               │ • Anti-Delete Ledger   │
   │ • View-Once Vault     │               │ • View-Once Vault      │
   │ • Auto Call Cutter    │               │ • Auto Call Cutter     │
   └──────────┬────────────┘               └───────────┬────────────┘
              │                                        │
              ▼                                        ▼
    Supabase (personal.*)                    Supabase (business.*)
     ├── messages                             ├── messages
     ├── rejected_calls                       ├── rejected_calls
     ├── auth_sessions (live backup)          ├── auth_sessions (live backup)
     └── Storage: wa-vault/personal/          └── Storage: wa-vault/business/
```

---

## 🚀 Deployment to Render (1-Click Docker)

1. Fork or push this repository to GitHub: `https://github.com/thealidev/WADB.git`.
2. In [Render Dashboard](https://dashboard.render.com):
   * Click **New +** $\rightarrow$ **Web Service**.
   * Connect your `WADB` repository.
   * Select **Docker** as runtime.
3. Configure the following **Environment Variables** in Render:
   * `DATABASE_URL`: `postgresql://postgres.osmcdstlwakpwuiksurr:fhk8M9fvgVhj3VGd@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require`
   * `SUPABASE_URL`: `https://osmcdstlwakpwuiksurr.supabase.co`
   * `SUPABASE_SERVICE_ROLE_KEY`: *(Your Supabase Service Role Key)*
   * `SUPABASE_STORAGE_BUCKET`: `wa-vault`
   * `CALL_REJECT_MESSAGE`: `Plz Refrain To Msges Only`
   * `AUTO_PING_INTERVAL_MINUTES`: `14`
   * `RENDER_EXTERNAL_URL`: `https://<YOUR-RENDER-APP-NAME>.onrender.com`
   * `WA_AUTH_PERSONAL_B64`: *(Contents of `/tmp/personal_b64.txt`)*
   * `WA_AUTH_BUSINESS_B64`: *(Contents of `/tmp/business_b64.txt`)*
4. Click **Create Web Service**.

---

## 🔍 Health & Metrics Dashboard

Send a GET request to your deployed URL or `http://localhost:3000/`:

```json
{
  "name": "WA-DB Sentinel Service",
  "uptime": "12h 45m 10s",
  "uptimeSeconds": 45910,
  "database": "connected",
  "accounts": {
    "personal": {
      "status": "connected",
      "jid": "923309246239:10@s.whatsapp.net",
      "name": "Just Wonhee Fan",
      "stats": {
        "messagesLogged": 142,
        "callsRejected": 3
      }
    },
    "business": {
      "status": "connected",
      "jid": "923440708494:1@s.whatsapp.net",
      "name": "RMAA Holdings",
      "stats": {
        "messagesLogged": 89,
        "callsRejected": 12
      }
    }
  }
}
```

