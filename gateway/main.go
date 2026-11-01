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
// 3. Middle Finger Landing Page for browser visitors on "/" and non-protocol routes

const (
	defaultPort       = "10000"
	defaultMatrixURL  = "http://127.0.0.1:6167"
	defaultFediverseURL = "http://127.0.0.1:8080"
	domainName        = "s.rmaa.pk"
)

var (
	matrixProxy    *httputil.ReverseProxy
	fediverseProxy *httputil.ReverseProxy
	landingPageHTML []byte
)

func init() {
	var err error
	landingPageHTML, err = os.ReadFile("static/index.html")
	if err != nil {
		landingPageHTML = []byte("<h1>403 Forbidden - s.rmaa.pk</h1>")
	}

	matrixTarget, _ := url.Parse(getEnv("MATRIX_UPSTREAM_URL", defaultMatrixURL))
	matrixProxy = httputil.NewSingleHostReverseProxy(matrixTarget)

	fediverseTarget, _ := url.Parse(getEnv("FEDIVERSE_UPSTREAM_URL", defaultFediverseURL))
	fediverseProxy = httputil.NewSingleHostReverseProxy(fediverseTarget)
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

// Router determines whether incoming request is:
// - Browser visit (Show middle finger landing page)
// - Matrix protocol request (Route to Conduit)
// - Mastodon / ActivityPub federation request (Route to GoToSocial)
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

	// 3. Matrix Protocol Traffic: /_matrix/*
	if strings.HasPrefix(path, "/_matrix/") {
		r.Host = "127.0.0.1:6167"
		matrixProxy.ServeHTTP(w, r)
		return
	}

	// 4. Fediverse / Mastodon Protocol Traffic:
	// - Webfinger (discovery for user@s.rmaa.pk)
	// - ActivityPub json endpoints (application/activity+json, application/ld+json)
	// - Mastodon Client API (/api/v1/*, /api/v2/*, /oauth/*)
	// - Inboxes & Outboxes (/users/*/inbox, /users/*/outbox)
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
		strings.HasPrefix(path, "/users/") ||
		strings.HasPrefix(path, "/inbox") ||
		strings.HasPrefix(path, "/outbox")

	if isFediverseRoute || (isActivityPub && path != "/") {
		r.Host = domainName
		fediverseProxy.ServeHTTP(w, r)
		return
	}

	// 5. Default: Any normal browser visitor hitting the root or unrecognized page
	// gets the Middle Finger page
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusForbidden)
	w.Write(landingPageHTML)
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

	// Launch background self-ping loop every 10-14 minutes
	go startSelfPingLoop()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}

// startSelfPingLoop periodically sends an HTTP GET request to the public domain (s.rmaa.pk / rmaa-server.onrender.com)
// every 10 to 14 minutes with randomized jitter to prevent Render Free tier inactivity sleep.
func startSelfPingLoop() {
	publicURL := getEnv("PUBLIC_PING_URL", "https://s.rmaa.pk/healthz")
	backupURL := "https://rmaa-server.onrender.com/healthz"
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	for {
		// Interval between 10m (600s) and 13.5m (810s)
		jitterSeconds := 600 + (time.Now().UnixNano() % 210)
		sleepDuration := time.Duration(jitterSeconds) * time.Second
		time.Sleep(sleepDuration)

		log.Printf("[KeepAlive] Self-pinging public endpoints to keep Render container warm (interval: %v)...", sleepDuration)

		// 1. Ping primary custom domain
		req, err := http.NewRequest("GET", publicURL, nil)
		if err == nil {
			req.Header.Set("User-Agent", "RMAA-Internal-KeepAlive/1.0")
			resp, err := client.Do(req)
			if err == nil {
				resp.Body.Close()
				log.Printf("[KeepAlive] %s responded: %s", publicURL, resp.Status)
				continue
			} else {
				log.Printf("[KeepAlive] Warning: Failed to ping %s: %v", publicURL, err)
			}
		}

		// 2. Fallback to render origin domain if custom domain is unreachable
		reqBackup, err := http.NewRequest("GET", backupURL, nil)
		if err == nil {
			reqBackup.Header.Set("User-Agent", "RMAA-Internal-KeepAlive/1.0")
			resp, err := client.Do(reqBackup)
			if err == nil {
				resp.Body.Close()
				log.Printf("[KeepAlive] Fallback %s responded: %s", backupURL, resp.Status)
			}
		}
	}
}

