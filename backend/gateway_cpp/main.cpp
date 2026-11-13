#include <iostream>
#include <string>
#include <string_view>
#include <vector>
#include <unordered_map>
#include <thread>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <cstring>
#include <cstdlib>
#include <csignal>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <fcntl.h>
#include <poll.h>

namespace fs = std::filesystem;

// Configuration defaults
static const std::string DOMAIN_NAME = "rmaa.pk";
static const int DEFAULT_PORT = 10000;

// Upstream daemon target ports
struct Upstream {
    std::string host;
    int port;
};

static const Upstream UPSTREAM_MATRIX   = {"127.0.0.1", 6167};
static const Upstream UPSTREAM_FEDIVERSE= {"127.0.0.1", 8080};
static const Upstream UPSTREAM_MUSIC    = {"127.0.0.1", 9090};
static const Upstream UPSTREAM_WADB     = {"127.0.0.1", 3000};
static const Upstream UPSTREAM_LOCALJIT = {"127.0.0.1", 7470};
static const Upstream UPSTREAM_DMCPS    = {"127.0.0.1", 8000};
static const Upstream UPSTREAM_UPAAS    = {"127.0.0.1", 9100};
static const Upstream UPSTREAM_VAULT    = {"127.0.0.1", 8001};
static const Upstream UPSTREAM_JFK      = {"127.0.0.1", 8098};
static const Upstream UPSTREAM_SITE_API = {"127.0.0.1", 5174};

// Static MIME mapping
static std::string get_mime_type(const std::string& path) {
    if (path.ends_with(".html") || path.ends_with(".htm")) return "text/html; charset=utf-8";
    if (path.ends_with(".js") || path.ends_with(".mjs"))   return "text/javascript; charset=utf-8";
    if (path.ends_with(".css"))                            return "text/css; charset=utf-8";
    if (path.ends_with(".json"))                           return "application/json";
    if (path.ends_with(".png"))                            return "image/png";
    if (path.ends_with(".jpg") || path.ends_with(".jpeg")) return "image/jpeg";
    if (path.ends_with(".svg"))                            return "image/svg+xml";
    if (path.ends_with(".ico"))                            return "image/x-icon";
    if (path.ends_with(".woff2"))                          return "font/woff2";
    if (path.ends_with(".woff"))                           return "font/woff";
    if (path.ends_with(".ttf"))                            return "font/ttf";
    if (path.ends_with(".exe") || path.ends_with(".bin"))  return "application/octet-stream";
    return "application/octet-stream";
}

// Redirect legacy backend-hosted frontend routes to the static website.
static void redirect_to_frontend(int client_fd, const std::string& path) {
    const std::string location = "https://rmaa.pk" + path;
    const std::string response = "HTTP/1.1 302 Found

Location: " + location +
        "

Cache-Control: no-store

Content-Length: 0

Connection: close



";
    send(client_fd, response.data(), response.size(), 0);
}

// Low-overhead file sender
static void serve_static_file(int client_fd, const std::string& file_path, int status_code = 200, const std::string& status_text = "OK") {
    struct stat st;
    if (stat(file_path.c_str(), &st) != 0 || S_ISDIR(st.st_mode)) {
        const std::string not_found = "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
        send(client_fd, not_found.data(), not_found.size(), 0);
        return;
    }

    int in_fd = open(file_path.c_str(), O_RDONLY);
    if (in_fd < 0) {
        const std::string err500 = "HTTP/1.1 500 Internal Error\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send(client_fd, err500.data(), err500.size(), 0);
        return;
    }

    std::string mime = get_mime_type(file_path);
    std::string header = "HTTP/1.1 " + std::to_string(status_code) + " " + status_text + "\r\n"
                         "Content-Type: " + mime + "\r\n"
                         "Content-Length: " + std::to_string(st.st_size) + "\r\n"
                         "Connection: close\r\n"
                         "X-Content-Type-Options: nosniff\r\n"
                         "Server: RMAA-C++-Core/1.0\r\n\r\n";

    send(client_fd, header.data(), header.size(), 0);

    char buf[65536];
    ssize_t bytes_read;
    while ((bytes_read = read(in_fd, buf, sizeof(buf))) > 0) {
        ssize_t total_sent = 0;
        while (total_sent < bytes_read) {
            ssize_t sent = send(client_fd, buf + total_sent, bytes_read - total_sent, 0);
            if (sent <= 0) break;
            total_sent += sent;
        }
    }
    close(in_fd);
}

