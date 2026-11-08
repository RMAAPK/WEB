package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"
)

// RMAA Server Unified Micro-Gateway
// Hosts:
// 1. Matrix Homeserver (Conduit / Conduwuit) on localhost:6167
// 2. Mastodon / ActivityPub (GoToSocial) on localhost:8080
// 3. MusicAI Engine on localhost:9090
// 4. WA-DB Sentinel on localhost:3000
// 5. Official RMAA Holdings Production Website & Web SPA (static/)

const (
	defaultPort         = "10000"
	defaultMatrixURL    = "http://127.0.0.1:6167"
	defaultFediverseURL = "http://127.0.0.1:8080"
	defaultMusicURL     = "http://127.0.0.1:9090"
	defaultWadbURL      = "http://127.0.0.1:3000"
	defaultLocaljitURL  = "http://127.0.0.1:7470"
	defaultDmcpsURL     = "http://127.0.0.1:8000"
	defaultUpaasURL     = "http://127.0.0.1:9100"
	domainName          = "rmaa.pk"
)

var (
	matrixProxy    *httputil.ReverseProxy
	fediverseProxy *httputil.ReverseProxy
	musicProxy     *httputil.ReverseProxy
	wadbProxy      *httputil.ReverseProxy
	localjitProxy  *httputil.ReverseProxy
	dmcpsProxy     *httputil.ReverseProxy
	upaasProxy     *httputil.ReverseProxy
	staticFS       http.Handler
)

