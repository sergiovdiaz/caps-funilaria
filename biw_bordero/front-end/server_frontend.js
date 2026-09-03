import http from "http";
import fs from "fs";
import path from "path";
import url from "url";

const PORT = 5173;
const distPath = path.resolve("./dist");

// MIME types
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  if (pathname === "/") {
    pathname = "/index.html";
  }

  let filePath = path.join(distPath, pathname);

  //  Evita acessar fora do dist
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403);
    return res.end("Acesso negado");
  }

  fs.stat(filePath, (err, stats) => {
    //  CASO 1: version.json não existe → 404
    if ((err || !stats.isFile()) && pathname === "/version.json") {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "version.json não encontrado" }));
    }

    //  CASO 2: outras rotas → fallback SPA
    if (err || !stats.isFile()) {
      filePath = path.join(distPath, "index.html");
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end("Erro interno");
      }

      const headers = {
        "Content-Type": contentType,
      };

      //  Não deixar version.json cachear
      if (pathname === "/version.json") {
        headers["Cache-Control"] = "no-store";
      }

      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Rodando em http://localhost:${PORT}`);
});