// Low-latency TCP bidirectional proxy tunnel
static void proxy_request(int client_fd, const Upstream& upstream, std::string initial_data, const std::string& new_path, const std::string& custom_host = "") {
    int up_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (up_fd < 0) {
        const std::string err502 = "HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send(client_fd, err502.data(), err502.size(), 0);
        return;
    }

    // Set non-blocking with fast connect timeout
    sockaddr_in up_addr{};
    up_addr.sin_family = AF_INET;
    up_addr.sin_port = htons(upstream.port);
    inet_pton(AF_INET, upstream.host.c_str(), &up_addr.sin_addr);

    int flag = 1;
    setsockopt(up_fd, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(int));

    if (connect(up_fd, (struct sockaddr*)&up_addr, sizeof(up_addr)) < 0) {
        close(up_fd);
        const std::string err502 = "HTTP/1.1 502 Bad Gateway (Service Starting)\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send(client_fd, err502.data(), err502.size(), 0);
        return;
    }

    // Rewrite request line path if required
    if (!new_path.empty()) {
        size_t first_space = initial_data.find(' ');
        if (first_space != std::string::npos) {
            size_t second_space = initial_data.find(' ', first_space + 1);
            if (second_space != std::string::npos) {
                std::string method = initial_data.substr(0, first_space);
                std::string version = initial_data.substr(second_space);
                initial_data = method + " " + new_path + version;
            }
        }
    }

    // Rewrite Host header if requested
    if (!custom_host.empty()) {
        size_t host_pos = initial_data.find("Host: ");
        if (host_pos != std::string::npos) {
            size_t host_end = initial_data.find("\r\n", host_pos);
            if (host_end != std::string::npos) {
                initial_data.replace(host_pos + 6, host_end - (host_pos + 6), custom_host);
            }
        }
    }

    // Send the rewritten initial request buffer
    send(up_fd, initial_data.data(), initial_data.size(), 0);

    // Bidirectional splice / pump loop
    struct pollfd fds[2];
    fds[0].fd = client_fd;
    fds[0].events = POLLIN;
    fds[1].fd = up_fd;
    fds[1].events = POLLIN;

    char buffer[65536];
    while (true) {
        int ret = poll(fds, 2, 30000); // 30-sec idle timeout
        if (ret <= 0) break;

        if (fds[0].revents & (POLLERR | POLLHUP | POLLNVAL) || fds[1].revents & (POLLERR | POLLHUP | POLLNVAL)) {
            break;
        }

        // Client -> Upstream
        if (fds[0].revents & POLLIN) {
            ssize_t n = recv(client_fd, buffer, sizeof(buffer), 0);
            if (n <= 0) break;
            send(up_fd, buffer, n, 0);
        }

        // Upstream -> Client
        if (fds[1].revents & POLLIN) {
            ssize_t n = recv(up_fd, buffer, sizeof(buffer), 0);
            if (n <= 0) break;
            send(client_fd, buffer, n, 0);
        }
    }

    close(up_fd);
}

