#!/usr/bin/env node

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(process.cwd());
const port = Number(process.env.PORT || 3000);
const host = "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const sendText = (response, statusCode, message) => {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
};

const sendFile = (response, filePath, statusCode = 200) => {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(response, 500, "Server error");
      return;
    }

    response.writeHead(statusCode, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(data);
  });
};

const resolveRequestPath = (urlPathname) => {
  let pathname;

  try {
    pathname = decodeURIComponent(urlPathname);
  } catch (error) {
    return { error: 400 };
  }

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.resolve(rootDir, `.${pathname}`);
  const relativePath = path.relative(rootDir, filePath);
  const outsideRoot = relativePath.startsWith("..") || path.isAbsolute(relativePath);

  return outsideRoot ? { error: 403 } : { filePath };
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  const resolved = resolveRequestPath(url.pathname);

  if (resolved.error === 400) {
    sendText(response, 400, "Bad request");
    return;
  }

  if (resolved.error === 403) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.stat(resolved.filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, resolved.filePath);
      return;
    }

    const notFoundPath = path.join(rootDir, "404.html");
    if (fs.existsSync(notFoundPath)) {
      sendFile(response, notFoundPath, 404);
      return;
    }

    sendText(response, 404, "Not found");
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    console.error("Stop the existing server or set another local port, for example:");
    console.error("  PORT=3001 npm run serve");
    process.exit(1);
  }

  throw error;
});

server.listen(port, host, () => {
  console.log(`Serving Rose & Paw Digital Designs at http://${host}:${port}/`);
  console.log("Press Ctrl+C to stop.");
});
