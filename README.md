# RMAA Core Server (`s.rmaa.pk`)

Unified, ultra-lightweight private federated communication node for **RMAA HOLDINGS**.

---

## ⚡ Infrastructure & Services Architecture

```mermaid
graph TD
    User["Web Browser Visitor"] -->|HTTP /| Gateway["RMAA Go Gateway (:10000)"]
    Gateway -->|"403 Forbidden"| Finger["Cyberpunk 'Wrong Neighborhood' Page"]

    MatrixUser["Matrix Client (Element / FluffyChat)"] -->|"/_matrix/*"| Gateway
    Gateway -->|"Reverse Proxy"| Conduwuit["Matrix Conduwuit (:6167)"]

    MastoUser["Mastodon / Fediverse Client (Mona / Elk / Tusky)"] -->|"/api/v1/*, /.well-known/webfinger"| Gateway
    Gateway -->|"Reverse Proxy"| GTS["GoToSocial Daemon (:8080)"]

    Conduwuit -->|Sync| HF["Hugging Face Private Dataset (rmaaserver/storagepool)"]
    GTS -->|Postgres Session Pooler :5432| Supabase["Supabase Cloud Postgres"]
    GTS -->|Storage Media| S3["Supabase Storage Buckets (media, vault)"]
```

---

## 🚀 Live Verified Endpoints

- **Domain:** `https://s.rmaa.pk`
- **Matrix Homeserver:** `s.rmaa.pk`
  - Client API: `https://s.rmaa.pk/_matrix/client/versions`
  - User: `@thealidev:s.rmaa.pk`
- **Mastodon / ActivityPub:**
  - Instance API: `https://s.rmaa.pk/api/v1/instance`
  - Webfinger Discovery: `https://s.rmaa.pk/.well-known/webfinger?resource=acct:thealidev@s.rmaa.pk`
  - Fediverse Handle: `@thealidev@s.rmaa.pk`
- **Landing Page:** Returns `403 Forbidden` with the ASCII cyberpunk warning page.
- **Keepalive Heartbeat:** `https://s.rmaa.pk/healthz` (Self-pinging every 10–13.5 min).

---

## 🔐 Credentials & Secrets Reference

- **Admin Account:** `thealidev`
- **Admin Email:** `server@rmaa.pk`
- **Database:** Supabase Postgres Session Pooler (`aws-0-ap-southeast-1.pooler.supabase.com:5432`)
- **Storage:** Hugging Face Private Vault (`rmaaserver/storagepool`) + Supabase S3 Storage (`media`, `vault`)
- **Matrix Recovery Key:** `EsTW WoQZ gdLw SCxn EUmt G7Y8 HESL DTw8 cscB 5pvk qGQL CMf3`