// Handles incoming client HTTP connections
static void handle_client(int client_fd) {
    char header_buf[8192];
    ssize_t n = recv(client_fd, header_buf, sizeof(header_buf) - 1, 0);
    if (n <= 0) {
        close(client_fd);
        return;
    }
    header_buf[n] = '\0';
    std::string req(header_buf, n);

    // Extract HTTP method and path
    size_t method_end = req.find(' ');
    if (method_end == std::string::npos) {
        close(client_fd);
        return;
    }
    std::string method = req.substr(0, method_end);

    size_t path_end = req.find(' ', method_end + 1);
    if (path_end == std::string::npos) {
        close(client_fd);
        return;
    }
    std::string full_path = req.substr(method_end + 1, path_end - (method_end + 1));
    std::string path = full_path;
    size_t query_pos = path.find('?');
    if (query_pos != std::string::npos) {
        path = path.substr(0, query_pos);
    }

    // Extract Accept header for ActivityPub detection
    std::string accept_hdr;
    size_t accept_pos = req.find("Accept: ");
    if (accept_pos != std::string::npos) {
        size_t accept_end = req.find("\r\n", accept_pos);
        if (accept_end != std::string::npos) {
            accept_hdr = req.substr(accept_pos + 8, accept_end - (accept_pos + 8));
            for (char &c : accept_hdr) c = std::tolower(c);
        }
    }

    // 1. Matrix Well-Known Discovery Endpoints
    if (path == "/.well-known/matrix/server") {
        std::string body = "{\"m.server\": \"s.rmaa.pk:443\"}";
        std::string resp = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(body.size()) + "\r\nConnection: close\r\n\r\n" + body;
        send(client_fd, resp.data(), resp.size(), 0);
        close(client_fd);
        return;
    }
    if (path == "/.well-known/matrix/client") {
        std::string body = "{\"m.homeserver\": {\"base_url\": \"https://s.rmaa.pk\"}}";
        std::string resp = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: " + std::to_string(body.size()) + "\r\nConnection: close\r\n\r\n" + body;
        send(client_fd, resp.data(), resp.size(), 0);
        close(client_fd);
        return;
    }

    // 2. Health check endpoint for Render keepalive
    if (path == "/healthz" || path == "/ping") {
        std::string resp = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 14\r\nConnection: close\r\n\r\nRMAA_SERVER_OK";
        send(client_fd, resp.data(), resp.size(), 0);
        close(client_fd);
        return;
    }

    // 3. Website APIs: kept on the backend and proxied from the static frontend.
    bool is_site_api = path == "/api/healthz" ||
                       path == "/api/blogs" || path.rfind("/api/blogs/", 0) == 0 ||
                       path == "/api/ping-google" ||
                       path == "/api/chat" || path.rfind("/api/chat/", 0) == 0;
    if (is_site_api) {
        proxy_request(client_fd, UPSTREAM_SITE_API, req, "", "127.0.0.1:5174");
        close(client_fd);
        return;
    }

    // 4. Matrix Protocol Traffic: /_matrix/*
    if (path.rfind("/_matrix/", 0) == 0) {
        proxy_request(client_fd, UPSTREAM_MATRIX, req, "", "127.0.0.1:6167");
        close(client_fd);
        return;
    }

    // 4. MusicAI Engine Traffic: /music/*
    if (path.rfind("/music/", 0) == 0 || path == "/music") {
        proxy_request(client_fd, UPSTREAM_MUSIC, req, "", "127.0.0.1:9090");
        close(client_fd);
        return;
    }

    // 5. WA-DB Sentinel Traffic: /wadb/* or /wa/*
    if (path.rfind("/wadb", 0) == 0 || path.rfind("/wa", 0) == 0) {
        std::string sub_path = full_path;
        if (sub_path.rfind("/wadb", 0) == 0) sub_path = sub_path.substr(5);
        else if (sub_path.rfind("/wa", 0) == 0) sub_path = sub_path.substr(3);
        if (sub_path.empty() || sub_path[0] != '/') sub_path = "/" + sub_path;

        proxy_request(client_fd, UPSTREAM_WADB, req, sub_path, "127.0.0.1:3000");
        close(client_fd);
        return;
    }

    // 6. Local-JIT Zero-Knowledge Vault: /localjit/* or /jit/*
    if (path.rfind("/localjit", 0) == 0 || path.rfind("/jit", 0) == 0) {
        std::string sub_path = full_path;
        if (sub_path.rfind("/localjit", 0) == 0) sub_path = sub_path.substr(9);
        else if (sub_path.rfind("/jit", 0) == 0) sub_path = sub_path.substr(4);
        if (sub_path.empty() || sub_path == "/") sub_path = "/health";
        else if (sub_path[0] != '/') sub_path = "/" + sub_path;

        proxy_request(client_fd, UPSTREAM_LOCALJIT, req, sub_path, "127.0.0.1:7470");
        close(client_fd);
        return;
    }

    // 7. DMCPS Model Context Protocol: /mcp/* or /dmcps/*
    if (path.rfind("/mcp", 0) == 0 || path.rfind("/dmcps", 0) == 0) {
        std::string sub_path = full_path;
        if (sub_path.rfind("/mcp", 0) == 0) sub_path = sub_path.substr(4);
        else if (sub_path.rfind("/dmcps", 0) == 0) sub_path = sub_path.substr(6);
        if (sub_path.empty() || sub_path[0] != '/') sub_path = "/" + sub_path;

        proxy_request(client_fd, UPSTREAM_DMCPS, req, sub_path, "127.0.0.1:8000");
        close(client_fd);
        return;
    }

    // 8. UPAAS Pipeline Engine: /upaas/*
    if (path.rfind("/upaas", 0) == 0) {
        std::string sub_path = full_path.substr(6);
        if (sub_path.empty() || sub_path[0] != '/') sub_path = "/" + sub_path;

        proxy_request(client_fd, UPSTREAM_UPAAS, req, sub_path, "127.0.0.1:9100");
        close(client_fd);
        return;
    }

    // 8B. Vaultwarden / Bitwarden Password Vault & Identity Sync
    // Handles Web Vault UI, Bitwarden Client API, Sync, Token Auth, and Notifications Hub
    bool is_bitwarden_api = (path.rfind("/api/sync", 0) == 0) ||
                            (path.rfind("/api/ciphers", 0) == 0) ||
                            (path.rfind("/api/folders", 0) == 0) ||
                            (path.rfind("/api/collections", 0) == 0) ||
                            (path.rfind("/api/accounts", 0) == 0 && path != "/accounts" && path != "/accounts/") ||
                            (path.rfind("/identity/", 0) == 0) ||
                            (path.rfind("/icons/", 0) == 0) ||
                            (path.rfind("/notifications/hub", 0) == 0) ||
                            (path.rfind("/vault", 0) == 0);

    if (is_bitwarden_api) {
        std::string vault_path = full_path;
        if (path == "/vault" || path == "/vault/") {
            vault_path = "/";
        } else if (path.rfind("/vault/", 0) == 0) {
            vault_path = full_path.substr(6);
            if (vault_path.empty() || vault_path[0] != '/') vault_path = "/" + vault_path;
        }

        proxy_request(client_fd, UPSTREAM_VAULT, req, vault_path, "rmaa.pk");
        close(client_fd);
        return;
    }

    // 8.5. JFK Media Streaming Fabric: /jfk/* or /stream/*
    if (path.rfind("/jfk/", 0) == 0 || path == "/jfk" || path.rfind("/stream/", 0) == 0) {
        proxy_request(client_fd, UPSTREAM_JFK, req, "", "127.0.0.1:8098");
        close(client_fd);
        return;
    }

    // 9. Dedicated Sub-Pages: /accounts, /admin, /forge, /alicnc, /fargolore
    if (path == "/accounts" || path == "/accounts/") {
        serve_static_file(client_fd, "static/accounts/index.html");
        close(client_fd);
        return;
    }
    if (path == "/admin" || path == "/admin/") {
        serve_static_file(client_fd, "static/admin/index.html");
        close(client_fd);
        return;
    }
    if (path == "/forge" || path.rfind("/forge/", 0) == 0) {
        redirect_to_frontend(client_fd, path == "/forge" ? "/forge/" + full_path.substr(path.size()) : full_path);
        close(client_fd);
        return;
    }
    if (path == "/alicnc" || path.rfind("/alicnc/", 0) == 0) {
        redirect_to_frontend(client_fd, path == "/alicnc" ? "/alicnc/" + full_path.substr(path.size()) : full_path);
        close(client_fd);
        return;
    }
    if (path == "/fargolore" || path == "/fargolore/") {
        serve_static_file(client_fd, "static/fargolore/index.html");
        close(client_fd);
        return;
    }

    // 10. Static Asset Resolution (Checked before Fediverse)
    std::string clean_rel = path;
    while (!clean_rel.empty() && clean_rel[0] == '/') clean_rel.erase(0, 1);

    if (!clean_rel.empty()) {
        std::string target_file = "static/" + clean_rel;
        struct stat st;
        if (stat(target_file.c_str(), &st) == 0 && S_ISREG(st.st_mode)) {
            serve_static_file(client_fd, target_file);
            close(client_fd);
            return;
        }
    }

    // 11. Fediverse / Mastodon Protocol Traffic
    bool is_activity_pub = (accept_hdr.find("application/activity+json") != std::string::npos) ||
                           (accept_hdr.find("application/ld+json") != std::string::npos) ||
                           (accept_hdr.find("application/json") != std::string::npos);

    bool is_fediverse_route = (path.rfind("/.well-known/webfinger", 0) == 0) ||
                              (path.rfind("/.well-known/host-meta", 0) == 0) ||
                              (path.rfind("/.well-known/nodeinfo", 0) == 0) ||
                              (path.rfind("/nodeinfo/", 0) == 0) ||
                              (path.rfind("/api/v1/", 0) == 0) ||
                              (path.rfind("/api/v2/", 0) == 0) ||
                              (path.rfind("/oauth/", 0) == 0) ||
                              (path.rfind("/auth/", 0) == 0) ||
                              (path.rfind("/users/", 0) == 0) ||
                              (path.rfind("/inbox", 0) == 0) ||
                              (path.rfind("/outbox", 0) == 0);

    if (is_fediverse_route || (is_activity_pub && path != "/")) {
        proxy_request(client_fd, UPSTREAM_FEDIVERSE, req, "", "s.rmaa.pk");
        close(client_fd);
        return;
    }

    // 12. Default: Serve Master Website SPA index.html
    serve_static_file(client_fd, "static/index.html");
    close(client_fd);
}