func init() {
	staticFS = http.FileServer(http.Dir("static"))

	matrixTarget, _ := url.Parse(getEnv("MATRIX_UPSTREAM_URL", defaultMatrixURL))
	matrixProxy = httputil.NewSingleHostReverseProxy(matrixTarget)

	fediverseTarget, _ := url.Parse(getEnv("FEDIVERSE_UPSTREAM_URL", defaultFediverseURL))
	fediverseProxy = httputil.NewSingleHostReverseProxy(fediverseTarget)

	musicTarget, _ := url.Parse(getEnv("MUSIC_UPSTREAM_URL", defaultMusicURL))
	musicProxy = httputil.NewSingleHostReverseProxy(musicTarget)

	wadbTarget, _ := url.Parse(getEnv("WADB_UPSTREAM_URL", defaultWadbURL))
	wadbProxy = httputil.NewSingleHostReverseProxy(wadbTarget)

	localjitTarget, _ := url.Parse(getEnv("LOCALJIT_UPSTREAM_URL", defaultLocaljitURL))
	localjitProxy = httputil.NewSingleHostReverseProxy(localjitTarget)

	dmcpsTarget, _ := url.Parse(getEnv("DMCPS_UPSTREAM_URL", defaultDmcpsURL))
	dmcpsProxy = httputil.NewSingleHostReverseProxy(dmcpsTarget)

	upaasTarget, _ := url.Parse(getEnv("UPAAS_UPSTREAM_URL", defaultUpaasURL))
	upaasProxy = httputil.NewSingleHostReverseProxy(upaasTarget)
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// Well-known Matrix server discovery
func handleMatrixServerWellKnown(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	fmt.Fprintf(w, `{"m.server": "%s:443"}`, domainName)
}

// Well-known Matrix client discovery
func handleMatrixClientWellKnown(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	fmt.Fprintf(w, `{"m.homeserver": {"base_url": "https://%s"}}`, domainName)
}

func routerHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	acceptHeader := strings.ToLower(r.Header.Get("Accept"))

	// 1. Matrix Well-Known Discovery Endpoints
	if path == "/.well-known/matrix/server" {
		handleMatrixServerWellKnown(w, r)
		return
	}
	if path == "/.well-known/matrix/client" {
		handleMatrixClientWellKnown(w, r)
		return
	}

	// 2. Health check endpoint for Render keepalive
	if path == "/healthz" || path == "/ping" {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("RMAA_SERVER_OK"))
		return
	}

	// Internal diagnostic logs endpoint (protected)
	if path == "/debugz" {
		w.Header().Set("Content-Type", "text/plain")
		out, _ := os.ReadFile("/tmp/gts.log")
		w.Write([]byte("=== GOTOSOCIAL LOGS ===\n"))
		w.Write(out)
		matrixOut, _ := os.ReadFile("/tmp/matrix.log")
		w.Write([]byte("\n=== MATRIX LOGS ===\n"))
		w.Write(matrixOut)
		wadbOut, _ := os.ReadFile("/tmp/wadb.log")
		w.Write([]byte("\n=== WADB LOGS ===\n"))
		w.Write(wadbOut)
		return
	}

	// 3. Matrix Protocol Traffic: /_matrix/*
	if strings.HasPrefix(path, "/_matrix/") {
		r.Host = "127.0.0.1:6167"
		matrixProxy.ServeHTTP(w, r)
		return
	}

	// 4. MusicAI Engine Traffic: /music/*
	if strings.HasPrefix(path, "/music/") || path == "/music" {
		r.Host = "127.0.0.1:9090"
		musicProxy.ServeHTTP(w, r)
		return
	}

	// 5. WA-DB Sentinel Traffic: /wadb/* or /wa/*
	if strings.HasPrefix(path, "/wadb") || strings.HasPrefix(path, "/wa") {
		r.URL.Path = strings.TrimPrefix(path, "/wadb")
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/wa")
		if r.URL.Path == "" {
			r.URL.Path = "/"
		}
		r.Host = "127.0.0.1:3000"
		wadbProxy.ServeHTTP(w, r)
		return
	}

	// 6. Local-JIT Zero-Knowledge Vault: /localjit/* or /jit/*
	if strings.HasPrefix(path, "/localjit") || strings.HasPrefix(path, "/jit") {
		r.URL.Path = strings.TrimPrefix(path, "/localjit")
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/jit")
		if r.URL.Path == "" {
			r.URL.Path = "/health"
		}
		r.Host = "127.0.0.1:7470"
		localjitProxy.ServeHTTP(w, r)
		return
	}

	// 7. DMCPS Secured Model Context Protocol: /mcp/* or /dmcps/*
	if strings.HasPrefix(path, "/mcp") || strings.HasPrefix(path, "/dmcps") {
		r.URL.Path = strings.TrimPrefix(path, "/mcp")
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/dmcps")
		if r.URL.Path == "" {
			r.URL.Path = "/"
		}
		r.Host = "127.0.0.1:8000"
		dmcpsProxy.ServeHTTP(w, r)
		return
	}

	// 8. UPAAS Pipeline Engine: /upaas/*
	if strings.HasPrefix(path, "/upaas") {
		r.URL.Path = strings.TrimPrefix(path, "/upaas")
		if r.URL.Path == "" {
			r.URL.Path = "/"
		}
		r.Host = "127.0.0.1:9100"
		upaasProxy.ServeHTTP(w, r)
		return
	}

	// 9. Dedicated Sub-Pages: /forge, /alicnc, /fargolore
	if path == "/forge" || path == "/forge/" {
		http.ServeFile(w, r, "static/forge/index.html")
		return
	}
	if path == "/alicnc" || path == "/alicnc/" {
		http.ServeFile(w, r, "static/alicnc/index.html")
		return
	}
	if path == "/fargolore" || path == "/fargolore/" {
		http.ServeFile(w, r, "static/fargolore/index.html")
		return
	}

	// 7. Production Website Static Assets (Checked before Fediverse to serve frontend assets cleanly)
	cleanPath := strings.TrimPrefix(path, "/")
	if cleanPath != "" {
		if fi, err := os.Stat("static/" + cleanPath); err == nil && !fi.IsDir() {
			staticFS.ServeHTTP(w, r)
			return
		}
	}

	// 7. Fediverse / Mastodon Protocol Traffic
	isActivityPub := strings.Contains(acceptHeader, "application/activity+json") ||
		strings.Contains(acceptHeader, "application/ld+json") ||
		strings.Contains(acceptHeader, "application/json")

	isFediverseRoute := strings.HasPrefix(path, "/.well-known/webfinger") ||
		strings.HasPrefix(path, "/.well-known/host-meta") ||
		strings.HasPrefix(path, "/.well-known/nodeinfo") ||
		strings.HasPrefix(path, "/nodeinfo/") ||
		strings.HasPrefix(path, "/api/v1/") ||
		strings.HasPrefix(path, "/api/v2/") ||
		strings.HasPrefix(path, "/oauth/") ||
		strings.HasPrefix(path, "/auth/") ||
		strings.HasPrefix(path, "/users/") ||
		strings.HasPrefix(path, "/inbox") ||
		strings.HasPrefix(path, "/outbox")

	if isFediverseRoute || (isActivityPub && path != "/") {
		r.Host = "s.rmaa.pk"
		fediverseProxy.ServeHTTP(w, r)
		return
	}

	// 8. Serve index.html for root and SPA client-side routes
	http.ServeFile(w, r, "static/index.html")
}

func main() {
	port := getEnv("PORT", defaultPort)
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      http.HandlerFunc(routerHandler),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("[RMAA Core Server] Gateway listening on port %s for domain %s\n", port, domainName)

	go startSelfPingLoop()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}

func startSelfPingLoop() {
	publicURL := getEnv("PUBLIC_PING_URL", "https://s.rmaa.pk/healthz")
	backupURL := "https://rmaa-server.onrender.com/healthz"
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	for {
		jitterSeconds := 600 + (time.Now().UnixNano() % 210)
		sleepDuration := time.Duration(jitterSeconds) * time.Second
		time.Sleep(sleepDuration)

		log.Printf("[KeepAlive] Self-pinging public endpoints (interval: %v)...", sleepDuration)

		req, err := http.NewRequest("GET", publicURL, nil)
		if err == nil {
			req.Header.Set("User-Agent", "RMAA-Internal-KeepAlive/1.0")
			resp, err := client.Do(req)
			if err == nil {
				resp.Body.Close()
				continue
			}
		}

		reqBackup, err := http.NewRequest("GET", backupURL, nil)
		if err == nil {
			reqBackup.Header.Set("User-Agent", "RMAA-Internal-KeepAlive/1.0")
			resp, err := client.Do(reqBackup)
			if err == nil {
				resp.Body.Close()
			}
		}
	}
}
