// Serves the generated site (.output/public) under the same /MISS-ELS/ base
// path GitHub Pages uses, so the browser tests run against the real build.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "..", ".output", "public");
const base = "/MISS-ELS/";
const port = Number(process.env.PORT ?? 4173);

if (!existsSync(root)) {
  console.error("No build found. Run `npm run generate` first.");
  process.exit(1);
}

/** @type {Record<string, string>} */
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

/** @param {string} urlPath */
const resolveFile = (urlPath) => {
  const relative = normalize(decodeURIComponent(urlPath)).replace(
    /^[/\\]+/,
    "",
  );
  const candidates = [
    join(root, relative),
    join(root, relative, "index.html"),
    join(root, "200.html"), // SPA fallback
  ];
  return candidates.find(
    (file) =>
      file.startsWith(root) && existsSync(file) && statSync(file).isFile(),
  );
};

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (!pathname.startsWith(base)) {
    res.writeHead(302, { location: base }).end();
    return;
  }

  const file = resolveFile(pathname.slice(base.length));
  if (!file) {
    res.writeHead(404).end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": types[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}${base}`);
});
