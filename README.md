# RMAA Core Server (`s.rmaa.pk`)
### Decentralized Mastodon & Matrix Dual-Homeserver • Zero-Cost Cloud Deployment
Maintained by **RMAA HOLDINGS** • Private Core Repository

---

## 🏛️ High-Level Overview

`s.rmaa.pk` is the private backbone server powering federated identity, decentralized communications, and secure telemetry synchronization for **RMAA HOLDINGS**:

1. **Matrix Homeserver (Conduit - Rust):**
   - High-throughput, ultra-low memory footprint ($\approx 30\text{ MB RAM}$).
   - End-to-end encrypted messaging, bot integration, and secure machine room coordination.
2. **Mastodon & Fediverse Engine (GoToSocial - Go):**
   - Lightweight ActivityPub federation daemon ($\approx 50\text{ MB RAM}$).
   - Compatible with standard Mastodon apps (Elk, Mona, Ivory, Phanpy, Tusky).
3. **Unified Micro-Gateway (Go):**
   - Dispatches traffic over a single port (`PORT: 10000`).
   - Routes `/_matrix/*` to Conduit and ActivityPub / Mastodon API routes to GoToSocial.
   - Any web browser visiting `s.rmaa.pk` receives the **403 Forbidden Middle Finger Landing Page**.
4. **100% Free Persistent Storage:**
   - **Supabase Postgres:** Direct message relational state and user records.
   - **Hugging Face Private Vault / IPFS:** Automated hourly state snapshots and decentralized attachment offloading. Render disk remains 100% ephemeral and clean.
5. **Anti-Sleep GitHub Actions Daemon:**
   - Continuous 10-minute ping against `/healthz` guaranteeing 24/7 uptime without Render sleeping.

---

## 🚀 Environment Variables (Render Dashboard)

| Variable | Description |
|---|---|
| `PORT` | Public port (Default: `10000`) |
| `GTS_DB_ADDRESS` | Supabase Postgres URI (`postgres://postgres:password@db.xxx.supabase.co:5432/postgres`) |
| `HF_TOKEN` | Hugging Face Read/Write Token for state snapshot backup |
| `HF_BACKUP_REPO` | `rmaapk/rmaa-server-vault` (Private Dataset) |

---

## 🌐 Custom Domain Routing (`s.rmaa.pk`)

In your Cloudflare / DNS provider:
- **CNAME Record:** `s.rmaa.pk` $\to$ `<your-render-subdomain>.onrender.com`
- Set SSL/TLS mode to **Full / Strict**.
