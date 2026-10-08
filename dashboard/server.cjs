const http = require("node:http");
const path = require("node:path");
const { Readable } = require("node:stream");
const { URL, pathToFileURL } = require("node:url");
const { readFile, readdir } = require("node:fs/promises");

const SAFE_PATH_SEGMENT = /^[A-Za-z0-9._-]+$/;
const DIST_DIR = path.join(__dirname, "dist", "client");
const SSR_ENTRY_FILE = path.join(__dirname, "dist", "server", "server.js");
const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || process.env.VITE_BASE_PATH || "/");
const ENFORCE_FORWARDED_PROTO =
  (process.env.ENFORCE_FORWARDED_PROTO || "true").toLowerCase() !== "false";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".csv": "text/csv; charset=utf-8",
};

function normalizeBasePath(input) {
  if (!input || input === "/") {
    return "/";
  }

  const withLeadingSlash = input.startsWith("/") ? input : `/${input}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function sanitizePathname(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return "/";
  }

  if (!pathname.startsWith("/")) {
    return "/";
  }

  if (/[\x00-\x1F\x7F]/.test(pathname)) {
    return "/";
  }

  if (pathname.includes("\\") || pathname.includes("..")) {
    return "/";
  }

  const parts = pathname.split("/").filter(Boolean);
  const normalized = [];

  for (const part of parts) {
    let decoded;
    try {
      decoded = decodeURIComponent(part);
    } catch {
      return "/";
    }

    if (!SAFE_PATH_SEGMENT.test(decoded)) {
      return "/";
    }

    normalized.push(decoded);
  }

  return normalized.length > 0 ? `/${normalized.join("/")}` : "/";
}

function stripBasePath(pathname, basePath = BASE_PATH) {
  if (basePath === "/") {
    return pathname;
  }

  if (pathname === basePath || pathname === `${basePath}/`) {
    return "/";
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }

  return pathname;
}

function resolveRequestTarget(requestUrl, basePath = BASE_PATH) {
  let pathname = "/";
  let search = "";

  try {
    const parsed = new URL(requestUrl || "/", "http://localhost");
    pathname = sanitizePathname(parsed.pathname || "/");
    search = parsed.search || "";
  } catch {
    pathname = "/";
    search = "";
  }

  return {
    pathname: stripBasePath(pathname, basePath),
    search,
  };
}

function resolveRequestPath(requestUrl, basePath = BASE_PATH) {
  return resolveRequestTarget(requestUrl, basePath).pathname;
}

async function loadStaticAssets(distDir = DIST_DIR) {
  const assets = new Map();

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const relativePath = path.relative(distDir, absolutePath).split(path.sep).join("/");
      const routePath = `/${relativePath}`;
      const ext = path.extname(absolutePath).toLowerCase();
      const content = await readFile(absolutePath);

      assets.set(routePath, {
        content,
        contentType: MIME_TYPES[ext] || "application/octet-stream",
        cacheControl: ext === ".html" ? "no-cache" : "public, max-age=3600",
      });
    }
  }

  await walk(distDir);
  return assets;
}

async function loadServerFetchHandler(ssrEntryFile = SSR_ENTRY_FILE) {
  const bundle = await import(pathToFileURL(ssrEntryFile).href);
  const fetchHandler = bundle && bundle.default && bundle.default.fetch;

  if (typeof fetchHandler !== "function") {
    throw new Error(`No fetch handler found in SSR bundle at ${ssrEntryFile}`);
  }

  return fetchHandler;
}

function applySecurityHeaders(res) {
  if (!res.hasHeader("X-Content-Type-Options")) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  if (!res.hasHeader("X-Frame-Options")) {
    res.setHeader("X-Frame-Options", "DENY");
  }
  if (!res.hasHeader("Referrer-Policy")) {
    res.setHeader("Referrer-Policy", "no-referrer");
  }
  if (!res.hasHeader("Content-Security-Policy")) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
    );
  }
  if (!res.hasHeader("Strict-Transport-Security")) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function sendJson(res, statusCode, body) {
  applySecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, body) {
  applySecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}

function sendAsset(res, method, asset) {
  applySecurityHeaders(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", asset.contentType);
  res.setHeader("Cache-Control", asset.cacheControl);

  if (method === "HEAD") {
    res.end();
    return;
  }

  res.end(asset.content);
}

function rejectsForwardedHttp(req, enforceForwardedProto = ENFORCE_FORWARDED_PROTO) {
  if (!enforceForwardedProto) {
    return false;
  }

  const headerValue = req.headers["x-forwarded-proto"];
  if (typeof headerValue !== "string") {
    return false;
  }

  const forwardedProto = headerValue.split(",")[0].trim().toLowerCase();
  return Boolean(forwardedProto) && forwardedProto !== "https";
}

function createWorkerRequest(req, target) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      headers.set(name, value.join(", "));
      continue;
    }
    if (typeof value === "string") {
      headers.set(name, value);
    }
  }

  const method = (req.method || "GET").toUpperCase();
  const init = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }

  return new Request(`http://localhost${target.pathname}${target.search}`, init);
}

async function sendWorkerResponse(res, method, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  applySecurityHeaders(res);

  if (method === "HEAD" || !response.body) {
    res.end();
    return;
  }

  await new Promise((resolve, reject) => {
    Readable.fromWeb(response.body).pipe(res);
    res.once("finish", resolve);
    res.once("error", reject);
  });
}

async function startServer(options = {}) {
  const {
    port = PORT,
    distDir = DIST_DIR,
    ssrEntryFile = SSR_ENTRY_FILE,
    basePath = BASE_PATH,
    enforceForwardedProto = ENFORCE_FORWARDED_PROTO,
  } = options;

  const [assets, workerFetch] = await Promise.all([
    loadStaticAssets(distDir),
    loadServerFetchHandler(ssrEntryFile),
  ]);

  const server = http.createServer(async (req, res) => {
    try {
      if (rejectsForwardedHttp(req, enforceForwardedProto)) {
        sendText(res, 400, "HTTPS required");
        return;
      }

      if (!req.url) {
        sendText(res, 400, "Bad request");
        return;
      }

      const method = (req.method || "GET").toUpperCase();
      const target = resolveRequestTarget(req.url, basePath);

      if (target.pathname === "/health" || target.pathname === "/healthz") {
        sendJson(res, 200, { status: "healthy" });
        return;
      }

      if (method === "GET" || method === "HEAD") {
        const asset = assets.get(target.pathname);
        if (asset) {
          sendAsset(res, method, asset);
          return;
        }
      }

      const requestForWorker = createWorkerRequest(req, target);
      const response = await workerFetch(requestForWorker, {});
      await sendWorkerResponse(res, method, response);
    } catch (error) {
      console.error("Frontend request handling failed", error);
      sendText(res, 500, "Internal server error");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer()
    .then((server) => {
      process.on("SIGTERM", () => {
        server.close(() => process.exit(0));
      });
    })
    .catch((error) => {
      console.error("Failed to start frontend server", error);
      process.exit(1);
    });
}

module.exports = {
  normalizeBasePath,
  sanitizePathname,
  stripBasePath,
  resolveRequestPath,
  resolveRequestTarget,
  loadStaticAssets,
  loadServerFetchHandler,
  startServer,
};
