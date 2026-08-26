/** Servidor estático mínimo, só para desenvolvimento. O produto publicado não usa servidor. */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const raiz = fileURLToPath(new URL("../", import.meta.url));
const TIPOS = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".css": "text/css", ".js": "text/javascript" };
createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  if (p.includes("..")) { res.writeHead(400).end(); return; }
  try {
    const buf = readFileSync(raiz + p.slice(1));
    res.writeHead(200, { "content-type": TIPOS[p.slice(p.lastIndexOf("."))] || "application/octet-stream",
                         "cache-control": "no-store" });
    res.end(buf);
  } catch { res.writeHead(404, { "content-type": "text/plain" }).end("404"); }
}).listen(8731, () => console.log("dev server em http://localhost:8731"));
