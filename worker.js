import { connect } from "cloudflare:sockets";

// Variables
let serviceName = "";
let APP_DOMAIN = "";
let prxIP = "";

// Constants
const horse = "dHJvamFu";
const flash = "dm1lc3M=";
const v2 = "djJyYXk=";
const neko = "Y2xhc2g=";

const PORTS = [443, 80];
const PROTOCOLS = [atob(horse), atob(flash), "ss"];

// ⚠️ GANTI DENGAN URL RAW JSON ANDA ⚠️
const PROXY_LIST_URL = "https://raw.githubusercontent.com/USERNAME-ANDA/REPO-ANDA/main/proxy-list.json";
const SUB_PAGE_URL = "https://your-subscription-page.com";

const DNS_SERVER_ADDRESS = "8.8.8.8";
const DNS_SERVER_PORT = 53;
const RELAY_SERVER_UDP = {
  host: "udp-relay.hobihaus.space",
  port: 7300,
};

const CORS_HEADER_OPTIONS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Ambil proxy list Indonesia dari JSON
async function getPrxListID() {
  try {
    const response = await fetch(PROXY_LIST_URL);
    if (response.status == 200) {
      const data = await response.json();
      return data.ID || []; // Ambil hanya array ID
    }
    return [];
  } catch (error) {
    console.error(`Error fetching proxy list: ${error}`);
    return [];
  }
}

// Fungsi untuk mendapatkan random proxy Indonesia
async function getRandomIDProxy() {
  const proxies = await getPrxListID();
  if (proxies.length > 0) {
    return proxies[Math.floor(Math.random() * proxies.length)];
  }
  return null;
}

// ... (websocketHandler dan fungsi-fungsi lainnya TETAP SAMA)

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      APP_DOMAIN = url.hostname;
      serviceName = APP_DOMAIN.split(".")[0];

      const upgradeHeader = request.headers.get("Upgrade");

      // Handle proxy client - otomatis pakai proxy Indonesia
      if (upgradeHeader === "websocket") {
        const randomProxy = await getRandomIDProxy();
        if (randomProxy) {
          prxIP = randomProxy;
        } else {
          return new Response("Tidak ada proxy Indonesia yang tersedia", { status: 404 });
        }
        return await websocketHandler(request);
      }

      // Endpoints
      if (url.pathname.startsWith("/sub")) {
        return Response.redirect(SUB_PAGE_URL + `?host=${APP_DOMAIN}&country=ID`, 301);
      
      } else if (url.pathname.startsWith("/api/v1/sub")) {
        // Subscription khusus Indonesia
        const filterPort = url.searchParams.get("port")?.split(",") || PORTS;
        const filterVPN = url.searchParams.get("vpn")?.split(",") || PROTOCOLS;
        const filterLimit = parseInt(url.searchParams.get("limit")) || 20;
        const filterFormat = url.searchParams.get("format") || "raw";
        const fillerDomain = url.searchParams.get("domain") || APP_DOMAIN;

        const prxList = await getPrxListID();
        
        if (prxList.length === 0) {
          return new Response("Tidak ada proxy Indonesia yang tersedia", { 
            status: 404,
            headers: CORS_HEADER_OPTIONS
          });
        }

        const uuid = crypto.randomUUID();
        const result = [];
        
        for (const proxy of prxList.slice(0, filterLimit)) {
          const [ip, port] = proxy.split(":");
          
          for (const p of filterPort) {
            for (const protocol of filterVPN) {
              if (result.length >= filterLimit) break;

              const uri = new URL(`${protocol}://${fillerDomain}`);
              uri.port = p.toString();
              
              if (protocol === "ss") {
                uri.username = btoa(`none:${uuid}`);
                uri.searchParams.set(
                  "plugin",
                  `${atob(v2)}-plugin${p == 80 ? "" : ";tls"};mux=0;mode=websocket;path=/${ip}-${port};host=${APP_DOMAIN}`
                );
              } else {
                uri.username = uuid;
                uri.searchParams.set("encryption", "none");
                uri.searchParams.set("type", "ws");
                uri.searchParams.set("host", APP_DOMAIN);
                uri.searchParams.set("security", p == 443 ? "tls" : "none");
                uri.searchParams.set("sni", p == 80 && protocol == atob(flash) ? "" : APP_DOMAIN);
                uri.searchParams.set("path", `/${ip}-${port}`);
              }

              uri.hash = `${result.length + 1} 🇮🇩 Indonesia WS ${p == 443 ? "TLS" : "NTLS"} [${serviceName}]`;
              result.push(uri.toString());
            }
          }
        }

        let finalResult = result.join("\n");
        
        if (filterFormat === atob(v2)) {
          finalResult = btoa(finalResult);
        } else if (filterFormat === "clash" || filterFormat === "sf" || filterFormat === "bf") {
          // Konversi ke format lain jika needed
          finalResult = `# Indonesian Proxies Only\n${finalResult}`;
        }

        return new Response(finalResult, {
          status: 200,
          headers: CORS_HEADER_OPTIONS
        });

      } else if (url.pathname.startsWith("/api/v1/myip")) {
        return new Response(
          JSON.stringify({
            ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip"),
            country: "ID",
            colo: request.headers.get("cf-ray")?.split("-")[1],
            service: serviceName
          }),
          {
            headers: {
              ...CORS_HEADER_OPTIONS,
              "Content-Type": "application/json",
            },
          }
        );
      
      } else if (url.pathname.startsWith("/api/v1/proxies")) {
        // Endpoint untuk melihat list proxy tersedia
        const prxList = await getPrxListID();
        return new Response(
          JSON.stringify({
            total: prxList.length,
            country: "ID",
            proxies: prxList.slice(0, 50) // Tampilkan max 50
          }),
          {
            headers: {
              ...CORS_HEADER_OPTIONS,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Default response page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🇮🇩 Indonesian Proxy Worker</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { background: #e70000; color: white; padding: 20px; border-radius: 10px; text-align: center; }
                .endpoints { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                a { color: #e70000; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🇮🇩 Indonesian Proxy Worker</h1>
                <p>Domain: ${APP_DOMAIN} | Service: ${serviceName}</p>
            </div>
            
            <h2>📡 Endpoints Tersedia:</h2>
            <div class="endpoints">
                <p><strong><a href="/sub">/sub</a></strong> - Halaman subscription</p>
                <p><strong><a href="/api/v1/sub">/api/v1/sub</a></strong> - Raw subscription (Indonesia only)</p>
                <p><strong><a href="/api/v1/myip">/api/v1/myip</a></strong> - Cek IP Anda</p>
                <p><strong><a href="/api/v1/proxies">/api/v1/proxies</a></strong> - List proxy tersedia</p>
                <p><strong>WebSocket</strong> - Auto menggunakan proxy Indonesia</p>
            </div>
            
            <p><strong>🔥 Khusus Proxy Indonesia - ${(await getPrxListID()).length} proxies tersedia!</strong></p>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
          ...CORS_HEADER_OPTIONS
        }
      });

    } catch (err) {
      return new Response(`Error: ${err.toString()}`, {
        status: 500,
        headers: CORS_HEADER_OPTIONS,
      });
    }
  },
};

// ... (Fungsi-fungsi berikutnya TETAP SAMA seperti script asli)
// websocketHandler, protocolSniffer, handleTCPOutBound, handleUDPOutbound, 
// makeReadableWebSocketStream, readSsHeader, readFlashHeader, readHorseHeader,
// remoteSocketToWS, safeCloseWebSocket, base64ToArrayBuffer, arrayBufferToHex