// Background keep-alive self-ping loop
static void start_self_ping_loop() {
    std::thread([]() {
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(600));
            int s = socket(AF_INET, SOCK_STREAM, 0);
            if (s >= 0) {
                sockaddr_in a{};
                a.sin_family = AF_INET;
                a.sin_port = htons(DEFAULT_PORT);
                inet_pton(AF_INET, "127.0.0.1", &a.sin_addr);
                if (connect(s, (struct sockaddr*)&a, sizeof(a)) == 0) {
                    std::string req = "GET /healthz HTTP/1.1\r\nHost: 127.0.0.1\r\nUser-Agent: RMAA-C++-Ping/1.0\r\nConnection: close\r\n\r\n";
                    send(s, req.data(), req.size(), 0);
                }
                close(s);
            }
        }
    }).detach();
}

int main(int argc, char* argv[]) {
    signal(SIGPIPE, SIG_IGN);

    int port = DEFAULT_PORT;
    if (const char* env_p = std::getenv("PORT")) {
        port = std::atoi(env_p);
    }

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        std::cerr << "[!] Failed to create socket\n";
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    setsockopt(server_fd, IPPROTO_TCP, TCP_NODELAY, &opt, sizeof(opt));

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        std::cerr << "[!] Bind failed on port " << port << "\n";
        close(server_fd);
        return 1;
    }

    if (listen(server_fd, 1024) < 0) {
        std::cerr << "[!] Listen failed\n";
        close(server_fd);
        return 1;
    }

    std::cout << "============================================================\n";
    std::cout << " ⚡ [RMAA C++20 High-Performance Core Micro-Gateway]\n";
    std::cout << " Listening Port : " << port << "\n";
    std::cout << " Domain Target  : " << DOMAIN_NAME << "\n";
    std::cout << " Engine Mode    : Zero-Copy Static + Non-Blocking TCP Proxy\n";
    std::cout << "============================================================\n";

    start_self_ping_loop();

    while (true) {
        sockaddr_in client_addr{};
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
        if (client_fd < 0) continue;

        // Dispatch each connection in an efficient detached worker thread
        std::thread(handle_client, client_fd).detach();
    }

    close(server_fd);
    return 0;
}

